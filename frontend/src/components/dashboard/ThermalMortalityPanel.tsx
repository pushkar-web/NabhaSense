'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import dynamic from 'next/dynamic';
import { api } from '@/lib/api';

const WardRiskMap = dynamic(() => import('@/components/map/WardRiskMap'), { ssr: false });

interface ThermalMortalityPanelProps {
  city: string;
}

const cityCoords: any = {
  mumbai: [19.0760, 72.8777],
  thane: [19.2183, 72.9781],
  delhi: [28.6139, 77.2090],
  bangalore: [12.9716, 77.5946],
  chennai: [13.0827, 80.2707],
  hyderabad: [17.3850, 78.4867],
  pune: [18.5204, 73.8567],
};

const stressColor = (category: string) => ({
  Low: '#00d4aa',
  Moderate: '#ffd700',
  High: '#ff9800',
  'Very High': '#ff6b35',
  Extreme: '#ff3d3d',
}[category] || '#fff');

const utciColor = (category: string) => ({
  'No Stress': '#00d4aa',
  'Moderate Heat Stress': '#ffd700',
  'Strong Heat Stress': '#ff9800',
  'Very Strong Heat Stress': '#ff6b35',
  'Extreme Heat Stress': '#ff3d3d',
}[category] || '#fff');

const tierColor = (tier: string) => ({
  Low: '#00d4aa',
  Moderate: '#ffd700',
  High: '#ff6b35',
  Critical: '#ff3d3d',
}[tier] || '#fff');

const cardStyle: React.CSSProperties = {
  background: 'rgba(13,22,40,0.75)',
  backdropFilter: 'blur(16px)',
  border: '1px solid rgba(30,45,74,0.8)',
  borderRadius: '16px',
  padding: '1.25rem',
};

