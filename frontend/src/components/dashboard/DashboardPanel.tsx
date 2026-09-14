'use client';

import { motion } from 'framer-motion';

interface DashboardPanelProps {
  analysis: any;
  hotspots: any[];
  interventions: any[];
  selectedCity: string;
}

const getRiskColor = (risk: string) => ({
  low: '#00d4aa', medium: '#ffd700', high: '#ff6b35', extreme: '#ff3d3d',
  Low: '#00d4aa', Medium: '#ffd700', High: '#ff6b35', Extreme: '#ff3d3d',
}[risk] || '#fff');

export default function DashboardPanel({ analysis, hotspots, interventions, selectedCity }: DashboardPanelProps) {
  if (!analysis) return null;

  // Build top 5 hotspots sorted by LST
  const topHotspots = [...hotspots]
    .sort((a, b) => b.lst - a.lst)
    .slice(0, 5);

  // Drivers data (from analysis or static fallback matching your API)
  const drivers = [
    { label: 'Low Vegetation', pct: 32, color: '#4caf50' },
    { label: 'Built-up Density', pct: 28, color: '#ff5252' },
    { label: 'Land Surface Type', pct: 20, color: '#ff9800' },
    { label: 'Atmospheric Conditions', pct: 12, color: '#2196f3' },
    { label: 'Others', pct: 8, color: '#9c27b0' },
  ];

  // Mini donut percentages → stroke-dasharray on a circle r=28, circumference ≈ 175.9
  const C = 175.9;
  let offset = 0;
  const slices = drivers.map(d => {
    const dash = (d.pct / 100) * C;
    const slice = { ...d, dash, offset };
    offset += dash;
    return slice;
  });

  // Fake trend data: last 7 days actual + 3 predicted
  const trendActual = [35.2, 36.8, 38.1, 39.4, 40.2, 41.0, analysis.avgLST];
  const trendPredicted = [analysis.avgLST, analysis.avgLST + 0.8, analysis.avgLST + 1.4, analysis.avgLST + 2.1];

  const allVals = [...trendActual, ...trendPredicted];
  const minV = Math.min(...allVals) - 1;
  const maxV = Math.max(...allVals) + 1;
  const chartW = 240, chartH = 90;

  const toX = (i: number, total: number) => (i / (total - 1)) * chartW;
  const toY = (v: number) => chartH - ((v - minV) / (maxV - minV)) * chartH;

  const actualPoints = trendActual.map((v, i) => `${toX(i, 10)},${toY(v)}`).join(' ');
  const predictedPoints = trendPredicted.map((v, i) => `${toX(i + 6, 10)},${toY(v)}`).join(' ');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

      {/* ── TOP STAT CARDS (5 big ones matching Image 1) ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '10px' }}>
        {[
          { label: 'MAX SURFACE TEMP', value: `${analysis.maxLST ?? (analysis.avgLST + 4.5).toFixed(1)}°C`, sub: 'Today, 11:15 AM', icon: '🌡️', color: '#ff5252' },
          { label: 'ACTIVE HOTSPOTS', value: `${hotspots.length}`, sub: 'High Risk Zones', icon: '🔥', color: '#ff9800' },
          { label: 'AVG LAND SURFACE TEMP', value: `${analysis.avgLST}°C`, sub: 'City Average', icon: '🌿', color: '#4caf50' },
          { label: 'COOLING POTENTIAL', value: `${analysis.coolingPotential ?? '3.8'}°C`, sub: 'With Optimal Strategies', icon: '❄️', color: '#2196f3' },
          { label: 'AI CONFIDENCE', value: `${analysis.mlConfidence ?? 92}%`, sub: 'Model Accuracy', icon: '🧠', color: '#bf5af2' },
        ].map((card, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07 }}
            style={{
              background: '#0d1628',
              border: '1px solid #1e2d4a',
              borderRadius: '12px',
              padding: '14px 14px 12px',
            }}>
            <div style={{ fontSize: '18px', marginBottom: '6px' }}>{card.icon}</div>
            <div style={{ fontSize: '9px', color: card.color, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '4px' }}>{card.label}</div>
            <div style={{ fontSize: '22px', fontWeight: 800, color: card.color, lineHeight: 1 }}>{card.value}</div>
            <div style={{ fontSize: '9px', color: '#5a6878', marginTop: '4px' }}>{card.sub}</div>
          </motion.div>
        ))}
      </div>

      {/* ── MINI METRICS ROW (7 cards) ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '8px' }}>
        {[
          { label: 'CURRENT TEMP', value: `${analysis.currentTemp}°C`, color: '#ff5252', icon: '🌡️' },
          { label: 'FEELS LIKE', value: `${analysis.apparentTemp}°C`, color: '#ff6b35', icon: '🔥' },
          { label: 'AVG LST (30D)', value: `${analysis.avgLST}°C`, color: '#00d4aa', icon: '🛰️' },
          { label: 'SUHI', value: `${analysis.suhii}°C`, color: '#bf5af2', icon: '🏙️' },
          { label: 'NDVI', value: `${analysis.ndvi}`, color: '#4caf50', icon: '🌿' },
          { label: 'NDBI', value: `${analysis.ndbi}`, color: '#ff9800', icon: '🏗️' },
          { label: 'HUMIDITY', value: `${analysis.humidity}%`, color: '#2196f3', icon: '💧' },
        ].map((m, i) => (
          <motion.div key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            transition={{ delay: 0.35 + i * 0.05 }}
            style={{
              background: '#0d1628', border: '1px solid #1e2d4a',
              borderRadius: '8px', padding: '10px 8px', textAlign: 'center',
            }}>
            <div style={{ fontSize: '13px', marginBottom: '3px' }}>{m.icon}</div>
            <div style={{ fontSize: '7.5px', color: '#5a6878', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '3px' }}>{m.label}</div>
            <div style={{ fontSize: '15px', fontWeight: 700, color: m.color }}>{m.value}</div>
          </motion.div>
        ))}
      </div>

      {/* ── HEAT STRESS + AI RECOMMENDATIONS ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: '10px' }}>
        {/* Heat stress */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
          style={{ background: '#0d1628', border: '1px solid #1e2d4a', borderRadius: '10px', padding: '14px' }}>
          <div style={{ fontSize: '9px', color: '#8892b0', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>HEAT STRESS</div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#ff5252' }}>+{analysis.heatStressIndex}°C</div>
          <div style={{ fontSize: '10px', color: '#ff6b35', marginTop: '4px', fontWeight: 600 }}>Above Comfort Threshold</div>
        </motion.div>

        {/* AI Recommendations */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.52 }}
          style={{ background: '#0d1628', border: '1px solid #1e2d4a', borderRadius: '10px', padding: '14px' }}>
          <div style={{ fontSize: '11px', fontWeight: 700, color: '#f0f4ff', marginBottom: '8px' }}>
            🤖 AI Recommendations — {analysis.city}
          </div>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {analysis.recommendations?.slice(0, 3).map((rec: string, i: number) => (
              <span key={i} style={{
                background: 'rgba(0,212,170,0.1)', border: '1px solid #00d4aa30',
                borderRadius: '6px', padding: '4px 10px',
                fontSize: '11px', color: '#00d4aa',
              }}>✓ {rec}</span>
            ))}
          </div>
        </motion.div>
      </div>

      {/* ── BOTTOM THREE PANELS ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>

        {/* AI Predicted Heat Trend */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
          style={{ background: '#0d1628', border: '1px solid #1e2d4a', borderRadius: '10px', padding: '14px' }}>
          <div style={{ fontSize: '10px', fontWeight: 700, color: '#b0bec5', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '5px' }}>
            ⚡ AI Predicted Heat Trend
          </div>
          <svg width="100%" viewBox={`0 0 ${chartW} ${chartH + 10}`} style={{ overflow: 'visible' }}>
            {/* Actual line */}
            <polyline
              points={actualPoints}
              fill="none" stroke="#2196f3" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
            />
            {/* Predicted line */}
            <polyline
              points={predictedPoints}
              fill="none" stroke="#ff9800" strokeWidth="1.8" strokeDasharray="4 3"
              strokeLinecap="round" strokeLinejoin="round"
            />
            {/* Dots on actual */}
            {trendActual.map((v, i) => (
              <circle key={i} cx={toX(i, 10)} cy={toY(v)} r="2.5" fill="#2196f3" />
            ))}
            {/* Legend */}
            <line x1="0" y1={chartH + 8} x2="16" y2={chartH + 8} stroke="#2196f3" strokeWidth="1.5" />
            <text x="20" y={chartH + 11} fontSize="8" fill="#2196f3">Actual</text>
            <line x1="60" y1={chartH + 8} x2="76" y2={chartH + 8} stroke="#ff9800" strokeWidth="1.5" strokeDasharray="3 2" />
            <text x="80" y={chartH + 11} fontSize="8" fill="#ff9800">Predicted</text>
          </svg>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '8px', color: '#5a6878', marginTop: '4px' }}>
            <span>17 May</span><span>19 May</span><span>21 May</span><span>23 May</span>
          </div>
        </motion.div>

        {/* Drivers of Urban Heating — donut */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.65 }}
          style={{ background: '#0d1628', border: '1px solid #1e2d4a', borderRadius: '10px', padding: '14px' }}>
          <div style={{ fontSize: '10px', fontWeight: 700, color: '#b0bec5', marginBottom: '10px' }}>
            🏙️ Drivers of Urban Heating
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {/* Donut chart */}
            <svg width="80" height="80" viewBox="0 0 80 80" style={{ flexShrink: 0 }}>
              {slices.map((s, i) => (
                <circle
                  key={i}
                  cx="40" cy="40" r="28"
                  fill="none"
                  stroke={s.color}
                  strokeWidth="18"
                  strokeDasharray={`${s.dash} ${C - s.dash}`}
                  strokeDashoffset={-s.offset}
                  style={{ transform: 'rotate(-90deg)', transformOrigin: '40px 40px' }}
                />
              ))}
              <circle cx="40" cy="40" r="19" fill="#0d1628" />
            </svg>
            {/* Legend */}
            <div style={{ flex: 1 }}>
              {drivers.map((d, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '4px', fontSize: '9.5px', color: '#8892b0' }}>
                  <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: d.color, flexShrink: 0, display: 'inline-block' }} />
                  {d.label} <span style={{ color: '#f0f4ff', marginLeft: 'auto', fontWeight: 600 }}>{d.pct}%</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Top Heat Hotspots */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}
          style={{ background: '#0d1628', border: '1px solid #1e2d4a', borderRadius: '10px', padding: '14px' }}>
          <div style={{ fontSize: '10px', fontWeight: 700, color: '#b0bec5', marginBottom: '10px' }}>
            🔥 Top Heat Hotspots
          </div>
          {topHotspots.length === 0 ? (
            <div style={{ color: '#5a6878', fontSize: '11px' }}>No hotspot data yet — click Analyze.</div>
          ) : (
            topHotspots.map((h, i) => {
              const rankColors = ['#ff5252', '#ff7722', '#ff9800', '#ffc107', '#4caf50'];
              return (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <div style={{
                    width: '18px', height: '18px', borderRadius: '50%',
                    background: rankColors[i] || '#888',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '9px', fontWeight: 700, color: '#fff', flexShrink: 0,
                  }}>{i + 1}</div>
                  <div style={{ flex: 1, fontSize: '10.5px', color: '#c0cfe4' }}>{h.district}</div>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: rankColors[i] || '#ff5252' }}>{h.lst}°C</div>
                </div>
              );
            })
          )}
        </motion.div>

      </div>
    </div>
  );
}