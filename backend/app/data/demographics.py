"""
Demographic vulnerability + exposure data for PS26083's HSRI (Hazard x
Vulnerability x Exposure) model.

METHODOLOGY NOTE: The 2026 Mumbai coastal-city heat-stress framework
(studied in this project's literature review) splits population risk into
two separate indices rather than one blended number:
  - Vulnerability Index (VI)  — intrinsic to the population: age structure,
    population/household density, socially weaker sections
  - Exposure Index (EI)       — extrinsic conditions: marginal-worker share,
    illiteracy, housing quality, electricity access, water access
  HSRI = Hazard Index x VI x EI  (their paper builds VI/EI via PCA on
  Census 2011 ward-level data)

DATA NOTE: elderly_pct and outdoor_worker_pct are city-level approximations
from publicly reported Census 2011 age-structure trends and periodic Labour
Bureau / PLFS informal-sector estimates — illustrative baselines, not
official current figures. The additional EI proxies below (literacy,
housing quality, electricity/water access) follow the same honesty pattern
as NDVI/NDBI: deterministic, seeded synthetic values standing in for the
real Census 2011 ward microdata the Mumbai paper used, which isn't
available through a free API. Ward lat/lng are synthetic placements too
(no free ward-boundary GIS source available) — flag all of this to judges.
"""

import hashlib
import math

from app.data.real_data import CITIES

# City-level baseline vulnerability (%). Illustrative, not official current data.
CITY_DEMOGRAPHICS = {
    "mumbai":    {"elderlyPct": 8.4,  "outdoorWorkerPct": 22.0, "population": 12_442_373},
    "thane":     {"elderlyPct": 7.6,  "outdoorWorkerPct": 24.5, "population": 1_886_941},
    "delhi":     {"elderlyPct": 6.9,  "outdoorWorkerPct": 26.0, "population": 16_787_941},
    "bangalore": {"elderlyPct": 7.2,  "outdoorWorkerPct": 19.5, "population": 8_443_675},
    "chennai":   {"elderlyPct": 9.1,  "outdoorWorkerPct": 21.0, "population": 4_646_732},
    "hyderabad": {"elderlyPct": 7.8,  "outdoorWorkerPct": 23.5, "population": 6_809_970},
    "pune":      {"elderlyPct": 8.0,  "outdoorWorkerPct": 20.5, "population": 3_124_458},
}

# City-level baseline Exposure Index inputs (%). Illustrative — standing in
# for Census 2011 ward microdata (marginal workers, illiteracy, housing,
# electricity/water access) used by the reviewed Mumbai paper.
CITY_EXPOSURE_BASELINE = {
    "mumbai":    {"marginalWorkerPct": 18.0, "illiteracyPct": 12.0, "poorHousingPct": 21.0, "noElectricityPct": 4.0,  "noWaterAccessPct": 9.0},
    "thane":     {"marginalWorkerPct": 19.5, "illiteracyPct": 13.5, "poorHousingPct": 23.0, "noElectricityPct": 5.0,  "noWaterAccessPct": 10.5},
    "delhi":     {"marginalWorkerPct": 21.0, "illiteracyPct": 15.0, "poorHousingPct": 19.0, "noElectricityPct": 3.5,  "noWaterAccessPct": 8.0},
    "bangalore": {"marginalWorkerPct": 15.5, "illiteracyPct": 10.5, "poorHousingPct": 17.0, "noElectricityPct": 3.0,  "noWaterAccessPct": 7.0},
    "chennai":   {"marginalWorkerPct": 17.0, "illiteracyPct": 11.0, "poorHousingPct": 18.5, "noElectricityPct": 3.2,  "noWaterAccessPct": 7.5},
    "hyderabad": {"marginalWorkerPct": 18.5, "illiteracyPct": 14.0, "poorHousingPct": 20.0, "noElectricityPct": 4.2,  "noWaterAccessPct": 9.2},
    "pune":      {"marginalWorkerPct": 16.5, "illiteracyPct": 11.5, "poorHousingPct": 18.0, "noElectricityPct": 3.4,  "noWaterAccessPct": 7.8},
}

WARD_NAMES = [
    "Ward 1 - Central", "Ward 2 - North", "Ward 3 - South", "Ward 4 - East",
    "Ward 5 - West", "Ward 6 - Industrial Belt", "Ward 7 - Old City",
    "Ward 8 - Riverside", "Ward 9 - Suburb North", "Ward 10 - Suburb South",
    "Ward 11 - IT Corridor", "Ward 12 - Market District",
]


def _ward_seed(city: str, ward_name: str, salt: str = "") -> float:
    """Deterministic 0-1 pseudo-random value per city+ward(+salt), stable across calls."""
    h = hashlib.md5(f"{city}:{ward_name}:{salt}".encode()).hexdigest()
    return int(h[:8], 16) / 0xFFFFFFFF


