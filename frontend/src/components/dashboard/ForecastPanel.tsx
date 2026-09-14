'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { api } from '@/lib/api';

interface ForecastPanelProps {
  city: string;
}

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

const dayLabel = (dateStr: string) => {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
};

export default function ForecastPanel({ city }: ForecastPanelProps) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedDayIdx, setSelectedDayIdx] = useState(0);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const d = await api.getForecast(city.toLowerCase(), 5);
        if (!cancelled) setData(d);
      } catch (e) {
        if (!cancelled) setError('Could not load forecast. Try again.');
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
        📅 Fetching 5-day forecast...
      </div>
    );
  }

  if (error || !data) {
    return (
      <div style={{ ...cardStyle, textAlign: 'center', color: '#ff6b35' }}>
        {error || 'No forecast available.'}
      </div>
    );
  }

  const maxMortality = Math.max(...data.forecast.map((d: any) => d.mortalityRiskIndex), 10);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

      {/* ── Worst-day headline ── */}
      {data.worstDay && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          style={{
            ...cardStyle,
            display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem',
            borderColor: `${tierColor(data.worstDay.riskTier)}40`,
          }}>
          <div>
            <div style={{ fontSize: '0.65rem', color: '#5a6b82', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.3rem' }}>
              ⚠️ Highest-Risk Day Ahead
            </div>
            <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#f0f4ff' }}>
              {dayLabel(data.worstDay.date)}
            </div>
          </div>
          <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '0.65rem', color: '#5a6b82', textTransform: 'uppercase' }}>WBGT</div>
              <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#ff6b35' }}>{data.worstDay.wbgt}°C</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '0.65rem', color: '#5a6b82', textTransform: 'uppercase' }}>Mortality Risk</div>
              <div style={{ fontSize: '1.3rem', fontWeight: 800, color: tierColor(data.worstDay.riskTier) }}>
                {data.worstDay.mortalityRiskIndex}/100
              </div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '0.65rem', color: '#5a6b82', textTransform: 'uppercase' }}>Tier</div>
              <span style={{ padding: '0.2rem 0.65rem', borderRadius: '2rem', fontSize: '0.75rem', fontWeight: 700, background: `${tierColor(data.worstDay.riskTier)}18`, color: tierColor(data.worstDay.riskTier), border: `1px solid ${tierColor(data.worstDay.riskTier)}35` }}>
                {data.worstDay.riskTier.toUpperCase()}
              </span>
            </div>
          </div>
        </motion.div>
      )}

      {/* ── Day-by-day cards (click to see ward-level forecast for that day) ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.9rem' }}>
        {data.forecast.map((day: any, i: number) => {
          const color = tierColor(day.riskTier);
          const barHeight = Math.max(8, (day.mortalityRiskIndex / maxMortality) * 60);
          const isSelected = i === selectedDayIdx;
          return (
            <motion.div key={i} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07 }}
              onClick={() => setSelectedDayIdx(i)}
              style={{
                ...cardStyle, textAlign: 'center', position: 'relative', overflow: 'hidden', cursor: 'pointer',
                border: isSelected ? `1.5px solid ${color}` : '1px solid rgba(30,45,74,0.8)',
                boxShadow: isSelected ? `0 0 16px ${color}30` : 'none',
              }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: `linear-gradient(90deg, transparent, ${color}60, transparent)` }} />
              <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#d0e0f0', marginBottom: '0.6rem' }}>{dayLabel(day.date)}</div>

              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-end', height: '70px', marginBottom: '0.5rem' }}>
                <div style={{
                  width: '28px', height: `${barHeight}px`,
                  background: `linear-gradient(180deg, ${color}, ${color}80)`,
                  borderRadius: '6px 6px 2px 2px',
                  boxShadow: `0 0 14px ${color}50`,
                }} />
              </div>

              <div style={{ fontSize: '1.3rem', fontWeight: 800, color }}>{day.mortalityRiskIndex}<span style={{ fontSize: '0.75rem' }}>/100</span></div>
              <div style={{ fontSize: '0.7rem', color, fontWeight: 700, marginBottom: '0.5rem' }}>{day.riskTier}</div>

              <div style={{ fontSize: '0.72rem', color: '#8892b0', display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                <span>🌡️ Peak {day.peakTemp}°C</span>
                <span>💧 {day.peakHumidity}%</span>
                <span>WBGT {day.wbgt}°C ({day.stressCategory})</span>
                <span>🚑 Spike {day.hospitalizationSpikeProbability}%</span>
              </div>
              {isSelected && (
                <div style={{ marginTop: '0.5rem', fontSize: '0.62rem', color, fontWeight: 700 }}>▼ VIEWING WARDS</div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* ── Ward-level forecast for selected day (fills "dynamic, forecast-based ward risk" gap) ── */}
      {data.forecast[selectedDayIdx]?.wardForecast?.length > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          style={{ ...cardStyle, padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '1rem 1.25rem 0.5rem' }}>
            <h3 style={{ color: '#f0f4ff', fontWeight: 700, fontSize: '0.9rem' }}>
              📍 Ward-Level HSRI Forecast — {dayLabel(data.forecast[selectedDayIdx].date)}
            </h3>
            <p style={{ fontSize: '0.68rem', color: '#5a6b82', marginTop: '0.2rem' }}>
              Ward risk recomputed against this day's forecasted WBGT/UTCI — not a static one-time snapshot.
            </p>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(30,45,74,0.8)' }}>
                  {['Ward', 'HSRI', 'Tier'].map(h => (
                    <th key={h} style={{ padding: '0.6rem 1rem', textAlign: 'left', color: '#5a6b82', fontWeight: 600, fontSize: '0.65rem', textTransform: 'uppercase' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.forecast[selectedDayIdx].wardForecast.map((w: any, i: number) => (
                  <tr key={i} style={{ borderBottom: '1px solid rgba(10,15,30,0.5)' }}>
                    <td style={{ padding: '0.55rem 1rem', color: '#d0e0f0' }}>{w.ward}</td>
                    <td style={{ padding: '0.55rem 1rem', fontWeight: 700, color: tierColor(w.hsriTier) }}>{w.hsri}</td>
                    <td style={{ padding: '0.55rem 1rem' }}>
                      <span style={{ padding: '0.15rem 0.55rem', borderRadius: '2rem', fontSize: '0.65rem', fontWeight: 700, background: `${tierColor(w.hsriTier)}18`, color: tierColor(w.hsriTier), border: `1px solid ${tierColor(w.hsriTier)}35` }}>
                        {w.hsriTier.toUpperCase()}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      <div style={{ fontSize: '0.7rem', color: '#5a6b82', textAlign: 'center' }}>
        📡 Source: {data.source}
      </div>
    </div>
  );
}
