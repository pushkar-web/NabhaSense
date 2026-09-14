from fastapi import APIRouter
from concurrent.futures import ThreadPoolExecutor
from app.models.predictor import HeatPredictor
from app.models.mortality_predictor import MortalityRiskPredictor
from app.models.hsri_calculator import compute_hazard_index, compute_hsri
from app.models.heat_action_plan import generate_action_plan
from app.data.real_data import get_real_city_data, fetch_forecast, CITIES
from app.data.demographics import (
    get_city_demographics, get_city_exposure_baseline, get_ward_demographics,
    vulnerability_multiplier, compute_vulnerability_index, compute_exposure_index,
)
from app.utils.thermal_indices import get_thermal_stress_index
from app.utils.utci import utci_approx, classify_utci_stress
from app.utils.acclimatization import classify_wbgt_stress_localized, classify_utci_stress_localized
from app.services.alert_service import build_alert_message, send_alert

router = APIRouter()
predictor = HeatPredictor()
mortality_predictor = MortalityRiskPredictor()


def _compute_thermal_with_utci(city, temp_c, rh_pct, wind_speed_ms, shortwave_wm2):
    """
    WBGT + Heat Index + UTCI, all from one weather reading — stress
    categories are acclimatization-adjusted per city (see utils/acclimatization.py),
    implementing the 2008 review paper's insight that heat-mortality
    thresholds are climate/location-dependent, not universal.
    """
    thermal = get_thermal_stress_index(temp_c, rh_pct, wind_speed_ms, shortwave_wm2)
    utci_result = utci_approx(temp_c, rh_pct, wind_speed_ms, shortwave_wm2)
    thermal["utci"] = utci_result["utci"]
    thermal["utciNote"] = utci_result["utciNote"]

    wbgt_localized = classify_wbgt_stress_localized(thermal["wbgt"], city)
    utci_localized = classify_utci_stress_localized(utci_result["utci"], city)
    thermal["stressCategory"] = wbgt_localized["category"]
    thermal["utciStressCategory"] = utci_localized["category"]
    thermal["acclimatizationShift"] = wbgt_localized["acclimatizationShift"]
    return thermal


@router.get("/analysis/{city}")
async def get_heat_analysis(city: str):
    real_data = get_real_city_data(city)

    ml_input = {
        "lst": real_data["historical_lst"]["avg_lst"],
        "ndvi": real_data["derived_metrics"]["ndvi"],
        "ndbi": real_data["derived_metrics"]["ndbi"],
        "humidity": real_data["real_weather"]["humidity"],
        "buildingDensity": 65.0,
    }
    ml_result = predictor.predict(ml_input)
    base_analysis = predictor.get_city_analysis(city)

    thermal = _compute_thermal_with_utci(
        city,
        temp_c=real_data["real_weather"]["temperature"],
        rh_pct=real_data["real_weather"]["humidity"],
        wind_speed_ms=real_data["real_weather"]["wind_speed"],
        shortwave_wm2=real_data["real_weather"].get("shortwave_radiation", 400.0),
    )
    demographics = get_city_demographics(city)
    mortality = mortality_predictor.predict(
        wbgt=thermal["wbgt"],
        heat_index=thermal["heatIndex"],
        elderly_pct=demographics["elderlyPct"],
        outdoor_worker_pct=demographics["outdoorWorkerPct"],
    )

    return {
        "city": real_data["city"],
        "state": real_data["state"],
        "currentTemp": real_data["real_weather"]["temperature"],
        "apparentTemp": real_data["real_weather"]["apparent_temp"],
        "humidity": real_data["real_weather"]["humidity"],
        "windSpeed": real_data["real_weather"]["wind_speed"],
        "avgLST": real_data["historical_lst"]["avg_lst"],
        "maxLST": real_data["historical_lst"]["max_lst"],
        "minLST": real_data["historical_lst"]["min_lst"],
        "lstPeriod": real_data["historical_lst"]["period"],
        "ndvi": real_data["derived_metrics"]["ndvi"],
        "ndbi": real_data["derived_metrics"]["ndbi"],
        "suhii": real_data["derived_metrics"]["suhii"],
        "heatStressIndex": real_data["derived_metrics"]["heat_stress_index"],
        "mlRiskLevel": ml_result["riskLevel"],
        "mlConfidence": ml_result["confidence"],
        "recommendations": ml_result["recommendations"],
        "hotspotCount": base_analysis["hotspotCount"],
        "riskDistribution": base_analysis["riskDistribution"],
        "dominantDriver": base_analysis["dominantDriver"],
        "coolingPotential": base_analysis["coolingPotential"],
        "affectedPopulation": base_analysis["affectedPopulation"],
        "thermalStress": thermal,
        "mortalityRisk": mortality,
        "demographics": demographics,
        "dataSource": real_data["real_weather"]["source"],
        "dataQuality": real_data["data_quality"],
        "lastUpdated": real_data["last_updated"],
    }