def _ward_latlng(center_lat: float, center_lng: float, index: int, total: int, seed: float) -> tuple:
    """
    Deterministic ward coordinates arranged in a ring around the city center.
    NOTE: synthetic placement, not real ward boundary centroids (no free GIS
    ward-boundary source available) — purely so wards render as distinct
    spatial zones on the map.
    """
    angle = (index / total) * 2 * math.pi
    radius_deg = 0.02 + seed * 0.055  # ~2km to ~9km depending on latitude
    ward_lat = center_lat + radius_deg * math.cos(angle)
    ward_lng = center_lng + radius_deg * math.sin(angle)
    return round(ward_lat, 5), round(ward_lng, 5)


def get_city_demographics(city: str) -> dict:
    key = city.lower()
    return CITY_DEMOGRAPHICS.get(key, CITY_DEMOGRAPHICS["mumbai"])


def get_city_exposure_baseline(city: str) -> dict:
    key = city.lower()
    return CITY_EXPOSURE_BASELINE.get(key, CITY_EXPOSURE_BASELINE["mumbai"])


def get_ward_demographics(city: str) -> list:
    """
    Ward-level breakdown for hyper-local alerts, including map coordinates
    AND Exposure Index proxy fields (marginal workers, illiteracy, housing,
    electricity/water access) matching the reviewed Mumbai paper's EI inputs.
    """
    key = city.lower()
    base = get_city_demographics(key)
    exposure_base = get_city_exposure_baseline(key)
    city_info = CITIES.get(key, CITIES["mumbai"])

    wards = []
    for idx, name in enumerate(WARD_NAMES):
        seed = _ward_seed(key, name)
        exposure_seed = _ward_seed(key, name, salt="exposure")
        variation = 0.6 + seed * 0.8       # 0.6x - 1.4x of city baseline (vulnerability)
        exposure_variation = 0.65 + exposure_seed * 0.75  # 0.65x - 1.4x (exposure)

        elderly = round(base["elderlyPct"] * variation, 1)
        outdoor = round(base["outdoorWorkerPct"] * variation, 1)
        ward_pop = int(base["population"] / len(WARD_NAMES) * (0.7 + seed * 0.6))
        lat, lng = _ward_latlng(city_info["lat"], city_info["lng"], idx, len(WARD_NAMES), seed)

        marginal_worker = round(min(exposure_base["marginalWorkerPct"] * exposure_variation, 40.0), 1)
        illiteracy = round(min(exposure_base["illiteracyPct"] * exposure_variation, 30.0), 1)
        poor_housing = round(min(exposure_base["poorHousingPct"] * exposure_variation, 45.0), 1)
        no_electricity = round(min(exposure_base["noElectricityPct"] * exposure_variation, 12.0), 1)
        no_water = round(min(exposure_base["noWaterAccessPct"] * exposure_variation, 20.0), 1)

        wards.append({
            "ward": name,
            "elderlyPct": min(elderly, 20.0),
            "outdoorWorkerPct": min(outdoor, 45.0),
            "population": ward_pop,
            "lat": lat,
            "lng": lng,
            "marginalWorkerPct": marginal_worker,
            "illiteracyPct": illiteracy,
            "poorHousingPct": poor_housing,
            "noElectricityPct": no_electricity,
            "noWaterAccessPct": no_water,
        })
    return wards


def vulnerability_multiplier(elderly_pct: float, outdoor_worker_pct: float) -> float:
    """
    Legacy simple multiplier — kept for the standalone Mortality Risk Index
    model. Superseded by compute_vulnerability_index()/compute_exposure_index()
    below for the HSRI (Hazard x VI x EI) pipeline.
    """
    multiplier = 1.0 + 0.6 * (elderly_pct / 100.0) + 0.4 * (outdoor_worker_pct / 100.0)
    return round(multiplier, 3)


def compute_vulnerability_index(elderly_pct: float, population: int, avg_population: float) -> float:
    """
    Vulnerability Index (VI), normalized 0-1. Intrinsic population factors:
    age structure + relative population density (a proxy for household
    density, matching the Mumbai paper's VI inputs — we don't have real
    household-density microdata, so population relative to the city's
    average ward population stands in for it).
    """
    elderly_score = min(elderly_pct / 20.0, 1.0)              # 20% elderly = max score
    density_score = min(population / max(avg_population, 1) / 2.0, 1.0)  # 2x avg ward pop = max score
    vi = 0.65 * elderly_score + 0.35 * density_score
    return round(min(max(vi, 0.05), 1.0), 3)


def compute_exposure_index(marginal_worker_pct: float, illiteracy_pct: float, poor_housing_pct: float,
                            no_electricity_pct: float, no_water_pct: float) -> float:
    """
    Exposure Index (EI), normalized 0-1. Extrinsic conditions that increase
    exposure to heat consequences — matches the Mumbai paper's EI inputs
    (marginal workers, illiteracy, dilapidated housing, no electricity,
    untreated/distant water).
    """
    ei = (
        0.30 * min(marginal_worker_pct / 40.0, 1.0)
        + 0.20 * min(illiteracy_pct / 30.0, 1.0)
        + 0.25 * min(poor_housing_pct / 45.0, 1.0)
        + 0.10 * min(no_electricity_pct / 12.0, 1.0)
        + 0.15 * min(no_water_pct / 20.0, 1.0)
    )
    return round(min(max(ei, 0.05), 1.0), 3)
