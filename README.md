# 🌡️ NabhaSense — Urban Heat Intelligence Platform

> An AI/ML-powered urban heat intelligence platform for analyzing heat conditions, identifying heat-risk hotspots, evaluating thermal stress, comparing cities, and simulating cooling interventions.

---

## 📌 Overview

**NabhaSense** is a full-stack AI/ML platform designed to analyze and visualize urban heat conditions using environmental, weather, thermal, and demographic information.

The system combines **Machine Learning, weather data, thermal indices, geospatial visualization, risk analysis, and intervention simulation** into a single platform.

NabhaSense helps answer four important questions:

> **Where is the heat risk?**
> **What factors contribute to it?**
> **Who is more vulnerable?**
> **What interventions could reduce the risk?**

---

# 🎯 Project Objectives

The main objectives of NabhaSense are to:

* Identify urban heat-risk hotspots
* Analyze environmental and weather conditions
* Estimate thermal stress using multiple thermal indices
* Predict heat-risk categories using Machine Learning
* Analyze population vulnerability and exposure
* Estimate heat-related mortality risk
* Forecast upcoming heat-risk conditions
* Compare heat conditions across multiple cities
* Simulate cooling interventions
* Generate heat-action recommendations

---

# ✨ Key Features

## 🌡️ 1. Real-Time Weather Analysis

NabhaSense retrieves weather information through the **Open-Meteo API**.

The system works with parameters such as:

* Temperature
* Relative humidity
* Apparent temperature
* Wind speed
* Cloud cover
* Shortwave radiation

Weather and forecast responses are cached to reduce unnecessary API requests.

---

## 🤖 2. Machine Learning Heat-Risk Prediction

The platform uses a **Random Forest Classifier** to classify urban heat risk.

### Input Features

```text
LST
NDVI
NDBI
Humidity
Building Density
```

### Output Classes

```text
Low
Medium
High
Extreme
```

The model also provides prediction probabilities that can be used as confidence information.

---

## 🗺️ 3. Interactive Heat-Risk Map

The frontend provides a geospatial visualization of heat conditions.

The map can display:

* Heat-risk hotspots
* Location coordinates
* Temperature information
* Heat-risk category
* Environmental indicators
* Risk-related information

Users can visually explore areas with different levels of heat risk.

---

## 🧮 4. Thermal Stress Analysis

NabhaSense calculates multiple thermal indicators rather than relying only on temperature.

The system includes:

* Heat Index
* Wet-Bulb Temperature
* Globe Temperature
* WBGT
* UTCI
* Thermal Stress

These indicators are combined to classify overall thermal stress.

### Thermal Stress Categories

```text
Low
Moderate
High
Very High
Extreme
```

---

# ❤️ 5. Heat-Related Mortality Risk

NabhaSense includes a separate mortality-risk analysis component.

The model considers factors such as:

```text
WBGT
Heat Index
Elderly Population %
Outdoor Worker %
```

The system generates:

* Mortality Risk Index
* Hospitalization Spike Probability
* Risk Tier

### Risk Tiers

```text
Low
Moderate
High
Critical
```

---

# 👥 6. Vulnerability & Exposure Analysis

Environmental heat alone does not determine overall heat risk.

NabhaSense also considers population vulnerability and exposure.

### Vulnerability Factors

* Elderly population
* Demographic characteristics

### Exposure Factors

* Outdoor workers
* Illiteracy
* Poor housing conditions
* Electricity access
* Water access

These components contribute to the **Heat Stress Risk Index (HSRI)**.

```text
HSRI = Hazard × Vulnerability × Exposure
```

---

# 🔮 7. Heat-Risk Forecasting

NabhaSense supports short-term heat-risk forecasting.

The forecasting pipeline processes:

```text
Weather Forecast
      ↓
Peak Daily Temperature
      ↓
Thermal Indices
      ↓
Thermal Stress
      ↓
Mortality Risk
      ↓
Heat-Risk Forecast
```

Forecast analysis can be performed for multiple days.

---

# 🧊 8. Cooling Intervention Simulator