@router.get("/thermal/{city}")
async def get_thermal_analysis(city: str):
    """WBGT + Heat Index + UTCI breakdown for a city, standalone."""
    real_data = get_real_city_data(city)
    thermal = _compute_thermal_with_utci(
        city,
        temp_c=real_data["real_weather"]["temperature"],
        rh_pct=real_data["real_weather"]["humidity"],
        wind_speed_ms=real_data["real_weather"]["wind_speed"],
        shortwave_wm2=real_data["real_weather"].get("shortwave_radiation", 400.0),
    )
    return {
        "city": real_data["city"],
        "currentTemp": real_data["real_weather"]["temperature"],
        "humidity": real_data["real_weather"]["humidity"],
        **thermal,
    }


@router.get("/mortality/{city}")
async def get_mortality_risk(city: str):
    """
    Mortality Risk Index (ML) + HSRI (Hazard x VI x EI, research-grounded)
    at city and ward level.
    """
    real_data = get_real_city_data(city)
    thermal = _compute_thermal_with_utci(
        city,
        temp_c=real_data["real_weather"]["temperature"],
        rh_pct=real_data["real_weather"]["humidity"],
        wind_speed_ms=real_data["real_weather"]["wind_speed"],
        shortwave_wm2=real_data["real_weather"].get("shortwave_radiation", 400.0),
    )
    hazard_index = compute_hazard_index(thermal["wbgt"], thermal["utci"])

    city_demo = get_city_demographics(city)
    city_mortality = mortality_predictor.predict(
        wbgt=thermal["wbgt"],
        heat_index=thermal["heatIndex"],
        elderly_pct=city_demo["elderlyPct"],
        outdoor_worker_pct=city_demo["outdoorWorkerPct"],
    )
    city_exposure = get_city_exposure_baseline(city)
    city_vi = compute_vulnerability_index(city_demo["elderlyPct"], city_demo["population"], city_demo["population"])
    city_ei = compute_exposure_index(
        city_exposure["marginalWorkerPct"], city_exposure["illiteracyPct"], city_exposure["poorHousingPct"],
        city_exposure["noElectricityPct"], city_exposure["noWaterAccessPct"],
    )
    city_hsri = compute_hsri(hazard_index, city_vi, city_ei)

    ward_list = get_ward_demographics(city)
    avg_ward_pop = sum(w["population"] for w in ward_list) / len(ward_list)

    ward_results = []
    for ward in ward_list:
        ward_mortality = mortality_predictor.predict(
            wbgt=thermal["wbgt"],
            heat_index=thermal["heatIndex"],
            elderly_pct=ward["elderlyPct"],
            outdoor_worker_pct=ward["outdoorWorkerPct"],
        )
        ward_vi = compute_vulnerability_index(ward["elderlyPct"], ward["population"], avg_ward_pop)
        ward_ei = compute_exposure_index(
            ward["marginalWorkerPct"], ward["illiteracyPct"], ward["poorHousingPct"],
            ward["noElectricityPct"], ward["noWaterAccessPct"],
        )
        ward_hsri = compute_hsri(hazard_index, ward_vi, ward_ei)

        ward_results.append({
            **ward,
            "vulnerabilityMultiplier": vulnerability_multiplier(ward["elderlyPct"], ward["outdoorWorkerPct"]),
            "mortalityRiskIndex": ward_mortality["mortalityRiskIndex"],
            "hospitalizationSpikeProbability": ward_mortality["hospitalizationSpikeProbability"],
            "riskTier": ward_mortality["riskTier"],
            "hsri": ward_hsri["hsri"],
            "hsriTier": ward_hsri["hsriTier"],
            "vulnerabilityIndex": ward_vi,
            "exposureIndex": ward_ei,
        })

    ward_results.sort(key=lambda w: w["mortalityRiskIndex"], reverse=True)

    return {
        "city": real_data["city"],
        "wbgt": thermal["wbgt"],
        "utci": thermal["utci"],
        "heatIndex": thermal["heatIndex"],
        "cityLevel": {
            **city_demo,
            "vulnerabilityMultiplier": vulnerability_multiplier(city_demo["elderlyPct"], city_demo["outdoorWorkerPct"]),
            **city_mortality,
            "hsri": city_hsri["hsri"],
            "hsriTier": city_hsri["hsriTier"],
            "vulnerabilityIndex": city_vi,
            "exposureIndex": city_ei,
            "hazardIndex": hazard_index,
        },
        "hsriFormula": city_hsri["formula"],
        "wardLevel": ward_results,
    }