export default function ThermalMortalityPanel({ city }: ThermalMortalityPanelProps) {
  const [loading, setLoading] = useState(false);
  const [thermal, setThermal] = useState<any>(null);
  const [mortality, setMortality] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [t, m] = await Promise.all([
          api.getThermalStress(city.toLowerCase()),
          api.getMortalityRisk(city.toLowerCase()),
        ]);
        if (!cancelled) {
          setThermal(t);
          setMortality(m);
        }
      } catch (e) {
        if (!cancelled) setError('Could not load thermal/mortality data. Try again.');
        console.error(e);
      }
      if (!cancelled) setLoading(false);
    }
    load();
    return () => { cancelled = true; };
  }, [city]);

  if (loading) {
    return (
      <div style={{ ...cardStyle, textAlign: 'center', color: '#6b7a90' }}>
        🧬 Computing WBGT, UTCI, Heat Index &amp; HSRI...
      </div>
    );
  }

  if (error || !thermal || !mortality) {
    return (
      <div style={{ ...cardStyle, textAlign: 'center', color: '#ff6b35' }}>
        {error || 'No data available.'}
      </div>
    );
  }

  const wbgtColor = stressColor(thermal.stressCategory);
  const utciClr = utciColor(thermal.utciStressCategory);
  const cityRisk = mortality.cityLevel;
  const center = cityCoords[city.toLowerCase()] || cityCoords.mumbai;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

      {/* ── Research-grounded methodology badge ── */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
        style={{ ...cardStyle, padding: '1rem 1.25rem', borderColor: 'rgba(0,212,170,0.3)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
          <span style={{ fontSize: '1.1rem' }}>📚</span>
          <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#00d4aa' }}>Research-Grounded Methodology</span>
        </div>
        <p style={{ fontSize: '0.75rem', color: '#8892b0', lineHeight: 1.6, margin: 0 }}>
          Three environmental/health indices (WBGT, Heat Index, UTCI) instead of one — per <em>Heat Stress &amp; Public Health: A Critical Review (2008)</em>,
          which found 300+ thermal indices exist because temperature alone can't represent human thermal stress.
          The <strong>HSRI = Hazard × Vulnerability × Exposure</strong> model below follows the exact methodology from the
          <em> 2026 Mumbai coastal-city heat-stress-warning framework</em>, extended here to be dynamic, forecast-based,
          and comparable across 7 cities — the multi-city, interactive, mitigation-testable system that paper's own
          "Research Gap" section says doesn't yet exist. Three gaps that paper explicitly flagged as unresolved are
          also closed here: <strong>climate-acclimatized thresholds</strong> (2008 review, insight #2 — see the note below),
          <strong> ward-level forecasting</strong> instead of a static snapshot (see the 5-Day Forecast tab), and
          <strong> hospital-capacity comparison</strong> (see the Heat Action Plan tab) — all three explicitly named as
          limitations or wishlist items the studied papers couldn't implement.
        </p>
      </motion.div>

      {/* ── WBGT / UTCI / Heat Index hero row ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.9rem' }}>
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          style={{ ...cardStyle, textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: `linear-gradient(90deg, transparent, ${wbgtColor}80, transparent)` }} />
          <div style={{ fontSize: '0.65rem', color: '#5a6b82', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.4rem' }}>WBGT</div>
          <div style={{ fontSize: '1.9rem', fontWeight: 800, color: wbgtColor }}>{thermal.wbgt}°C</div>
          <div style={{ fontSize: '0.72rem', fontWeight: 700, color: wbgtColor, marginTop: '0.3rem' }}>{thermal.stressCategory} Stress</div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.04 }}
          style={{ ...cardStyle, textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: `linear-gradient(90deg, transparent, ${utciClr}80, transparent)` }} />
          <div style={{ fontSize: '0.65rem', color: '#5a6b82', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.4rem' }}>UTCI</div>
          <div style={{ fontSize: '1.9rem', fontWeight: 800, color: utciClr }}>{thermal.utci}°C</div>
          <div style={{ fontSize: '0.72rem', fontWeight: 700, color: utciClr, marginTop: '0.3rem' }}>{thermal.utciStressCategory}</div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}
          style={{ ...cardStyle, textAlign: 'center' }}>
          <div style={{ fontSize: '0.65rem', color: '#5a6b82', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.4rem' }}>Heat Index (NWS)</div>
          <div style={{ fontSize: '1.9rem', fontWeight: 800, color: '#ff6b35' }}>{thermal.heatIndex}°C</div>
          <div style={{ fontSize: '0.7rem', color: '#5a6b82', marginTop: '0.3rem' }}>Vapor Pressure: {thermal.vaporPressure} hPa</div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}
          style={cardStyle}>
          <div style={{ fontSize: '0.65rem', color: '#5a6b82', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.5rem' }}>WBGT Components</div>
          {[
            { label: 'Wet Bulb (Tw)', value: `${thermal.wetBulbTemp}°C` },
            { label: 'Globe Temp (Tg, est.)', value: `${thermal.globeTemp}°C` },
            { label: 'Dry Bulb (Td)', value: `${thermal.dryBulbTemp}°C` },
          ].map((row, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#c0cfe4', padding: '0.2rem 0' }}>
              <span>{row.label}</span><span style={{ fontWeight: 700 }}>{row.value}</span>
            </div>
          ))}
          <div style={{ fontSize: '0.62rem', color: '#5a6b82', marginTop: '0.4rem', fontStyle: 'italic' }}>{thermal.formula}</div>
        </motion.div>
      </div>

      {/* Honesty notes */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <div style={{ fontSize: '0.72rem', color: '#5a6b82', padding: '0.5rem 0.9rem', background: 'rgba(255,152,0,0.06)', border: '1px solid rgba(255,152,0,0.2)', borderRadius: '8px' }}>
          ⚠️ WBGT: {thermal.globeTempNote}
        </div>
        <div style={{ fontSize: '0.72rem', color: '#5a6b82', padding: '0.5rem 0.9rem', background: 'rgba(255,152,0,0.06)', border: '1px solid rgba(255,152,0,0.2)', borderRadius: '8px' }}>
          ⚠️ UTCI: {thermal.utciNote}
        </div>
        <div style={{ fontSize: '0.72rem', color: '#8892b0', padding: '0.5rem 0.9rem', background: 'rgba(0,212,170,0.06)', border: '1px solid rgba(0,212,170,0.2)', borderRadius: '8px' }}>
          🌡️ <strong style={{ color: '#00d4aa' }}>Acclimatization-adjusted:</strong> stress category boundaries are shifted {thermal.acclimatizationShift >= 0 ? '+' : ''}{thermal.acclimatizationShift}°C for {city} relative to the national baseline — per the 2008 review's finding that heat-mortality thresholds differ between populations acclimatized to hotter vs. cooler climates.
        </div>
      </div>

      {/* ── HSRI = Hazard x Vulnerability x Exposure ── */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.14 }} style={cardStyle}>
        <h3 style={{ color: '#f0f4ff', fontWeight: 700, fontSize: '0.95rem', marginBottom: '0.3rem' }}>
          🧮 Heat Stress Risk Index (HSRI) — {mortality.city}
        </h3>
        <div style={{ fontSize: '0.7rem', color: '#5a6b82', fontStyle: 'italic', marginBottom: '1rem' }}>{mortality.hsriFormula}</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.9rem' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '0.62rem', color: '#5a6b82', textTransform: 'uppercase', marginBottom: '0.3rem' }}>Hazard Index</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#ff6b35' }}>{cityRisk.hazardIndex}</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '0.62rem', color: '#5a6b82', textTransform: 'uppercase', marginBottom: '0.3rem' }}>Vulnerability Index</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0099ff' }}>{cityRisk.vulnerabilityIndex}</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '0.62rem', color: '#5a6b82', textTransform: 'uppercase', marginBottom: '0.3rem' }}>Exposure Index</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#ffd700' }}>{cityRisk.exposureIndex}</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '0.62rem', color: '#5a6b82', textTransform: 'uppercase', marginBottom: '0.3rem' }}>HSRI</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: tierColor(cityRisk.hsriTier) }}>{cityRisk.hsri}</div>
            <div style={{ fontSize: '0.68rem', fontWeight: 700, color: tierColor(cityRisk.hsriTier) }}>{cityRisk.hsriTier}</div>
          </div>
        </div>
      </motion.div>

      {/* ── Mortality Risk Index — city level ── */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.16 }} style={cardStyle}>
        <h3 style={{ color: '#f0f4ff', fontWeight: 700, fontSize: '0.95rem', marginBottom: '1rem' }}>
          🏥 Mortality Risk Index (ML) — {mortality.city}
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.9rem' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '0.65rem', color: '#5a6b82', textTransform: 'uppercase', marginBottom: '0.3rem' }}>Mortality Risk Index</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: tierColor(cityRisk.riskTier) }}>{cityRisk.mortalityRiskIndex}<span style={{ fontSize: '1rem' }}>/100</span></div>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: tierColor(cityRisk.riskTier) }}>{cityRisk.riskTier}</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '0.65rem', color: '#5a6b82', textTransform: 'uppercase', marginBottom: '0.3rem' }}>Hospitalization Spike Prob.</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#bf5af2' }}>{cityRisk.hospitalizationSpikeProbability}%</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '0.65rem', color: '#5a6b82', textTransform: 'uppercase', marginBottom: '0.3rem' }}>Elderly Population</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#0099ff' }}>{cityRisk.elderlyPct}%</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '0.65rem', color: '#5a6b82', textTransform: 'uppercase', marginBottom: '0.3rem' }}>Outdoor Workers</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#ffd700' }}>{cityRisk.outdoorWorkerPct}%</div>
          </div>
        </div>
      </motion.div>

      {/* ── Ward-Level GIS Heat Zone Map ── */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.18 }}
        style={{ ...cardStyle, padding: '1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <h3 style={{ color: '#f0f4ff', fontWeight: 700, fontSize: '0.95rem' }}>🗺️ Ward-Level Risk Zones — {mortality.city}</h3>
          <div style={{ display: 'flex', gap: '0.75rem', fontSize: '0.75rem' }}>
            {['Low', 'Moderate', 'High', 'Critical'].map(t => (
              <span key={t} style={{ color: tierColor(t), display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: tierColor(t), display: 'inline-block' }} />{t}
              </span>
            ))}
          </div>
        </div>
        <WardRiskMap city={city} centerLat={center[0]} centerLng={center[1]} wards={mortality.wardLevel} />
      </motion.div>

      {/* ── Ward-level breakdown table (now with HSRI/VI/EI columns) ── */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
        style={{ ...cardStyle, padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '1rem 1.25rem 0.5rem' }}>
          <h3 style={{ color: '#f0f4ff', fontWeight: 700, fontSize: '0.95rem' }}>📍 Ward-Level Risk Breakdown (worst first)</h3>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(30,45,74,0.8)' }}>
                {['Ward', 'Elderly %', 'Outdoor Wkrs %', 'VI', 'EI', 'HSRI', 'Mortality Risk', 'Tier'].map(h => (
                  <th key={h} style={{ padding: '0.65rem 0.9rem', textAlign: 'left', color: '#5a6b82', fontWeight: 600, fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {mortality.wardLevel.map((w: any, i: number) => (
                <motion.tr key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.03 }}
                  style={{ borderBottom: '1px solid rgba(10,15,30,0.5)' }}>
                  <td style={{ padding: '0.6rem 0.9rem', color: '#d0e0f0' }}>{w.ward}</td>
                  <td style={{ padding: '0.6rem 0.9rem', color: '#0099ff' }}>{w.elderlyPct}%</td>
                  <td style={{ padding: '0.6rem 0.9rem', color: '#ffd700' }}>{w.outdoorWorkerPct}%</td>
                  <td style={{ padding: '0.6rem 0.9rem', color: '#8892b0' }}>{w.vulnerabilityIndex}</td>
                  <td style={{ padding: '0.6rem 0.9rem', color: '#8892b0' }}>{w.exposureIndex}</td>
                  <td style={{ padding: '0.6rem 0.9rem', fontWeight: 700, color: tierColor(w.hsriTier) }}>{w.hsri}</td>
                  <td style={{ padding: '0.6rem 0.9rem', fontWeight: 700, color: tierColor(w.riskTier) }}>{w.mortalityRiskIndex}/100</td>
                  <td style={{ padding: '0.6rem 0.9rem' }}>
                    <span style={{ padding: '0.18rem 0.6rem', borderRadius: '2rem', fontSize: '0.65rem', fontWeight: 700, background: `${tierColor(w.riskTier)}18`, color: tierColor(w.riskTier), border: `1px solid ${tierColor(w.riskTier)}35` }}>
                      {w.riskTier.toUpperCase()}
                    </span>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}