NabhaSense provides a scenario-based intervention simulator.

Users can explore the estimated impact of different cooling strategies.

### 🌳 Tree Cover

Simulates the impact of increasing urban vegetation.

### 🏠 Cool Roofs

Simulates cooling through increased cool-roof coverage and surface reflectivity.

### 💧 Water Bodies

Estimates the cooling contribution of additional water-body coverage.

### ☀️ Albedo Improvement

Simulates the effect of increasing surface reflectivity.

---

## Intervention Workflow

```text
Current Heat Condition
          │
          ▼
 Select Intervention
          │
    ┌─────┼─────┬─────┐
    ▼     ▼     ▼     ▼
 Trees  Roofs  Water  Albedo
    │     │     │     │
    └─────┴─────┴─────┘
          │
          ▼
    Estimated Cooling
          │
          ▼
   Adjusted Conditions
          │
          ▼
  Updated Heat-Risk Level
```

---

# 🚨 9. Heat Action Plan

NabhaSense converts heat-risk information into recommended actions.

Depending on the calculated risk level, the system can generate recommendations related to:

* Cooling-center activation
* Outdoor-work advisories
* Hydration and water breaks
* Power-grid preparedness
* Hospital-capacity preparedness
* Heat-alert levels

### Alert Levels

```text
Watch
Yellow Alert
Orange Alert
Red Alert
```

---

# 🏙️ 10. Multi-City Comparison

NabhaSense supports comparative analysis across multiple cities.

The current system includes:

```text
Mumbai
Thane
Delhi
Bangalore
Chennai
Hyderabad
Pune
```

City comparison can include:

* Temperature
* LST
* SUHII
* NDVI
* NDBI
* WBGT
* UTCI
* Thermal stress
* Mortality risk
* HSRI

This allows users to compare heat conditions across different urban environments.

---

# 🏗️ System Architecture

```text
                         ┌───────────────────────┐
                         │         USER          │
                         │                       │
                         │ City Selection        │
                         │ Heat Analysis         │
                         │ Forecast              │
                         │ Simulation            │
                         └───────────┬───────────┘
                                     │
                                     ▼
                         ┌───────────────────────┐
                         │       FRONTEND        │
                         │                       │
                         │ Next.js               │
                         │ React                 │
                         │ TypeScript            │
                         │ Leaflet / Maps        │
                         │ Charts & Visuals      │
                         └───────────┬───────────┘
                                     │
                                     │ REST API
                                     ▼
                    ┌────────────────────────────────┐
                    │          FASTAPI BACKEND        │
                    │                                │
                    │           main.py              │
                    └───────────────┬────────────────┘
                                    │
                                    ▼
                         ┌───────────────────────┐
                         │      HEAT ROUTER      │
                         │                       │
                         │ Analysis              │
                         │ Forecast              │
                         │ Hotspots              │
                         │ Mortality             │
                         │ Simulation            │
                         │ Comparison             │
                         │ Action Plan            │
                         └───────────┬───────────┘
                                     │
              ┌──────────────────────┼──────────────────────┐
              │                      │                      │
              ▼                      ▼                      ▼
   ┌──────────────────┐   ┌──────────────────┐   ┌──────────────────┐
   │ Weather &        │   │ Thermal Analysis │   │ Demographic &    │
   │ Environmental    │   │                  │   │ Exposure Data    │
   │ Data             │   │ WBGT             │   │                  │
   │                  │   │ UTCI             │   │ Vulnerability    │
   │ Open-Meteo       │   │ Heat Index       │   │ Exposure         │
   │ Forecast         │   │ Thermal Stress   │   │ Population       │
   └────────┬─────────┘   └────────┬─────────┘   └────────┬─────────┘
            │                      │                      │
            └──────────────────────┼──────────────────────┘
                                   │
                                   ▼
                         ┌───────────────────────┐
                         │    ML COMPONENTS      │
                         │                       │
                         │ Random Forest         │
                         │ Heat-Risk Classifier  │
                         │                       │
                         │ Mortality-Risk        │
                         │ Regressor             │
                         └───────────┬───────────┘
                                     │
                                     ▼
                         ┌───────────────────────┐
                         │   DECISION SUPPORT    │
                         │                       │
                         │ HSRI                  │
                         │ Heat Action Plan      │
                         │ Cooling Simulation    │
                         │ Risk Recommendations  │
                         └───────────┬───────────┘
                                     │
                                     ▼
                         ┌───────────────────────┐
                         │    VISUAL OUTPUT      │
                         │                       │
                         │ Heat Maps              │
                         │ Risk Indicators       │
                         │ Forecasts             │
                         │ Charts                │
                         │ Recommendations       │
                         └───────────────────────┘
```

