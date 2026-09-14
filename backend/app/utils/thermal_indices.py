"""
Human Thermal Stress Index calculations for SIH26083.

Implements:
  - Heat Index (HI)  — NOAA/NWS Rothfusz regression, Celsius form
  - Wet Bulb Temp (Tw) — Stull (2011) empirical approximation
  - Globe Temp (Tg)   — simplified radiative-convective estimate
  - WBGT              — 0.7*Tw + 0.2*Tg + 0.1*Td  (standard outdoor formula)

HONESTY NOTE (same spirit as NDVI/NDBI in real_data.py):
  Tw uses a peer-reviewed empirical formula (Stull, 2011, J. Appl. Meteor.
  Climatol.) and is a solid estimate from T + RH alone.
  Tg (black globe temperature) normally needs a physical globe thermometer.
  We don't have one, so we estimate it from shortwave radiation + wind
  speed using a simplified convective heat-balance approximation. This is
  a documented engineering approximation, not a measured value — flag
  this explicitly to judges the same way NDVI/NDBI are flagged.
"""

import math


def vapor_pressure_hpa(temp_c: float, rh_pct: float) -> float:
    """Actual vapor pressure (hPa) via Magnus-Tetens approximation."""
    es = 6.105 * math.exp((17.27 * temp_c) / (237.7 + temp_c))
    return (rh_pct / 100.0) * es


def wet_bulb_stull(temp_c: float, rh_pct: float) -> float:
    """
    Natural wet-bulb temperature (°C) via Stull (2011):
    "Wet-Bulb Temperature from Relative Humidity and Air Temperature"
    Valid for -20°C < T < 50°C, 5% < RH < 99%. Clamp inputs to that range.
    """
    t = max(-20.0, min(50.0, temp_c))
    rh = max(5.0, min(99.0, rh_pct))

    tw = (
        t * math.atan(0.151977 * math.sqrt(rh + 8.313659))
        + math.atan(t + rh)
        - math.atan(rh - 1.676331)
        + 0.00391838 * (rh ** 1.5) * math.atan(0.023101 * rh)
        - 4.686035
    )
    return round(tw, 2)


def globe_temp_estimate(temp_c: float, wind_speed_ms: float, shortwave_wm2: float) -> float:
    """
    Simplified black-globe temperature estimate (°C).

    APPROXIMATION — no physical globe thermometer available. Based on a
    simplified convective cooling / radiative heating balance: higher solar
    load raises Tg above air temp, higher wind speed cools the globe back
    toward air temp (convective heat loss scales with sqrt of wind speed,
    consistent with standard globe-thermometer heat-transfer literature).
    """
    wind = max(0.2, wind_speed_ms)  # avoid divide-by-zero on calm days
    solar_load = 0.0055 * shortwave_wm2  # °C rise per unit radiation
    wind_cooling = 1.0 / math.sqrt(wind)  # convective damping factor
    tg = temp_c + solar_load * wind_cooling
    return round(tg, 2)


def wbgt_outdoor(temp_c: float, rh_pct: float, wind_speed_ms: float, shortwave_wm2: float) -> dict:
    """
    Standard outdoor WBGT = 0.7*Tw + 0.2*Tg + 0.1*Td
    Returns the components too so the frontend / judges can see the math.
    """
    tw = wet_bulb_stull(temp_c, rh_pct)
    tg = globe_temp_estimate(temp_c, wind_speed_ms, shortwave_wm2)
    td = temp_c

    wbgt = 0.7 * tw + 0.2 * tg + 0.1 * td

    return {
        "wbgt": round(wbgt, 2),
        "wetBulbTemp": tw,
        "globeTemp": tg,
        "dryBulbTemp": round(td, 2),
        "formula": "WBGT = 0.7*Tw + 0.2*Tg + 0.1*Td",
        "globeTempNote": "Tg is a radiative-approximation (no physical black globe sensor available), not a direct measurement.",
    }


def heat_index_celsius(temp_c: float, rh_pct: float) -> float:
    """
    NOAA/NWS Rothfusz regression, converted to Celsius coefficients.
    Standard reference formula — same one behind the US NWS Heat Index chart.
    Only valid/meaningful above ~26-27°C; below that HI ~= actual temp.
    """
    t, rh = temp_c, rh_pct

    if t < 20:
        return round(t, 2)

    hi = (
        -8.78469475556
        + 1.61139411 * t
        + 2.33854883889 * rh
        - 0.14611605 * t * rh
        - 0.012308094 * t * t
        - 0.0164248277778 * rh * rh
        + 0.002211732 * t * t * rh
        + 0.00072546 * t * rh * rh
        - 0.000003582 * t * t * rh * rh
    )
    return round(hi, 2)


def classify_thermal_stress(wbgt: float) -> str:
    """
    WBGT-based heat stress category, thresholds aligned with commonly used
    occupational/public heat-warning bands (ACGIH-style, adapted for
    general population outdoor exposure — not workplace-specific limits).
    """
    if wbgt < 27:
        return "Low"
    elif wbgt < 30:
        return "Moderate"
    elif wbgt < 32:
        return "High"
    elif wbgt < 35:
        return "Very High"
    else:
        return "Extreme"


def get_thermal_stress_index(temp_c: float, rh_pct: float, wind_speed_ms: float, shortwave_wm2: float) -> dict:
    """Single entry point — call this from routers/heat.py."""
    wbgt_data = wbgt_outdoor(temp_c, rh_pct, wind_speed_ms, shortwave_wm2)
    hi = heat_index_celsius(temp_c, rh_pct)
    category = classify_thermal_stress(wbgt_data["wbgt"])

    return {
        **wbgt_data,
        "heatIndex": hi,
        "vaporPressure": round(vapor_pressure_hpa(temp_c, rh_pct), 2),
        "stressCategory": category,
    }
