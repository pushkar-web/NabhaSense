import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor
from sklearn.preprocessing import StandardScaler
import random

class HeatPredictor:
    def __init__(self):
        self.scaler = StandardScaler()
        self._init_cities()
        self._train_model()

    def _init_cities(self):
        self.cities = {
            "mumbai": {"lat": 19.0760, "lng": 72.8777, "state": "Maharashtra"},
            "thane": {"lat": 19.2183, "lng": 72.9781, "state": "Maharashtra"},
            "delhi": {"lat": 28.6139, "lng": 77.2090, "state": "Delhi"},
            "bangalore": {"lat": 12.9716, "lng": 77.5946, "state": "Karnataka"},
            "chennai": {"lat": 13.0827, "lng": 80.2707, "state": "Tamil Nadu"},
            "hyderabad": {"lat": 17.3850, "lng": 78.4867, "state": "Telangana"},
            "pune": {"lat": 18.5204, "lng": 73.8567, "state": "Maharashtra"},
        }

        # Land-only lat/lng bounding boxes per city — hand-picked to stay on the
        # built-up landmass and avoid coastline/sea (Mumbai, Chennai are coastal;
        # symmetric +/- offsets from the center point put ~half the points in
        # water for those two, which is the bug being fixed here).
        self.city_bounds = {
            "mumbai":    {"lat": (18.90, 19.25), "lng": (72.82, 72.97)},   # east of coastline
            "thane":     {"lat": (19.14, 19.30), "lng": (72.94, 73.06)},
            "delhi":     {"lat": (28.45, 28.75), "lng": (76.95, 77.35)},
            "bangalore": {"lat": (12.85, 13.10), "lng": (77.45, 77.75)},
            "chennai":   {"lat": (12.95, 13.20), "lng": (80.10, 80.27)},   # west of coastline
            "hyderabad": {"lat": (17.25, 17.55), "lng": (78.30, 78.60)},
            "pune":      {"lat": (18.40, 18.65), "lng": (73.75, 73.95)},
        }

    def _random_point(self, city: str) -> tuple:
        bounds = self.city_bounds.get(city.lower(), self.city_bounds["mumbai"])
        lat = round(random.uniform(*bounds["lat"]), 6)
        lng = round(random.uniform(*bounds["lng"]), 6)
        return lat, lng

    def _train_model(self):
        # Synthetic training data based on real urban heat research
        np.random.seed(42)
        n = 1000
        X = np.column_stack([
            np.random.uniform(28, 52, n),   # LST
            np.random.uniform(-0.2, 0.8, n), # NDVI
            np.random.uniform(0.1, 0.9, n),  # NDBI
            np.random.uniform(30, 95, n),    # humidity
            np.random.uniform(0, 100, n),    # building density
        ])
        # Risk: 0=low, 1=medium, 2=high, 3=extreme
        y = np.where(X[:,0] < 33, 0,
            np.where(X[:,0] < 38, 1,
            np.where(X[:,0] < 44, 2, 3)))

        self.clf = RandomForestClassifier(n_estimators=100, random_state=42)
        self.clf.fit(X, y)

        self.reg = RandomForestRegressor(n_estimators=100, random_state=42)
        self.reg.fit(X, X[:,0])

    def _generate_hotspots(self, city: str, count: int = 15):
        hotspots = []
        risk_levels = ["low", "medium", "high", "extreme"]
        districts = ["Zone A", "Zone B", "Zone C", "Zone D", "Industrial", "Commercial", "Residential"]

        for i in range(count):
            lst = round(random.uniform(29, 51), 2)
            ndvi = round(random.uniform(-0.1, 0.7), 3)
            ndbi = round(random.uniform(0.1, 0.85), 3)
            humidity = round(random.uniform(35, 90), 1)
            building_density = round(random.uniform(10, 95), 1)

            features = np.array([[lst, ndvi, ndbi, humidity, building_density]])
            risk_idx = self.clf.predict(features)[0]

            lat, lng = self._random_point(city)

            hotspots.append({
                "lat": lat,
                "lng": lng,
                "lst": lst,
                "ndvi": ndvi,
                "ndbi": ndbi,
                "humidity": humidity,
                "buildingDensity": building_density,
                "heatRisk": risk_levels[risk_idx],
                "district": random.choice(districts),
                "city": city.capitalize()
            })
        return hotspots

    def get_city_analysis(self, city: str):
        hotspots = self._generate_hotspots(city)
        lsts = [h["lst"] for h in hotspots]
        risk_counts = {"low": 0, "medium": 0, "high": 0, "extreme": 0}
        for h in hotspots:
            risk_counts[h["heatRisk"]] += 1

        dominant_driver = max(
            ["High NDBI", "Low NDVI", "Building Density", "Low Humidity"],
            key=lambda x: random.random()
        )

        return {
            "city": city.capitalize(),
            "avgLST": round(sum(lsts) / len(lsts), 2),
            "maxLST": round(max(lsts), 2),
            "minLST": round(min(lsts), 2),
            "hotspotCount": len([h for h in hotspots if h["heatRisk"] in ["high", "extreme"]]),
            "riskDistribution": risk_counts,
            "dominantDriver": dominant_driver,
            "coolingPotential": round(random.uniform(2.5, 8.5), 1),
            "affectedPopulation": random.randint(50000, 500000),
        }

    def get_hotspots(self, city: str):
        return {"city": city.capitalize(), "hotspots": self._generate_hotspots(city)}

    def get_cooling_interventions(self, city: str):
        interventions = []
        types = ["urban_greening", "cool_roof", "water_body", "ventilation"]
        areas = ["North Zone", "South Zone", "East Zone", "West Zone", "Central"]

        for i in range(10):
            int_type = random.choice(types)
            temp_reduction = {
                "urban_greening": round(random.uniform(1.5, 3.5), 1),
                "cool_roof": round(random.uniform(2.0, 4.5), 1),
                "water_body": round(random.uniform(1.0, 2.5), 1),
                "ventilation": round(random.uniform(0.5, 2.0), 1),
            }[int_type]

            lat, lng = self._random_point(city)

            interventions.append({
                "id": f"INT_{i+1:03d}",
                "type": int_type,
                "lat": lat,
                "lng": lng,
                "impactScore": round(random.uniform(0.5, 1.0), 2),
                "tempReduction": temp_reduction,
                "area": random.choice(areas),
                "priority": random.choice(["low", "medium", "high"]),
                "estimatedCost": random.randint(500000, 5000000),
            })
        return {"city": city.capitalize(), "interventions": interventions}

    def predict(self, data: dict):
        features = np.array([[
            data.get("lst", 35),
            data.get("ndvi", 0.3),
            data.get("ndbi", 0.5),
            data.get("humidity", 60),
            data.get("buildingDensity", 50),
        ]])
        risk_labels = ["Low", "Medium", "High", "Extreme"]
        risk_idx = self.clf.predict(features)[0]
        probabilities = self.clf.predict_proba(features)[0]

        return {
            "riskLevel": risk_labels[risk_idx],
            "confidence": round(float(max(probabilities)) * 100, 1),
            "probabilities": {
                label: round(float(prob) * 100, 1)
                for label, prob in zip(risk_labels, probabilities)
            },
            "recommendations": self._get_recommendations(risk_idx)
        }

    def _get_recommendations(self, risk_idx: int):
        recs = [
            ["Maintain green cover", "Monitor LST seasonally"],
            ["Plant urban trees", "Install reflective surfaces", "Create water features"],
            ["Urgent: Cool roofs needed", "Expand green corridors", "Restrict dark surfaces"],
            ["Emergency intervention", "Immediate tree plantation", "Cool roof mandate", "Water body creation"]
        ]
        return recs[risk_idx]
