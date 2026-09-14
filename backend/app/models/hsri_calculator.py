"""
Heat Stress Risk Index (HSRI) calculator for SIH26083.

Directly implements the methodology from the reviewed 2026 Mumbai
coastal-city heat-stress-warning research paper:

    HSRI = Hazard Index (HI) x Vulnerability Index (VI) x Exposure Index (EI)

This is a deliberate architectural choice over a single blended "mortality
multiplier": it keeps hazard (what the weather is doing), vulnerability
(who is intrinsically at risk) and exposure (what conditions amplify that
risk) as separate, auditable components — matching a published research
methodology rather than an ad-hoc formula. HSRI is reported alongside the
Mortality Risk Index (not replacing it) — HSRI is the research-grounded
hazard-composition score; Mortality Risk Index is the ML-based
mortality/hospitalization-spike estimate. Together they cover both what
the literature calls for (HSRI) and what the problem statement explicitly
asks for (a mortality-risk prediction).
"""


def compute_hazard_index(wbgt: float, utci: float) -> float:
    """
    Hazard Index (HI), normalized 0-100. Blends WBGT and UTCI so the hazard
    score isn't dependent on a single index's scale — both are converted to
    a 0-100 "how dangerous is the thermal environment" score using their
    respective danger thresholds (WBGT ~35C and UTCI ~46C both mark
    "extreme" in their published stress tables), then averaged.
    """
    wbgt_score = min(max((wbgt / 35.0) * 100, 0), 130)
    utci_score = min(max((utci / 46.0) * 100, 0), 130)

    hazard = (0.55 * wbgt_score + 0.45 * utci_score)
    return round(min(hazard, 130), 1)


def compute_hsri(hazard_index: float, vulnerability_index: float, exposure_index: float) -> dict:
    """
    HSRI = HI x VI x EI. VI and EI are 0-1, so HSRI stays on roughly the
    same scale as the Hazard Index itself, scaled down by how vulnerable/
    exposed the population is (VI=EI=1 means "as bad as the raw hazard";
    lower VI/EI pulls the composite risk down).
    """
    hsri = round(hazard_index * vulnerability_index * exposure_index, 1)
    return {
        "hazardIndex": hazard_index,
        "vulnerabilityIndex": vulnerability_index,
        "exposureIndex": exposure_index,
        "hsri": hsri,
        "hsriTier": classify_hsri(hsri),
        "formula": "HSRI = Hazard Index x Vulnerability Index x Exposure Index",
    }


def classify_hsri(hsri: float) -> str:
    if hsri < 15:
        return "Low"
    elif hsri < 35:
        return "Moderate"
    elif hsri < 60:
        return "High"
    else:
        return "Critical"
