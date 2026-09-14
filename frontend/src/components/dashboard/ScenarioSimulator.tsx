'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface SimulatorProps {
  city: string;
  baseLST: number;
  originalRisk: string;
  population: number;
}

export default function ScenarioSimulator({ city, baseLST, originalRisk, population }: SimulatorProps) {
  const [params, setParams] = useState({
    treeCoverIncrease: 0,
    coolRoofPercentage: 0,
    waterBodyIncrease: 0,
    albedoIncrease: 0.3,
  });
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const simulate = async () => {
    setLoading(true);
    try {
      const res = await fetch('https://nabhasense-backend.onrender.com/heat/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          city,
          baseLST,
          originalRisk,
          population,
          ...params,
        }),
      });
      setResult(await res.json());
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const getRiskColor = (risk: string) => ({
    Low: '#00d4aa', Medium: '#ffd700', High: '#ff6b35', Extreme: '#ff3d3d'
  }[risk] || '#fff');

  const sliders = [
    { key: 'treeCoverIncrease', label: '🌳 Tree Cover Increase', unit: '%', min: 0, max: 50, step: 5, desc: 'Urban greening — parks, green corridors' },
    { key: 'coolRoofPercentage', label: '🏠 Cool Roof Coverage', unit: '%', min: 0, max: 100, step: 10, desc: 'High-albedo reflective roof surfaces' },
    { key: 'waterBodyIncrease', label: '💧 Water Body Increase', unit: '%', min: 0, max: 30, step: 5, desc: 'Lakes, fountains, wetlands' },
    { key: 'albedoIncrease', label: '☀️ Albedo Value', unit: '', min: 0.1, max: 0.9, step: 0.1, desc: 'Surface reflectivity (0=dark, 1=bright)' },
  ];

  return (
    <div style={{ background: 'rgba(17,24,39,0.9)', border: '1px solid #1e2d4a', borderRadius: '16px', padding: '1.5rem' }}>
      <h3 style={{ color: '#f0f4ff', fontWeight: 700, marginBottom: '0.5rem', fontSize: '0.95rem' }}>
        🧪 Scenario Simulator — Physics-Informed Cooling
      </h3>
      <p style={{ color: '#8892b0', fontSize: '0.8rem', marginBottom: '1.5rem' }}>
        Adjust interventions and see real-time temperature impact using urban climate physics equations
      </p>

      {/* Base values */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <div style={{ background: '#0d1628', borderRadius: '10px', padding: '0.75rem 1.25rem', border: '1px solid #1e2d4a' }}>
          <div style={{ fontSize: '0.7rem', color: '#8892b0', marginBottom: '0.25rem' }}>BASE LST</div>
          <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#ff6b35' }}>{baseLST}°C</div>
        </div>
        <div style={{ background: '#0d1628', borderRadius: '10px', padding: '0.75rem 1.25rem', border: '1px solid #1e2d4a' }}>
          <div style={{ fontSize: '0.7rem', color: '#8892b0', marginBottom: '0.25rem' }}>CURRENT RISK</div>
          <div style={{ fontSize: '1.3rem', fontWeight: 800, color: getRiskColor(originalRisk) }}>{originalRisk}</div>
        </div>
        <div style={{ background: '#0d1628', borderRadius: '10px', padding: '0.75rem 1.25rem', border: '1px solid #1e2d4a' }}>
          <div style={{ fontSize: '0.7rem', color: '#8892b0', marginBottom: '0.25rem' }}>CITY</div>
          <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#f0f4ff' }}>{city}</div>
        </div>
      </div>

      {/* Sliders */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem' }}>
        {sliders.map(slider => (
          <div key={slider.key} style={{ background: '#0d1628', borderRadius: '12px', padding: '1rem', border: '1px solid #1e2d4a' }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#f0f4ff', marginBottom: '0.25rem' }}>{slider.label}</div>
            <div style={{ fontSize: '0.72rem', color: '#8892b0', marginBottom: '0.75rem' }}>{slider.desc}</div>
            <input type="range" min={slider.min} max={slider.max} step={slider.step}
              value={(params as any)[slider.key]}
              onChange={e => setParams(prev => ({ ...prev, [slider.key]: parseFloat(e.target.value) }))}
              style={{ width: '100%', accentColor: '#00d4aa', marginBottom: '0.4rem' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem' }}>
              <span style={{ color: '#8892b0' }}>{slider.min}{slider.unit}</span>
              <span style={{ color: '#00d4aa', fontWeight: 800, fontSize: '1rem' }}>
                {(params as any)[slider.key]}{slider.unit}
              </span>
              <span style={{ color: '#8892b0' }}>{slider.max}{slider.unit}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Simulate Button */}
      <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
        onClick={simulate}
        style={{
          width: '100%', padding: '0.9rem', borderRadius: '12px', border: 'none',
          background: loading ? '#1e2d4a' : 'linear-gradient(135deg, #00d4aa, #0099ff)',
          color: '#fff', fontSize: '1rem', fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer',
          marginBottom: '1.5rem',
        }}>
        {loading ? '⚡ Simulating...' : '⚡ Run Physics Simulation'}
      </motion.button>

      {/* Results */}
      <AnimatePresence>
        {result && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>

            {/* Before vs After */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '1rem', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div style={{ background: '#0d1628', borderRadius: '12px', padding: '1.25rem', textAlign: 'center', border: '1px solid #ff3d3d40' }}>
                <div style={{ fontSize: '0.7rem', color: '#8892b0', marginBottom: '0.4rem', textTransform: 'uppercase' }}>BEFORE</div>
                <div style={{ fontSize: '2rem', fontWeight: 900, color: '#ff3d3d' }}>{result.baseLST}°C</div>
                <div style={{ fontSize: '0.8rem', color: getRiskColor(result.originalRisk), fontWeight: 600 }}>{result.originalRisk} Risk</div>
              </div>

              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '1.5rem' }}>→</div>
                <div style={{ fontSize: '0.75rem', color: '#00d4aa', fontWeight: 700 }}>-{result.totalCooling}°C</div>
              </div>

              <div style={{ background: '#0d1628', borderRadius: '12px', padding: '1.25rem', textAlign: 'center', border: `1px solid ${getRiskColor(result.newRisk)}40` }}>
                <div style={{ fontSize: '0.7rem', color: '#8892b0', marginBottom: '0.4rem', textTransform: 'uppercase' }}>AFTER</div>
                <div style={{ fontSize: '2rem', fontWeight: 900, color: getRiskColor(result.newRisk) }}>{result.newLST}°C</div>
                <div style={{ fontSize: '0.8rem', color: getRiskColor(result.newRisk), fontWeight: 600 }}>{result.newRisk} Risk</div>
              </div>
            </div>

            {/* Breakdown */}
            <div style={{ background: '#0d1628', borderRadius: '12px', padding: '1.25rem', marginBottom: '1rem', border: '1px solid #1e2d4a' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#f0f4ff', marginBottom: '0.75rem' }}>Cooling Breakdown</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {[
                  { label: '🌳 Tree Cover', value: result.breakdown.treeCooling },
                  { label: '🏠 Cool Roofs', value: result.breakdown.coolRoofCooling },
                  { label: '💧 Water Bodies', value: result.breakdown.waterCooling },
                ].map(item => (
                  <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.82rem', color: '#8892b0' }}>{item.label}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <div style={{ width: '80px', height: '6px', background: '#1e2d4a', borderRadius: '3px' }}>
                        <div style={{ width: `${Math.min(100, (item.value / result.totalCooling) * 100)}%`, height: '6px', background: '#00d4aa', borderRadius: '3px' }} />
                      </div>
                      <span style={{ fontSize: '0.82rem', color: '#00d4aa', fontWeight: 700, minWidth: '50px', textAlign: 'right' }}>-{item.value}°C</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Impact Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div style={{ background: '#0d1628', borderRadius: '10px', padding: '1rem', border: '1px solid #00d4aa30', textAlign: 'center' }}>
                <div style={{ fontSize: '0.7rem', color: '#8892b0', marginBottom: '0.3rem' }}>CO₂ SAVED</div>
                <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#00d4aa' }}>{result.co2Saved}T</div>
              </div>
              <div style={{ background: '#0d1628', borderRadius: '10px', padding: '1rem', border: '1px solid #0099ff30', textAlign: 'center' }}>
                <div style={{ fontSize: '0.7rem', color: '#8892b0', marginBottom: '0.3rem' }}>PEOPLE BENEFITED</div>
                <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#0099ff' }}>{Math.round(result.populationBenefited).toLocaleString()}</div>
              </div>
            </div>

          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}