@router.get("/forecast/{city}")
async def get_heat_forecast(city: str, days: int = 5, include_wards: bool = True):
    """
    3-5 day heat-mortality forecast (PS26083 core requirement).

    include_wards=True also recomputes ward-level HSRI for each forecast
    day — directly answering the 2026 Mumbai paper's own open question:
    "Can we move from static ward-level risk mapping toward finer-grained,
    dynamic, forecast-based heat-risk warnings?" Their ward-level HSRI was
    a one-time snapshot; here it's recomputed against each of the next
    3-5 days' predicted WBGT/UTCI.
    """
    city_info = CITIES.get(city.lower(), CITIES["mumbai"])
    demographics = get_city_demographics(city)
    exposure = get_city_exposure_baseline(city)
    days = max(3, min(days, 7))

    ward_list = get_ward_demographics(city) if include_wards else []
    avg_ward_pop = sum(w["population"] for w in ward_list) / len(ward_list) if ward_list else 1

    raw_days = fetch_forecast(city_info["lat"], city_info["lng"], days=days)

    forecast = []
    for day in raw_days:
        thermal = _compute_thermal_with_utci(
            city,
            temp_c=day["peakTemp"],
            rh_pct=day["peakHumidity"],
            wind_speed_ms=day["windSpeed"],
            shortwave_wm2=day["shortwaveRadiation"],
        )
        mortality = mortality_predictor.predict(
            wbgt=thermal["wbgt"],
            heat_index=thermal["heatIndex"],
            elderly_pct=demographics["elderlyPct"],
            outdoor_worker_pct=demographics["outdoorWorkerPct"],
        )

        ward_forecast = []
        if include_wards:
            hazard_index = compute_hazard_index(thermal["wbgt"], thermal["utci"])
            for ward in ward_list:
                ward_vi = compute_vulnerability_index(ward["elderlyPct"], ward["population"], avg_ward_pop)
                ward_ei = compute_exposure_index(
                    ward["marginalWorkerPct"], ward["illiteracyPct"], ward["poorHousingPct"],
                    ward["noElectricityPct"], ward["noWaterAccessPct"],
                )
                ward_hsri = compute_hsri(hazard_index, ward_vi, ward_ei)
                ward_forecast.append({
                    "ward": ward["ward"],
                    "hsri": ward_hsri["hsri"],
                    "hsriTier": ward_hsri["hsriTier"],
                })
            ward_forecast.sort(key=lambda w: w["hsri"], reverse=True)

        forecast.append({
            "date": day["date"],
            "peakTemp": day["peakTemp"],
            "peakHumidity": day["peakHumidity"],
            "wbgt": thermal["wbgt"],
            "utci": thermal["utci"],
            "heatIndex": thermal["heatIndex"],
            "stressCategory": thermal["stressCategory"],
            "utciStressCategory": thermal["utciStressCategory"],
            "mortalityRiskIndex": mortality["mortalityRiskIndex"],
            "hospitalizationSpikeProbability": mortality["hospitalizationSpikeProbability"],
            "riskTier": mortality["riskTier"],
            "wardForecast": ward_forecast,
        })

    worst_day = max(forecast, key=lambda d: d["mortalityRiskIndex"]) if forecast else None

    return {
        "city": city.capitalize(),
        "forecastDays": len(forecast),
        "forecast": forecast,
        "worstDay": worst_day,
        "source": "Open-Meteo Forecast API (hourly, peak-hour-per-day)",
    }


