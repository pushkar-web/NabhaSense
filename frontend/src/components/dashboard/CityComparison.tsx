'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';

// FIXED absolute scales — NOT derived from the selected cities' min/max.
// This is the actual fix for the "one city 100%, another 0%" bug: relative
// min-max normalization exaggerates small real differences (e.g. 36C vs
// 38C) into full-bar-vs-empty-bar. Anchoring to realistic absolute ranges
// means bar width reflects the real magnitude of the difference.
const SCALES = {
  avgLST: { min: 25, max: 50 },       // °C, realistic Indian urban LST range
  wbgt: { min: 20, max: 40 },         // °C, WBGT danger zone starts ~28-30
  mortalityRiskIndex: { min: 0, max: 100 },
  hsri: { min: 0, max: 80 },          // HSRI rarely exceeds ~70 in practice
};

const tierColor = (tier: string) => ({
  Low: '#00d4aa',
  Moderate: '#ffd700',
  High: '#ff6b35',
  Critical: '#ff3d3d',
}[tier] || '#8892b0');

// Absolute-threshold coloring (not relative-to-selection) — matches the
// same WBGT/mortality categories used everywhere else in the app.
const colorForMetric = (metric: keyof typeof SCALES, val: number) => {
  if (metric === 'avgLST') return val < 33 ? '#00d4aa' : val < 38 ? '#ffd700' : val < 44 ? '#ff6b35' : '#ff3d3d';
  if (metric === 'wbgt') return val < 27 ? '#00d4aa' : val < 30 ? '#ffd700' : val < 32 ? '#ff9800' : val < 35 ? '#ff6b35' : '#ff3d3d';
  if (metric === 'mortalityRiskIndex') return val < 20 ? '#00d4aa' : val < 45 ? '#ffd700' : val < 70 ? '#ff6b35' : '#ff3d3d';
  if (metric === 'hsri') return val < 15 ? '#00d4aa' : val < 35 ? '#ffd700' : val < 60 ? '#ff6b35' : '#ff3d3d';
  return '#8892b0';
};

const barWidthPct = (metric: keyof typeof SCALES, val: number) => {
  const { min, max } = SCALES[metric];
  const pct = ((val - min) / (max - min)) * 100;
  return Math.max(2, Math.min(100, pct)); // floor at 2% so a bar is always visible, never truly "0"
};

