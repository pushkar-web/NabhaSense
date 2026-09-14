"""
Automated Heat Action Plan (HAP) advisory generator for SIH26083.

This directly implements the problem statement's explicit ask: "an API
capable of pushing... localized triggers for city administration to
initiate heat action plans (e.g., opening cooling centers, adjusting power
grids, shifting outdoor work hours)."

Thresholds are modeled on India's most-cited municipal Heat Action Plan
(Ahmedabad HAP, the template most other Indian cities have adapted),
adapted to trigger off this project's WBGT stress category and Mortality
Risk Index rather than a single temperature number — matching the
problem statement's push from "what the weather will be" to "what the
weather will do."
"""

import math

from app.data.hospital_capacity import compute_capacity_alert


def _cooling_centers_needed(vulnerable_population: int, capacity_per_center: int = 5000) -> int:
    if vulnerable_population <= 0:
        return 0
    return max(1, math.ceil(vulnerable_population / capacity_per_center))


def _work_hour_advisory(stress_category: str) -> dict:
    advisories = {
        "Low": {
            "restriction": "None",
            "guidance": "Normal outdoor work hours. Encourage routine hydration.",
        },
        "Moderate": {
            "restriction": "None",
            "guidance": "Normal hours. Mandatory water breaks every 2 hours for outdoor workers.",
        },
        "High": {
            "restriction": "Avoid strenuous outdoor work 12:00 PM - 3:00 PM",
            "guidance": "Reschedule heavy labor to early morning/evening. Water break every hour.",
        },
        "Very High": {
            "restriction": "Avoid all outdoor work 11:00 AM - 4:00 PM",
            "guidance": "Mandatory shaded rest every 45 minutes for essential outdoor work. Provide ORS/electrolytes at worksites.",
        },
        "Extreme": {
            "restriction": "Suspend all non-essential outdoor work 10:00 AM - 5:00 PM",
            "guidance": "Only emergency/essential services outdoors during peak hours, with mandatory cooling breaks every 30 minutes.",
        },
    }
    return advisories.get(stress_category, advisories["Moderate"])


def _power_grid_alert(stress_category: str, hospitalization_spike_prob: float, population: int) -> dict:
    triggered = stress_category in ["Very High", "Extreme"] or hospitalization_spike_prob > 50
    if not triggered:
        return {"triggered": False, "reason": None, "recommendedAction": None}

    reason = (
        f"Sustained {stress_category.lower()} heat stress typically drives a sharp rise in AC/cooler "
        f"demand across a population of ~{population:,}, risking peak-load strain on the local grid."
    )
    action = "Alert DISCOM to pre-position peak-load capacity and prioritize hospital/cooling-center feeders."
    return {"triggered": True, "reason": reason, "recommendedAction": action}


def generate_action_plan(city: str, stress_category: str, wbgt: float, utci: float,
                          mortality_risk_index: float, hospitalization_spike_prob: float,
                          elderly_pct: float, outdoor_worker_pct: float, population: int) -> dict:
    """
    Single entry point — produces the full automated advisory for a city
    given its current (or forecasted) thermal-stress and mortality-risk
    reading.
    """
    # Rough vulnerable-population estimate (elderly + outdoor workers,
    # capped so double-counted individuals don't inflate beyond total pop)
    vulnerable_fraction = min((elderly_pct + outdoor_worker_pct) / 100.0, 0.6)
    vulnerable_population = int(population * vulnerable_fraction)

    cooling_centers_triggered = stress_category in ["High", "Very High", "Extreme"] or mortality_risk_index > 40
    cooling_centers = _cooling_centers_needed(vulnerable_population) if cooling_centers_triggered else 0

    work_advisory = _work_hour_advisory(stress_category)
    grid_alert = _power_grid_alert(stress_category, hospitalization_spike_prob, population)
    capacity_alert = compute_capacity_alert(vulnerable_population, hospitalization_spike_prob, city)

    overall_alert_level = "Watch"
    if stress_category in ["Very High", "Extreme"] or mortality_risk_index > 55:
        overall_alert_level = "Red Alert"
    elif stress_category == "High" or mortality_risk_index > 30:
        overall_alert_level = "Orange Alert"
    elif stress_category == "Moderate" or mortality_risk_index > 15:
        overall_alert_level = "Yellow Alert"

    return {
        "city": city.capitalize(),
        "overallAlertLevel": overall_alert_level,
        "stressCategory": stress_category,
        "wbgt": wbgt,
        "utci": utci,
        "mortalityRiskIndex": mortality_risk_index,
        "coolingCenters": {
            "triggered": cooling_centers_triggered,
            "centersRecommended": cooling_centers,
            "vulnerablePopulationCovered": vulnerable_population,
            "capacityPerCenter": 5000,
        },
        "outdoorWorkAdvisory": work_advisory,
        "powerGridAlert": grid_alert,
        "hospitalCapacityAlert": capacity_alert,
    }
