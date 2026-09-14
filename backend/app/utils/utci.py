"""
UTCI (Universal Thermal Climate Index) approximation for SIH26083.

WHY UTCI ALONGSIDE WBGT: the problem statement explicitly allows WBGT, UTCI,
or HI. The 2026 Mumbai coastal-city heat-stress framework (studied as part
of this project's literature review) uses UTCI as its primary hazard index
because — unlike a plain dry-bulb reading — it folds in air temperature,
humidity/vapour pressure, wind speed, AND mean radiant temperature, so two
locations at the same 35°C can register very different physiological stress.

HONESTY NOTE: The real UTCI is defined by a 6th-order, ~120-term polynomial
regression (Bröde et al., 2012) built from a full human thermophysiology
model (the Fiala model) — it needs specialised software/libraries and
cannot be reproduced accurately in a few lines. What's implemented here is
a documented, physically-motivated SIMPLIFIED APPROXIMATION using the same
four physical inputs (air temp, vapour pressure, wind, radiant load) that
the real UTCI uses, reusing this project's existing globe-temperature
estimate as a mean-radiant-temperature proxy. It is NOT the official ISO
UTCI polynomial — flag this to judges exactly like the WBGT globe-temp
estimate is flagged, so nobody mistakes it for the certified index.

Stress category bands used below are taken directly from the reviewed 2026
Mumbai coastal-city heat-stress-warning paper (which itself follows the
standard published UTCI stress-category table).
"""

from app.utils.thermal_indices import vapor_pressure_hpa, globe_temp_estimate


def utci_approx(temp_c: float, rh_pct: float, wind_speed_ms: float, shortwave_wm2: float) -> dict:
    """
    Simplified UTCI-style approximation (see module docstring for caveats).

    Combines:
      - air temperature (Ta)
      - a radiant-load term, reusing the project's globe-temp estimate (Tg)
        as a mean-radiant-temperature proxy
      - wind cooling (higher wind -> lower felt temperature)
      - vapour pressure adjustment (higher humidity -> higher felt temperature)
    """
    tg = globe_temp_estimate(temp_c, wind_speed_ms, shortwave_wm2)
    vapor_pressure = vapor_pressure_hpa(temp_c, rh_pct)
    wind = max(0.2, wind_speed_ms)

    radiant_term = 0.7 * (tg - temp_c)          # extra felt heat from solar/radiant load
    wind_term = -0.35 * wind                     # convective cooling from wind
    humidity_term = 0.045 * (vapor_pressure - 12) # felt-heat bump from humidity above a neutral ~12 hPa

    utci = temp_c + radiant_term + wind_term + humidity_term
    return {
        "utci": round(utci, 2),
        "utciNote": "Simplified UTCI-style approximation (Ta + radiant + wind + vapour-pressure terms) — NOT the official ISO 6th-order polynomial regression, which requires the full Fiala thermophysiology model.",
    }


def classify_utci_stress(utci: float) -> str:
    """
    Stress bands as published in the 2026 Mumbai coastal-city heat-stress
    warning framework (standard UTCI stress-category table).
    """
    if utci < 26:
        return "No Stress"
    elif utci < 32:
        return "Moderate Heat Stress"
    elif utci < 38:
        return "Strong Heat Stress"
    elif utci < 46:
        return "Very Strong Heat Stress"
    else:
        return "Extreme Heat Stress"