---

# 🔄 End-to-End Data Flow

```text
                    CITY SELECTION
                          │
                          ▼
                  Weather API
                          │
            ┌─────────────┴─────────────┐
            ▼                           ▼
     Current Weather              Forecast Data
            │                           │
            ▼                           ▼
     Environmental Data          Peak Conditions
            │
            ▼
     Derived Metrics
            │
       ┌────┼────┐
       ▼    ▼    ▼
      LST  NDVI  NDBI
       │    │    │
       └────┼────┘
            ▼
      Heat-Risk Model
            │
            ▼
      Heat-Risk Level
            │
       ┌────┴────┐
       ▼         ▼
 Thermal Data   Demographics
       │         │
       ▼         ▼
 WBGT / UTCI  Vulnerability
 Heat Index   + Exposure
       │         │
       └────┬────┘
            ▼
           HSRI
            │
            ▼
     Mortality Risk
            │
            ▼
      Heat Action Plan
            │
            ▼
     Cooling Simulation
            │
            ▼
       Final Insights
```

---

# 🧠 Machine Learning Architecture

## Heat-Risk Classifier

```text
Environmental Features
          │
          ▼
┌─────────────────────────┐
│     Feature Inputs      │
│                         │
│ LST                     │
│ NDVI                    │
│ NDBI                    │
│ Humidity                │
│ Building Density        │
└────────────┬────────────┘
             │
             ▼
┌─────────────────────────┐
│ Random Forest           │
│ Classifier              │
└────────────┬────────────┘
             │
             ▼
      Risk Probabilities
             │
             ▼
┌─────────────────────────┐
│ Heat Risk Category      │
│                         │
│ Low / Medium / High /   │
│ Extreme                 │
└─────────────────────────┘
```

---

## Mortality-Risk Model

```text
Thermal & Population Factors
             │
             ▼
┌─────────────────────────┐
│ WBGT                    │
│ Heat Index              │
│ Elderly Population %    │
│ Outdoor Worker %        │
└────────────┬────────────┘
             │
             ▼
┌─────────────────────────┐
│ Random Forest           │
│ Regression Models       │
└────────────┬────────────┘
             │
             ▼
┌─────────────────────────┐
│ Mortality Risk Index    │
│ Hospitalization Risk    │
│ Risk Tier               │
└─────────────────────────┘
```

---

# 🧮 Thermal Analysis Pipeline

```text
Temperature
     +
Humidity
     +
Wind Speed
     +
Solar Radiation
          │
          ▼
 Wet-Bulb Temperature
          │
          +
 Globe Temperature
          │
          ▼
         WBGT
          │
      ┌───┴────┐
      ▼        ▼
 Heat Index   UTCI
      │        │
      └───┬────┘
          ▼
    Thermal Stress
          │
          ▼
    Risk Classification
```

---

# 📊 Environmental Metrics

## LST

Land Surface Temperature represents the estimated surface-temperature condition used in heat analysis.

---

## NDVI

Normalized Difference Vegetation Index is used as a vegetation-related indicator.

Higher vegetation generally indicates greater availability of green cover.

---

## NDBI

Normalized Difference Built-up Index represents built-up characteristics of an urban environment.

---

## SUHII

Surface Urban Heat Island Intensity can be represented as:

```text
SUHII = Urban LST − Reference/Rural LST
```