@router.get("/action-plan/{city}")
async def get_action_plan(city: str):
    """
    Automated Heat Action Plan advisory (PS26083 requirement #7): cooling
    center activation, outdoor-work-hour advisory, and power-grid alert,
    generated from the current WBGT/UTCI stress category and Mortality
    Risk Index.
    """
    real_data = get_real_city_data(city)
    thermal = _compute_thermal_with_utci(
        city,
        temp_c=real_data["real_weather"]["temperature"],
        rh_pct=real_data["real_weather"]["humidity"],
        wind_speed_ms=real_data["real_weather"]["wind_speed"],
        shortwave_wm2=real_data["real_weather"].get("shortwave_radiation", 400.0),
    )
    demographics = get_city_demographics(city)
    mortality = mortality_predictor.predict(
        wbgt=thermal["wbgt"],
        heat_index=thermal["heatIndex"],
        elderly_pct=demographics["elderlyPct"],
        outdoor_worker_pct=demographics["outdoorWorkerPct"],
    )

    plan = generate_action_plan(
        city=city,
        stress_category=thermal["stressCategory"],
        wbgt=thermal["wbgt"],
        utci=thermal["utci"],
        mortality_risk_index=mortality["mortalityRiskIndex"],
        hospitalization_spike_prob=mortality["hospitalizationSpikeProbability"],
        elderly_pct=demographics["elderlyPct"],
        outdoor_worker_pct=demographics["outdoorWorkerPct"],
        population=demographics["population"],
    )
    return plan


@router.get("/alert/preview/{city}")
async def preview_alert(city: str, channel: str = "sms"):
    """
    Preview the exact SMS/WhatsApp message that would go out for a city's
    current conditions, plus whether it should auto-trigger (any alert
    level above 'Watch').
    """
    plan = await get_action_plan(city)
    message = build_alert_message(plan, channel)
    should_trigger = plan["overallAlertLevel"] != "Watch"

    return {
        "city": plan["city"],
        "channel": channel,
        "overallAlertLevel": plan["overallAlertLevel"],
        "shouldTrigger": should_trigger,
        "message": message,
    }


@router.post("/alert/send")
async def send_city_alert(data: dict):
    """
    Send (or, without Twilio credentials configured, simulate) an SMS/
    WhatsApp alert for a city's current Heat Action Plan. Body:
    { "city": "mumbai", "toNumber": "+91XXXXXXXXXX", "channel": "sms" }
    """
    city = data.get("city", "mumbai")
    to_number = data.get("toNumber", "")
    channel = data.get("channel", "sms")

    if not to_number:
        return {"status": "failed", "error": "toNumber is required"}

    plan = await get_action_plan(city)
    result = send_alert(plan, to_number, channel)
    return result


