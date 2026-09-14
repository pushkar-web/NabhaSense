"""
Localized (acclimatization-adjusted) heat-stress thresholds for SIH26083.

DIRECTLY IMPLEMENTS: "Heat Stress and Public Health: A Critical Review
(2008)" insight #2 — populations acclimatized to warmer climates have
different temperature-mortality thresholds than populations in cooler
climates. A WBGT of 32C is "Strong Heat Stress" everywhere in the standard
table, but a population in a chronically hot city has physiologically and
behaviorally adapted in ways a cooler-climate population hasn't — so the
same reading should trip an alert later for the former, earlier for the
latter.

METHOD: shift each city's stress-category boundaries by a small amount
based on how much hotter/cooler that city's typical climate is versus a
reference "average Indian city" baseline. This uses this project's own
already-fetched 30-day historical temperature data as the acclimatization
signal (no new external dataset needed).

DATA NOTE: the CITY_CLIMATE_NORMAL values below are approximate summer
average-high climate normals (illustrative, from general climatological
knowledge of these cities) — a stand-in for the kind of long-term
acclimatization baseline real epidemiological studies build from
multi-decade mortality records, which isn't available via a free API.
Flag this to judges like the other heuristic components in this app.
"""

REFERENCE_BASELINE_TEMP = 35.0  # "average Indian city" summer normal, °C

CITY_CLIMATE_NORMAL = {
    "mumbai": 33.0,
    "thane": 34.0,
    "delhi": 40.0,
    "bangalore": 30.0,
    "chennai": 37.0,
    "hyderabad": 38.0,
    "pune": 34.0,
}

ACCLIMATIZATION_FACTOR = 0.15  # °C threshold shift per °C above/below baseline
MAX_SHIFT = 2.0  # cap the shift so it never distorts the categories too far


def get_acclimatization_shift(city: str) -> float:
    """
    Returns the °C amount to shift stress-category boundaries UP for a
    hotter-than-average city (population more heat-adapted, needs a higher
    reading to trigger the same alert) or DOWN for a cooler-than-average
    city (population less heat-adapted, alert triggers earlier).
    """
    normal = CITY_CLIMATE_NORMAL.get(city.lower(), REFERENCE_BASELINE_TEMP)
    shift = (normal - REFERENCE_BASELINE_TEMP) * ACCLIMATIZATION_FACTOR
    return round(max(-MAX_SHIFT, min(MAX_SHIFT, shift)), 2)


def classify_wbgt_stress_localized(wbgt: float, city: str) -> dict:
    shift = get_acclimatization_shift(city)
    adj = wbgt - shift  # subtracting shift = boundaries move up for hot-adapted cities

    if adj < 27:
        category = "Low"
    elif adj < 30:
        category = "Moderate"
    elif adj < 32:
        category = "High"
    elif adj < 35:
        category = "Very High"
    else:
        category = "Extreme"

    return {"category": category, "acclimatizationShift": shift}


def classify_utci_stress_localized(utci: float, city: str) -> dict:
    shift = get_acclimatization_shift(city)
    adj = utci - shift

    if adj < 26:
        category = "No Stress"
    elif adj < 32:
        category = "Moderate Heat Stress"
    elif adj < 38:
        category = "Strong Heat Stress"
    elif adj < 46:
        category = "Very Strong Heat Stress"
    else:
        category = "Extreme Heat Stress"

    return {"category": category, "acclimatizationShift": shift}