This provides an indication of how much warmer the urban environment is compared with its reference area.

---

# 📈 Heat Stress Risk Index

NabhaSense combines three major dimensions:

```text
          ┌─────────────┐
          │   HAZARD    │
          │             │
          │ Heat /      │
          │ Thermal     │
          │ Conditions  │
          └──────┬──────┘
                 │
                 ▼
          ┌─────────────┐
          │VULNERABILITY│
          │             │
          │ Population  │
          │ Factors     │
          └──────┬──────┘
                 │
                 ▼
          ┌─────────────┐
          │  EXPOSURE   │
          │             │
          │ Workers /   │
          │ Housing etc.│
          └──────┬──────┘
                 │
                 ▼
             ┌───────┐
             │ HSRI  │
             └───────┘
```

Conceptually:

```text
HSRI = Hazard × Vulnerability × Exposure
```

---

# 📁 Project Structure

```text
NabhaSense/
│
├── backend/
│   │
│   ├── app/
│   │   │
│   │   ├── data/
│   │   │   ├── demographics.py
│   │   │   ├── hospital_capacity.py
│   │   │   └── real_data.py
│   │   │
│   │   ├── models/
│   │   │   ├── predictor.py
│   │   │   ├── mortality_predictor.py
│   │   │   ├── hsri_calculator.py
│   │   │   └── heat_action_plan.py
│   │   │
│   │   ├── routers/
│   │   │   └── heat.py
│   │   │
│   │   ├── services/
│   │   │   └── alert_service.py
│   │   │
│   │   ├── utils/
│   │   │   ├── thermal_indices.py
│   │   │   ├── utci.py
│   │   │   └── acclimatization.py
│   │   │
│   │   └── main.py
│   │
│   └── requirements.txt
│
├── frontend/
│   │
│   ├── app/
│   │   ├── components/
│   │   └── ...
│   │
│   ├── package.json
│   └── ...
│
├── render.yaml
├── Future Vedh (दिशा शोध चाचणी) Report.pdf
└── README.md
```

---

# 🛠️ Technology Stack

## Frontend

* Next.js
* React
* TypeScript
* Leaflet
* React Leaflet
* Mapbox GL
* Framer Motion
* GSAP
* Tailwind CSS
* Lucide React

## Backend

* Python
* FastAPI
* Uvicorn
* Scikit-learn
* NumPy
* Pandas
* Requests

## APIs & Data

* Open-Meteo Weather API
* Open-Meteo Forecast API
* Open-Meteo Historical Weather API

## Deployment

* Vercel
* Render

---

# 🔌 API Architecture

The backend organizes heat-related functionality under:

```text
/heat
```

### Main API Endpoints

| Endpoint                     | Method | Purpose                         |
| ---------------------------- | ------ | ------------------------------- |
| `/heat/analysis/{city}`      | GET    | Complete city heat analysis     |
| `/heat/thermal/{city}`       | GET    | Thermal stress analysis         |
| `/heat/mortality/{city}`     | GET    | Mortality and HSRI analysis     |
| `/heat/forecast/{city}`      | GET    | Multi-day heat forecast         |
| `/heat/action-plan/{city}`   | GET    | Heat action recommendations     |
| `/heat/hotspots/{city}`      | GET    | Heat hotspot generation         |
| `/heat/interventions/{city}` | GET    | Cooling interventions           |
| `/heat/predict`              | POST   | Heat-risk prediction            |
| `/heat/realdata/{city}`      | GET    | Environmental data              |
| `/heat/compare`              | GET    | Multi-city comparison           |
| `/heat/simulate`             | POST   | Cooling intervention simulation |
| `/heat/alert/preview/{city}` | GET    | Alert preview                   |
| `/heat/alert/send`           | POST   | Heat alert                      |
| `/heat/action-plan/simulate` | POST   | Intervention simulation         |

---

# 🚀 Getting Started

## Prerequisites

Make sure you have:

* Python 3.10+
* Node.js
* npm
* Git

---

# ⚙️ Backend Setup

Clone the repository:

```bash
git clone https://github.com/pushkar-web/NabhaSense.git
```

Navigate into the project:

```bash
cd NabhaSense
```

Navigate to the backend:

```bash
cd backend
```

Create a virtual environment:

### Windows

```bash
python -m venv venv
```

Activate it:

```bash
venv\Scripts\activate
```

### macOS / Linux

```bash
python3 -m venv venv
```

Activate it:

```bash
source venv/bin/activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Start the backend:

```bash
uvicorn app.main:app --reload
```

Backend:

```text
http://127.0.0.1:8000
```

FastAPI documentation:

```text
http://127.0.0.1:8000/docs
```

---

# 💻 Frontend Setup

Open a new terminal.

Navigate to:

```bash
cd NabhaSense/frontend
```

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

The frontend can then be accessed through the local Next.js development server.

---

# 🔗 Frontend ↔ Backend Communication

```text
┌───────────────────────┐
│    Next.js Frontend   │
│                       │
│ React + TypeScript    │
└───────────┬───────────┘
            │
            │ HTTP / REST
            ▼
┌───────────────────────┐
│    FastAPI Backend    │
│                       │
│       /heat/*         │
└───────────┬───────────┘
            │
     ┌──────┼───────┐
     ▼      ▼       ▼
 Weather    ML    Thermal
   Data   Models  Analysis
     │      │       │
     └──────┼───────┘
            ▼
     Risk & Insights
            │
            ▼
      Frontend UI
```

---

# ⚡ Performance

NabhaSense includes several performance-oriented components.

### Caching

Weather and forecast data can be cached to reduce repeated external API requests.

### Concurrent Processing

Multi-city comparison can process multiple city requests concurrently.

### Modular Backend

Backend functionality is separated into:

```text
Data
Models
Routers
Services
Utilities
```

This makes individual components easier to maintain and extend.

---

# 🧪 Project Limitations

NabhaSense is a **prototype decision-support system** and some components use estimated or simulated values.

Important considerations include:

* Some environmental indicators are estimated rather than directly measured.
* Certain ML components use synthetic training data.
* Thermal calculations include empirical approximations.
* Mortality-risk outputs are analytical estimates and are not clinical predictions.
* Results should not be interpreted as official emergency or medical recommendations.

These limitations are important when interpreting the outputs of the system.

---

# 🔮 Future Improvements

Future versions of NabhaSense can include:

* 🛰️ Integration of satellite-derived LST, NDVI, and NDBI
* 🗺️ Higher-resolution ward-level geospatial data
* 📚 Training ML models on larger real-world heat-event datasets
* 🏥 Integration with validated health and hospitalization datasets
* 🧠 Explainable AI for heat-risk predictions
* 📊 Historical heat-risk trend analysis
* 🔔 Real-time notification and alert systems
* 📱 Improved mobile responsiveness
* ☁️ Scalable cloud architecture
* 🧪 Automated backend and ML testing
* 📈 Advanced heat-risk forecasting
* 🗃️ Database integration for historical records

---

# ⚠️ Disclaimer

NabhaSense is developed as an **educational, analytical, and decision-support prototype**.

The heat-risk scores, forecasts, mortality estimates, and intervention simulations should not be treated as official medical, emergency-management, or public-safety predictions.

The system contains estimated and simulated components, and its outputs should therefore be interpreted as analytical indicators rather than verified real-world measurements.

---

# 👥 Team Signal Lost

### Team Members

| 👤 Member          |
| ------------------ |
| **Suchita Nigam**  |
| **Dashami Jituri** |
| **Pushkar Singh**  |
| **Manas Nigam**    |

> **Signal Lost** — Building an intelligent platform for urban heat analysis, risk assessment, and mitigation planning.

---

# ⭐ Project

If you find **NabhaSense** interesting, consider giving the repository a ⭐.

**Repository:**
https://github.com/pushkar-web/NabhaSense.git

---

## 👩‍💻 Team

**Signal Lost**

* Suchita Nigam
* Dashami Jituri
* Pushkar Singh
* Manas Nigam