@router.post("/action-plan/simulate")
async def simulate_action_plan(data: dict):
    """
    Test a mitigation scenario against the Heat Action Plan: apply the same
    cooling-intervention physics as /heat/simulate, then re-run the WBGT ->
    mortality -> action-plan pipeline on the adjusted temperature to show
    whether the intervention would downgrade the alert level.
    """
    city = data.get("city", "mumbai")
    base_temp = data.get("baseTemp", 36.0)
    humidity = data.get("humidity", 60.0)
    wind_speed = data.get("windSpeed", 10.0)
    shortwave = data.get("shortwaveRadiation", 400.0)
    elderly_pct = data.get("elderlyPct", 8.0)
    outdoor_worker_pct = data.get("outdoorWorkerPct", 22.0)
    population = data.get("population", 1000000)

    tree_cover_increase = data.get("treeCoverIncrease", 0)
    cool_roof_percentage = data.get("coolRoofPercentage", 0)
    water_body_increase = data.get("waterBodyIncrease", 0)
    albedo_increase = data.get("albedoIncrease", 0)

    tree_cooling = (tree_cover_increase / 10) * 0.5
    cool_roof_cooling = (cool_roof_percentage / 100) * (albedo_increase * 8)
    water_cooling = (water_body_increase / 5) * 0.3
    total_cooling = round(tree_cooling + cool_roof_cooling + water_cooling, 2)

    adjusted_temp = round(base_temp - total_cooling, 2)

    before_thermal = _compute_thermal_with_utci(city, base_temp, humidity, wind_speed, shortwave)
    after_thermal = _compute_thermal_with_utci(city, adjusted_temp, humidity, wind_speed, shortwave)

    before_mortality = mortality_predictor.predict(before_thermal["wbgt"], before_thermal["heatIndex"], elderly_pct, outdoor_worker_pct)
    after_mortality = mortality_predictor.predict(after_thermal["wbgt"], after_thermal["heatIndex"], elderly_pct, outdoor_worker_pct)

    before_plan = generate_action_plan(city, before_thermal["stressCategory"], before_thermal["wbgt"], before_thermal["utci"],
                                        before_mortality["mortalityRiskIndex"], before_mortality["hospitalizationSpikeProbability"],
                                        elderly_pct, outdoor_worker_pct, population)
    after_plan = generate_action_plan(city, after_thermal["stressCategory"], after_thermal["wbgt"], after_thermal["utci"],
                                       after_mortality["mortalityRiskIndex"], after_mortality["hospitalizationSpikeProbability"],
                                       elderly_pct, outdoor_worker_pct, population)

    return {
        "totalCooling": total_cooling,
        "before": {"temp": base_temp, "thermal": before_thermal, "mortality": before_mortality, "plan": before_plan},
        "after": {"temp": adjusted_temp, "thermal": after_thermal, "mortality": after_mortality, "plan": after_plan},
        "alertDowngraded": before_plan["overallAlertLevel"] != after_plan["overallAlertLevel"],
    }


@router.get("/hotspots/{city}")
async def get_hotspots(city: str):
    return predictor.get_hotspots(city)


@router.get("/interventions/{city}")
async def get_interventions(city: str):
    return predictor.get_cooling_interventions(city)


@router.post("/predict")
async def predict_heat_risk(data: dict):
    return predictor.predict(data)


@router.get("/realdata/{city}")
async def get_real_data(city: str):
    return get_real_city_data(city)


