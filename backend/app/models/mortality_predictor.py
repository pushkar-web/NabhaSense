"""
Mortality Risk Index model for PS26083.

TRAINING DATA NOTE (same honesty pattern as predictor.py's RF classifier):
Publicly available, ward-level, real-time-linked heat-mortality datasets for
Indian cities don't exist in an open, API-accessible form. So — like the
existing heat-risk classifier — this is trained on synthetic data generated
from a physiologically-motivated dose-response curve (WBGT above ~26-28°C
sharply increases heat-mortality risk; this "elbow" shape is a real,
published epidemiological pattern from heat-wave mortality studies, even
though the exact curve/coefficients here are illustrative, not fitted to
Indian vital-registration data). Be upfront about this with judges.
"""

import numpy as np
from sklearn.ensemble import RandomForestRegressor


class MortalityRiskPredictor:
    def __init__(self):
        self._train_model()

    def _dose_response_base_risk(self, wbgt: np.ndarray) -> np.ndarray:
        """
        Sigmoid-shaped baseline mortality risk index (0-100) as a function of
        WBGT. Midpoint ~32°C, matching the commonly cited "sharp elbow"
        around WBGT 30-33°C seen in heat-wave excess-mortality studies.
        """
        midpoint = 32.0
        steepness = 0.55
        return 100 / (1 + np.exp(-steepness * (wbgt - midpoint)))

    def _train_model(self):
        np.random.seed(7)
        n = 2000

        wbgt = np.random.uniform(18, 42, n)
        elderly_pct = np.random.uniform(4, 15, n)
        outdoor_pct = np.random.uniform(10, 40, n)
        heat_index = wbgt + np.random.uniform(0, 4, n)  # HI generally >= WBGT

        base_risk = self._dose_response_base_risk(wbgt)
        multiplier = 1.0 + 0.6 * (elderly_pct / 100.0) + 0.4 * (outdoor_pct / 100.0)
        mortality_index = np.clip(base_risk * multiplier + np.random.normal(0, 3, n), 0, 100)

        # Hospitalization spike probability — correlated with mortality index
        # but saturates faster (hospitals see spikes before deaths spike)
        spike_prob = np.clip(
            1 / (1 + np.exp(-0.09 * (mortality_index - 35))) * 100 + np.random.normal(0, 4, n),
            0, 100,
        )

        X = np.column_stack([wbgt, heat_index, elderly_pct, outdoor_pct])

        self.mortality_model = RandomForestRegressor(n_estimators=150, random_state=7, max_depth=8)
        self.mortality_model.fit(X, mortality_index)

        self.spike_model = RandomForestRegressor(n_estimators=150, random_state=7, max_depth=8)
        self.spike_model.fit(X, spike_prob)

    def predict(self, wbgt: float, heat_index: float, elderly_pct: float, outdoor_worker_pct: float) -> dict:
        X = np.array([[wbgt, heat_index, elderly_pct, outdoor_worker_pct]])

        mortality_index = float(self.mortality_model.predict(X)[0])
        spike_prob = float(self.spike_model.predict(X)[0])

        mortality_index = round(max(0, min(100, mortality_index)), 1)
        spike_prob = round(max(0, min(100, spike_prob)), 1)

        return {
            "mortalityRiskIndex": mortality_index,
            "hospitalizationSpikeProbability": spike_prob,
            "riskTier": self._risk_tier(mortality_index),
            "inputs": {
                "wbgt": wbgt,
                "heatIndex": heat_index,
                "elderlyPct": elderly_pct,
                "outdoorWorkerPct": outdoor_worker_pct,
            },
        }

    def _risk_tier(self, mortality_index: float) -> str:
        if mortality_index < 20:
            return "Low"
        elif mortality_index < 45:
            return "Moderate"
        elif mortality_index < 70:
            return "High"
        else:
            return "Critical"
