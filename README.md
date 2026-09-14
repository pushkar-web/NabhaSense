# 🛰️ NabhaSense — Urban Heat Intelligence Platform

<div align="center">

[![Live Demo](https://img.shields.io/badge/Live%20Demo-Vercel-black?style=for-the-badge&logo=vercel&logoColor=white)](https://nabha-sense.vercel.app)
[![API Docs](https://img.shields.io/badge/API%20Docs-FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://nabhasense-backend.onrender.com/docs)
[![ISRO BAH 2026](https://img.shields.io/badge/ISRO%20BAH%202026-Hackathon%20Project-FF9933?style=for-the-badge&logo=spacex&logoColor=white)](https://hack2skill.com/event/bah2026)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)

<p align="center">
  <b>Physics-informed AI/ML platform to detect urban heat stress hotspots, quantify thermal drivers, and simulate optimized cooling interventions across Indian metropolitan regions.</b>
</p>

[**Explore Live Demo**](https://nabha-sense.vercel.app) • [**Interactive API Docs**](https://nabhasense-backend.onrender.com/docs) • [**ISRO BAH 2026**](https://hack2skill.com/event/bah2026)

</div>

---

## 📖 Overview

**NabhaSense** is a next-generation urban climate resilience and thermal stress decision-support platform developed for the **ISRO Bharatiya Antariksh Hackathon (BAH) 2026**.

Rapid urbanization and climate volatility have intensified the **Surface Urban Heat Island (SUHI)** phenomenon across Indian cities, exposing dense populations and outdoor labor workforces to hazardous thermal extremes. Conventional monitoring systems rely solely on ambient air temperature or satellite snapshots that lack localized biometeorological context.

NabhaSense bridges earth observation analytics and clinical human heat-stress modeling by combining:
1. **Satellite Remote Sensing & Physics Metrics:** Land Surface Temperature (LST), Normalized Difference Vegetation Index (NDVI), Normalized Difference Built-up Index (NDBI), and Surface Urban Heat Island Intensity (SUHII).
2. **Human Biometeorology Indices:** Wet Bulb Globe Temperature (WBGT), Universal Thermal Climate Index (UTCI), and Heat Index calculated in real time with **localized acclimatization shifts** per city.
3. **Socio-Demographic Vulnerability:** Ward-level Heat Stress Risk Index (HSRI) combining **Hazard × Vulnerability × Exposure** based on elderly demographics, outdoor worker percentages, and living conditions.
4. **Actionable Mitigation:** A physics-grounded scenario simulator evaluating the thermal cooling impact of urban tree canopy, cool roofs (albedo modification), and surface water bodies.

---

## ⚡ Key Features

- **🌡️ Real-Time Atmospheric & Thermal Telemetry:** Integrates live weather parameters (temperature, relative humidity, wind speed, solar radiation) via Open-Meteo API alongside historical LST baselines.
- **🤖 Random Forest Heat Risk Classifier:** Predicts multi-tier urban heat risk (`Low`, `Medium`, `High`, `Extreme`) with confidence scoring and dominant heating driver identification.
- **🗺️ Interactive Geospatial Hotspot Mapping:** Dynamic Leaflet map visualizing ward-level hotspot clusters with pulsing markers, thermal gradients, and vulnerability indicators.
- **👥 Mortality Risk & Ward-Level HSRI:** Computes Heat Stress Risk Index (HSRI) across individual municipal wards, assessing hospitalization spike probabilities and mortality risk for vulnerable populations.
- **📅 3–5 Day Dynamic Heat Forecast:** Multi-day heat-mortality projections dynamically updating ward-level risk tiers against predicted atmospheric conditions.
- **🧪 Physics-Based Cooling Simulator:** Interactive intervention testbed simulating temperature reduction, risk tier downgrades, and estimated population benefit from tree cover expansion, cool roof deployment, and water bodies.
- **🚨 Automated Heat Action Plan (HAP) & Alerts:** Generates actionable civic advisories (cooling center activation, outdoor work restrictions, power grid alert thresholds) with SMS/WhatsApp dispatch previews.
- **🏙️ Multi-City Benchmark Engine:** Concurrent asynchronous comparison across 7 major Indian metropolises (Mumbai, Delhi, Bengaluru, Chennai, Kolkata, Hyderabad, Ahmedabad).

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | [Next.js 14](https://nextjs.org/) (App Router), [TypeScript](https://www.typescriptlang.org/), [Tailwind CSS](https://tailwindcss.com/), [Framer Motion](https://www.framer.com/motion/), [Leaflet](https://leafletjs.com/) / [React-Leaflet](https://react-leaflet.js.org/), [Lucide React](https://lucide.dev/) |
| **Backend** | [FastAPI](https://fastapi.tiangolo.com/), [Python 3.11+](https://www.python.org/), [Scikit-learn](https://scikit-learn.org/), [NumPy](https://numpy.org/), [Uvicorn](https://www.uvicorn.org/) |
| **Data & APIs** | [Open-Meteo Weather & Forecast API](https://open-meteo.com/), Satellite Earth Observation Baselines (LST, NDVI, NDBI), Census & Municipal Demographics |
| **Deployment** | [Vercel](https://vercel.com/) (Frontend), [Render](https://render.com/) (Backend Web Service) |

---

## 📡 API Reference

The backend exposes a fully documented REST API. Interactive Swagger UI is available at [`/docs`](https://nabhasense-backend.onrender.com/docs).

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/health` | API service health check |
| `GET` | `/heat/analysis/{city}` | Comprehensive heat analysis, ML risk classification, thermal metrics, and demographics |
| `GET` | `/heat/thermal/{city}` | WBGT, Heat Index, UTCI, and acclimatization adjustments |
| `GET` | `/heat/mortality/{city}` | City- and ward-level Mortality Risk Index and HSRI calculations |
| `GET` | `/heat/forecast/{city}` | 3-5 day dynamic heat forecast and ward-level risk projections |
| `GET` | `/heat/action-plan/{city}` | Automated civic Heat Action Plan advisory and intervention directives |
| `GET` | `/heat/alert/preview/{city}` | SMS / WhatsApp alert message preview and dispatch criteria |
| `POST` | `/heat/alert/send` | Send / simulate emergency civic notification |
| `POST` | `/heat/simulate` | Physics simulation of cooling interventions (trees, cool roofs, water) |
| `POST` | `/heat/action-plan/simulate` | Scenario simulator evaluating alert-level downgrades under intervention |
| `GET` | `/heat/compare` | Parallelized multi-city thermal and risk comparative analysis |

---

## 🚀 Local Development

### Prerequisites
- **Node.js** 18.x or higher & **npm**
- **Python** 3.10 or higher
- **Git**

### 1. Clone the Repository
```bash
git clone https://github.com/pushkar-web/NabhaSense.git
cd NabhaSense
```

### 2. Backend Setup
```bash
# Navigate to backend directory
cd backend

# Create and activate virtual environment
python -m venv venv

# On Windows:
venv\Scripts\activate
# On macOS/Linux:
# source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start FastAPI development server
uvicorn app.main:app --reload --port 8000
```
Backend will be live at `http://localhost:8000` with Swagger docs at `http://localhost:8000/docs`.

### 3. Frontend Setup
```bash
# From repository root, navigate to frontend directory
cd frontend

# Install Node dependencies
npm install

# Start Next.js development server
npm run dev
```
Frontend will be accessible at `http://localhost:3000`.

---

## 🌐 Deployment Links

- **Production Frontend:** [https://nabha-sense.vercel.app](https://nabha-sense.vercel.app)
- **Live API & Swagger Docs:** [https://nabhasense-backend.onrender.com/docs](https://nabhasense-backend.onrender.com/docs)
- **Hackathon Reference:** [ISRO Bharatiya Antariksh Hackathon 2026](https://hack2skill.com/event/bah2026)

---

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.