export default function CityComparison() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(['mumbai', 'delhi', 'bangalore', 'chennai']);

  const cities = ['mumbai', 'thane', 'delhi', 'bangalore', 'chennai', 'hyderabad', 'pune'];

  const compare = async () => {
    setLoading(true);
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://nabhasense-backend.onrender.com';
      const res = await fetch(`${API_URL}/heat/compare?cities=${selected.join(',')}`);
      const json = await res.json();
      setData(json.comparison || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const metrics: { key: keyof typeof SCALES; label: string; icon: string; unit: string }[] = [
    { key: 'avgLST', label: 'Average LST (30-day)', icon: '🌡️', unit: '°C' },
    { key: 'wbgt', label: 'WBGT (Thermal Stress)', icon: '🧬', unit: '°C' },
    { key: 'mortalityRiskIndex', label: 'Mortality Risk Index', icon: '🏥', unit: '/100' },
    { key: 'hsri', label: 'HSRI (Hazard × Vuln × Exposure)', icon: '🧮', unit: '' },
  ];

  return (
    <div style={{ background: 'rgba(17,24,39,0.9)', border: '1px solid #1e2d4a', borderRadius: '16px', padding: '1.5rem' }}>
      <h3 style={{ color: '#f0f4ff', fontWeight: 700, marginBottom: '0.5rem', fontSize: '0.95rem' }}>
        🏙️ City Heat & Health-Risk Comparison — Real Data
      </h3>
      <p style={{ color: '#8892b0', fontSize: '0.8rem', marginBottom: '1.25rem' }}>
        Compare thermal stress and mortality risk across Indian cities — bars use a fixed real-world scale, so a
        2°C difference looks like a 2°C difference, not 100% vs 0%.
      </p>

      {/* City selector */}
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
        {cities.map(city => (
          <button key={city} onClick={() => setSelected(prev =>
            prev.includes(city) ? prev.filter(c => c !== city) : [...prev, city]
          )}
            style={{
              padding: '0.4rem 1rem', borderRadius: '2rem', border: 'none', cursor: 'pointer',
              background: selected.includes(city) ? 'rgba(0,212,170,0.2)' : 'rgba(255,255,255,0.05)',
              color: selected.includes(city) ? '#00d4aa' : '#8892b0',
              fontSize: '0.82rem', fontWeight: 500,
              outline: selected.includes(city) ? '1.5px solid #00d4aa' : '1.5px solid #1e2d4a',
            }}>
            {city.charAt(0).toUpperCase() + city.slice(1)}
          </button>
        ))}
      </div>

      <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
        onClick={compare}
        style={{
          padding: '0.75rem 2rem', borderRadius: '2rem', border: 'none',
          background: loading ? '#1e2d4a' : 'linear-gradient(135deg, #00d4aa, #0099ff)',
          color: '#fff', fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer',
          fontSize: '0.9rem', marginBottom: '1.5rem',
        }}>
        {loading ? '🛰️ Fetching real data...' : '🛰️ Compare Cities'}
      </motion.button>

      {data.length > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>

          {/* Bar charts for each metric — fixed absolute scale */}
          {metrics.map((metric, mi) => (
            <div key={metric.key} style={{ background: '#0d1628', borderRadius: '12px', padding: '1.25rem', marginBottom: '1rem', border: '1px solid #1e2d4a' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#f0f4ff', marginBottom: '1rem' }}>
                {metric.icon} {metric.label}
              </div>
              {data.map((city, i) => {
                const val = city[metric.key] ?? 0;
                const color = colorForMetric(metric.key, val);
                return (
                  <motion.div key={i} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: mi * 0.05 + i * 0.05 }}
                    style={{ marginBottom: '0.7rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                      <span style={{ fontSize: '0.8rem', color: '#f0f4ff', fontWeight: 600 }}>{city.city}</span>
                      <span style={{ fontSize: '0.8rem', color, fontWeight: 700 }}>
                        {val}{metric.unit}
                      </span>
                    </div>
                    <div style={{ height: '8px', background: '#1e2d4a', borderRadius: '4px' }}>
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${barWidthPct(metric.key, val)}%` }}
                        transition={{ delay: mi * 0.05 + i * 0.05 + 0.15, duration: 0.7 }}
                        style={{ height: '8px', borderRadius: '4px', background: color }}
                      />
                    </div>
                  </motion.div>
                );
              })}
            </div>
          ))}

          {/* Per-city summary cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.75rem' }}>
            {data.map((city, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                style={{ background: '#0d1628', borderRadius: '12px', padding: '1rem', border: '1px solid #1e2d4a' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#f0f4ff' }}>{city.city}</span>
                  <span style={{ padding: '0.15rem 0.55rem', borderRadius: '2rem', fontSize: '0.65rem', fontWeight: 700, background: `${tierColor(city.riskTier)}18`, color: tierColor(city.riskTier), border: `1px solid ${tierColor(city.riskTier)}35` }}>
                    {city.riskTier?.toUpperCase()}
                  </span>
                </div>
                {[
                  { label: 'Avg LST', value: `${city.avgLST}°C`, color: colorForMetric('avgLST', city.avgLST) },
                  { label: 'WBGT', value: `${city.wbgt}°C`, color: colorForMetric('wbgt', city.wbgt) },
                  { label: 'UTCI', value: `${city.utci}°C`, color: '#bf5af2' },
                  { label: 'Mortality Risk', value: `${city.mortalityRiskIndex}/100`, color: colorForMetric('mortalityRiskIndex', city.mortalityRiskIndex) },
                  { label: 'HSRI', value: city.hsri, color: colorForMetric('hsri', city.hsri) },
                  { label: 'SUHII', value: `${city.suhii}°C`, color: '#bf5af2' },
                  { label: 'NDVI', value: city.ndvi, color: '#00d4aa' },
                ].map(stat => (
                  <div key={stat.label} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                    <span style={{ fontSize: '0.73rem', color: '#8892b0' }}>{stat.label}</span>
                    <span style={{ fontSize: '0.73rem', fontWeight: 700, color: stat.color }}>{stat.value}</span>
                  </div>
                ))}
                <div style={{ marginTop: '0.5rem', fontSize: '0.68rem', padding: '0.2rem 0.5rem', borderRadius: '4px',
                  background: city.dataQuality === 'real' ? 'rgba(0,212,170,0.1)' : 'rgba(255,107,53,0.1)',
                  color: city.dataQuality === 'real' ? '#00d4aa' : '#ff6b35', textAlign: 'center' }}>
                  {city.dataQuality === 'real' ? '✅ Live Data' : '⚠️ Estimated'}
                </div>
              </motion.div>
            ))}
          </div>

        </motion.div>
      )}
    </div>
  );
}
