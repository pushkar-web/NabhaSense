const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://nabhasense-backend.onrender.com';

export const api = {
  async getHeatData(city: string) {
    const res = await fetch(`${API_URL}/heat/analysis/${city}`);
    if (!res.ok) throw new Error('Failed to fetch heat data');
    return res.json();
  },

  async getHotspots(city: string) {
    const res = await fetch(`${API_URL}/heat/hotspots/${city}`);
    if (!res.ok) throw new Error('Failed to fetch hotspots');
    return res.json();
  },

  async getCoolingInterventions(city: string) {
    const res = await fetch(`${API_URL}/heat/interventions/${city}`);
    if (!res.ok) throw new Error('Failed to fetch interventions');
    return res.json();
  },

  async predictHeatRisk(data: object) {
    const res = await fetch(`${API_URL}/heat/predict`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Prediction failed');
    return res.json();
  },

  // ── NEW: PS26083 additions ──

  async getThermalStress(city: string) {
    const res = await fetch(`${API_URL}/heat/thermal/${city}`);
    if (!res.ok) throw new Error('Failed to fetch thermal stress data');
    return res.json();
  },

  async getMortalityRisk(city: string) {
    const res = await fetch(`${API_URL}/heat/mortality/${city}`);
    if (!res.ok) throw new Error('Failed to fetch mortality risk data');
    return res.json();
  },

  async getForecast(city: string, days: number = 5) {
    const res = await fetch(`${API_URL}/heat/forecast/${city}?days=${days}`);
    if (!res.ok) throw new Error('Failed to fetch forecast data');
    return res.json();
  },

  async getActionPlan(city: string) {
    const res = await fetch(`${API_URL}/heat/action-plan/${city}`);
    if (!res.ok) throw new Error('Failed to fetch action plan');
    return res.json();
  },

  async simulateActionPlan(data: object) {
    const res = await fetch(`${API_URL}/heat/action-plan/simulate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Action plan simulation failed');
    return res.json();
  },

  async previewAlert(city: string, channel: string = 'sms') {
    const res = await fetch(`${API_URL}/heat/alert/preview/${city}?channel=${channel}`);
    if (!res.ok) throw new Error('Failed to preview alert');
    return res.json();
  },

  async sendAlert(data: object) {
    const res = await fetch(`${API_URL}/heat/alert/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to send alert');
    return res.json();
  },
};