def _build_comparison_entry(city: str) -> dict:
    """Per-city work for /compare — extracted so it can run in a thread pool."""
    real_data = get_real_city_data(city)
    thermal = _compute_thermal_with_utci(
        city,
        temp_c=real_data["real_weather"]["temperature"],
        rh_pct=real_data["real_weather"]["humidity"],
        wind_speed_ms=real_data["real_weather"]["wind_speed"],
        shortwave_wm2=real_data["real_weather"].get("shortwave_radiation", 400.0),
    )
    demographics = get_city_demographics(city)
    mortality = mortality_predictor.predict(
        wbgt=thermal["wbgt"],
        heat_index=thermal["heatIndex"],
        elderly_pct=demographics["elderlyPct"],
        outdoor_worker_pct=demographics["outdoorWorkerPct"],
    )
    exposure = get_city_exposure_baseline(city)
    vi = compute_vulnerability_index(demographics["elderlyPct"], demographics["population"], demographics["population"])
    ei = compute_exposure_index(
        exposure["marginalWorkerPct"], exposure["illiteracyPct"], exposure["poorHousingPct"],
        exposure["noElectricityPct"], exposure["noWaterAccessPct"],
    )
    hazard_index = compute_hazard_index(thermal["wbgt"], thermal["utci"])
    hsri = compute_hsri(hazard_index, vi, ei)

    return {
        "city": real_data["city"],
        "currentTemp": real_data["real_weather"]["temperature"],
        "avgLST": real_data["historical_lst"]["avg_lst"],
        "suhii": real_data["derived_metrics"]["suhii"],
        "ndvi": real_data["derived_metrics"]["ndvi"],
        "ndbi": real_data["derived_metrics"]["ndbi"],
        "wbgt": thermal["wbgt"],
        "utci": thermal["utci"],
        "stressCategory": thermal["stressCategory"],
        "mortalityRiskIndex": mortality["mortalityRiskIndex"],
        "riskTier": mortality["riskTier"],
        "hsri": hsri["hsri"],
        "hsriTier": hsri["hsriTier"],
        "dataQuality": real_data["data_quality"],
    }


@router.get("/compare")
async def compare_cities(cities: str = "mumbai,delhi,bangalore"):
    """
    Multi-city comparison — includes WBGT, UTCI, Mortality Risk Index and
    HSRI alongside LST/NDVI/NDBI/SUHII, so cities compare on actual human
    thermal-stress and health-risk terms, not just raw surface temperature.

    Fetches all cities' weather CONCURRENTLY via a thread pool instead of
    one-after-another — this was the single biggest cause of City
    Comparison taking minutes: up to 7 cities x multiple sequential
    blocking network calls each, now running in parallel.
    """
    city_list = [c.strip() for c in cities.split(",")][:7]
    with ThreadPoolExecutor(max_workers=len(city_list) or 1) as executor:
        results = list(executor.map(_build_comparison_entry, city_list))
    return {"comparison": results}


@router.post("/simulate")
async def simulate_cooling(data: dict):
    city = data.get("city", "mumbai")
    base_lst = data.get("baseLST", 38.0)

    tree_cover_increase = data.get("treeCoverIncrease", 0)
    cool_roof_percentage = data.get("coolRoofPercentage", 0)
    water_body_increase = data.get("waterBodyIncrease", 0)
    albedo_increase = data.get("albedoIncrease", 0)

    tree_cooling = (tree_cover_increase / 10) * 0.5
    cool_roof_cooling = (cool_roof_percentage / 100) * (albedo_increase * 8)
    water_cooling = (water_body_increase / 5) * 0.3

    total_cooling = round(tree_cooling + cool_roof_cooling + water_cooling, 2)
    new_lst = round(base_lst - total_cooling, 2)

    if new_lst < 33:
        new_risk = "Low"
    elif new_lst < 38:
        new_risk = "Medium"
    elif new_lst < 44:
        new_risk = "High"
    else:
        new_risk = "Extreme"

    return {
        "city": city.capitalize(),
        "baseLST": base_lst,
        "newLST": new_lst,
        "totalCooling": total_cooling,
        "breakdown": {
            "treeCooling": round(tree_cooling, 2),
            "coolRoofCooling": round(cool_roof_cooling, 2),
            "waterCooling": round(water_cooling, 2),
        },
        "originalRisk": data.get("originalRisk", "High"),
        "newRisk": new_risk,
        "co2Saved": round(tree_cover_increase * 2.5, 1),
        "populationBenefited": round(data.get("population", 100000) * (total_cooling / 10), 0),
    }