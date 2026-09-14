export interface HeatDataPoint {
  lat: number;
  lng: number;
  lst: number; // Land Surface Temperature
  ndvi: number; // Vegetation Index
  ndbi: number; // Built-up Index
  humidity: number;
  heatRisk: 'low' | 'medium' | 'high' | 'extreme';
  district: string;
  city: string;
}

export interface CoolingIntervention {
  id: string;
  type: 'urban_greening' | 'cool_roof' | 'water_body' | 'ventilation';
  lat: number;
  lng: number;
  impactScore: number;
  tempReduction: number;
  area: string;
  priority: 'low' | 'medium' | 'high';
}

export interface HeatAnalysis {
  city: string;
  avgLST: number;
  maxLST: number;
  hotspotCount: number;
  riskLevel: string;
  dominantDriver: string;
  coolingPotential: number;
}

export interface CityData {
  name: string;
  lat: number;
  lng: number;
  state: string;
  population: number;
}

// ── PS26083 additions ──

export interface ThermalIndices {
  wbgt: number;
  wetBulbTemp: number;
  globeTemp: number;
  dryBulbTemp: number;
  heatIndex: number;
  vaporPressure: number;
  stressCategory: 'Low' | 'Moderate' | 'High' | 'Very High' | 'Extreme';
  formula: string;
  globeTempNote: string;
  utci: number;
  utciNote: string;
  utciStressCategory: 'No Stress' | 'Moderate Heat Stress' | 'Strong Heat Stress' | 'Very Strong Heat Stress' | 'Extreme Heat Stress';
  acclimatizationShift: number;
}

export interface MortalityRiskResult {
  mortalityRiskIndex: number;
  hospitalizationSpikeProbability: number;
  riskTier: 'Low' | 'Moderate' | 'High' | 'Critical';
}

export interface WardMortalityRisk extends MortalityRiskResult {
  ward: string;
  elderlyPct: number;
  outdoorWorkerPct: number;
  population: number;
  vulnerabilityMultiplier: number;
  lat: number;
  lng: number;
  marginalWorkerPct: number;
  illiteracyPct: number;
  poorHousingPct: number;
  noElectricityPct: number;
  noWaterAccessPct: number;
  hsri: number;
  hsriTier: 'Low' | 'Moderate' | 'High' | 'Critical';
  vulnerabilityIndex: number;
  exposureIndex: number;
}

export interface CityHsriLevel extends WardMortalityRisk {
  hazardIndex: number;
}

export interface MortalityRiskResponse {
  city: string;
  wbgt: number;
  utci: number;
  heatIndex: number;
  cityLevel: CityHsriLevel;
  hsriFormula: string;
  wardLevel: WardMortalityRisk[];
}

export interface WardForecastEntry {
  ward: string;
  hsri: number;
  hsriTier: 'Low' | 'Moderate' | 'High' | 'Critical';
}

export interface ForecastDay {
  date: string;
  peakTemp: number;
  peakHumidity: number;
  wbgt: number;
  utci: number;
  heatIndex: number;
  stressCategory: 'Low' | 'Moderate' | 'High' | 'Very High' | 'Extreme';
  utciStressCategory: string;
  mortalityRiskIndex: number;
  hospitalizationSpikeProbability: number;
  riskTier: 'Low' | 'Moderate' | 'High' | 'Critical';
  wardForecast: WardForecastEntry[];
}

export interface ForecastResponse {
  city: string;
  forecastDays: number;
  forecast: ForecastDay[];
  worstDay: ForecastDay | null;
  source: string;
}

// ── Heat Action Plan (replaces Predictor + Simulator) ──

export interface CoolingCentersAdvisory {
  triggered: boolean;
  centersRecommended: number;
  vulnerablePopulationCovered: number;
  capacityPerCenter: number;
}

export interface WorkAdvisory {
  restriction: string;
  guidance: string;
}

export interface PowerGridAlert {
  triggered: boolean;
  reason: string | null;
  recommendedAction: string | null;
}

export interface HospitalCapacityAlert {
  totalHospitalBeds: number;
  surgeCapacityBeds: number;
  predictedHeatAdmissions: number;
  capacityUtilizationPct: number;
  exceedsCapacity: boolean;
  note: string;
}

export interface ActionPlanResponse {
  city: string;
  overallAlertLevel: 'Watch' | 'Yellow Alert' | 'Orange Alert' | 'Red Alert';
  stressCategory: string;
  wbgt: number;
  utci: number;
  mortalityRiskIndex: number;
  coolingCenters: CoolingCentersAdvisory;
  outdoorWorkAdvisory: WorkAdvisory;
  powerGridAlert: PowerGridAlert;
  hospitalCapacityAlert: HospitalCapacityAlert;
}

export interface ActionPlanSimulationResponse {
  totalCooling: number;
  before: { temp: number; thermal: any; mortality: any; plan: ActionPlanResponse };
  after: { temp: number; thermal: any; mortality: any; plan: ActionPlanResponse };
  alertDowngraded: boolean;
}

export interface AlertPreviewResponse {
  city: string;
  channel: 'sms' | 'whatsapp';
  overallAlertLevel: string;
  shouldTrigger: boolean;
  message: string;
}

export interface AlertSendResponse {
  status: 'sent' | 'simulated' | 'failed';
  channel: string;
  toNumber: string;
  message: string;
  note?: string;
  twilioSid?: string;
  error?: string;
}
