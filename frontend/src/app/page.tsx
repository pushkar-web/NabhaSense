'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import dynamic from 'next/dynamic';
import CityComparison from '@/components/dashboard/CityComparison';
import ThermalMortalityPanel from '@/components/dashboard/ThermalMortalityPanel';
import ForecastPanel from '@/components/dashboard/ForecastPanel';
import HeatActionPlanPanel from '@/components/dashboard/HeatActionPlanPanel';

const HeatMap = dynamic(() => import('@/components/map/HeatMap'), { ssr: false });

const cities = ['Mumbai', 'Thane', 'Delhi', 'Bangalore', 'Chennai', 'Hyderabad', 'Pune'];

const getRiskColor = (risk: string) => ({
  low: '#00d4aa', medium: '#ffd700', high: '#ff6b35', extreme: '#ff3d3d',
  Low: '#00d4aa', Medium: '#ffd700', High: '#ff6b35', Extreme: '#ff3d3d',
}[risk] || '#fff');

export default function Home() {
  const [selectedCity, setSelectedCity] = useState('Mumbai');
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<any>(null);
  const [hotspots, setHotspots] = useState<any[]>([]);
  const [interventions, setInterventions] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'hotspots' | 'thermal' | 'forecast' | 'interventions' | 'actionplan' | 'compare'>('hotspots');

  const analyzeCity = async (city: string) => {
    setLoading(true);
    setSelectedCity(city);
    setAnalysis(null);
    try {
      const [a, h, i] = await Promise.all([
        fetch(`https://nabhasense-backend.onrender.com/heat/analysis/${city.toLowerCase()}`).then(r => r.json()),
        fetch(`https://nabhasense-backend.onrender.com/heat/hotspots/${city.toLowerCase()}`).then(r => r.json()),
        fetch(`https://nabhasense-backend.onrender.com/heat/interventions/${city.toLowerCase()}`).then(r => r.json()),
      ]);
      setAnalysis(a);
      setHotspots(h.hotspots || []);
      setInterventions(i.interventions || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const interventionIcons: any = {
    urban_greening: '🌳', cool_roof: '🏠', water_body: '💧', ventilation: '💨',
  };

  return (
    <>
      {/* ── GLOBAL ANIMATIONS ── */}
      <style>{`
        @keyframes earthSpin {
          from { transform: translate(-50%, 0) rotate(0deg); }
          to   { transform: translate(-50%, 0) rotate(360deg); }
        }
        @keyframes orbit1 {
          from { transform: translate(-50%, -50%) rotate(0deg); }
          to   { transform: translate(-50%, -50%) rotate(360deg); }
        }
        @keyframes orbit2 {
          from { transform: translate(-50%, -50%) rotate(0deg); }
          to   { transform: translate(-50%, -50%) rotate(-360deg); }
        }
        @keyframes orbit3 {
          from { transform: translate(-50%, -50%) rotate(0deg); }
          to   { transform: translate(-50%, -50%) rotate(360deg); }
        }
        @keyframes twinkle {
          0%, 100% { opacity: 0.15; transform: scale(1); }
          50%       { opacity: 0.6;  transform: scale(1.4); }
        }
        @keyframes scanline {
          0%   { top: -4px; opacity: 0; }
          10%  { opacity: 1; }
          90%  { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
        @keyframes pulse-ring {
          0%   { transform: scale(0.8); opacity: 0.8; }
          100% { transform: scale(2.5); opacity: 0; }
        }
        @keyframes dataStream {
          0%   { opacity: 0; transform: translateY(-10px); }
          20%  { opacity: 1; }
          80%  { opacity: 1; }
          100% { opacity: 0; transform: translateY(10px); }
        }
        @keyframes satelliteFloat {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          25%       { transform: translateY(-4px) rotate(1deg); }
          75%       { transform: translateY(4px) rotate(-1deg); }
        }
      `}</style>

      <main style={{
        minHeight: '100vh',
        background: '#00010a',
        padding: '2rem',
        fontFamily: 'Inter, system-ui, sans-serif',
        position: 'relative',
        overflow: 'hidden',
      }}>

        {/* ══════════════════════════════════════
            SPACE BACKGROUND LAYER
        ══════════════════════════════════════ */}
        <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none', overflow: 'hidden' }}>

          {/* ── Stars field ── */}
          {[
            { top:'4%',  left:'8%',  s:1.5, d:2.1 }, { top:'8%',  left:'23%', s:1,   d:3.4 },
            { top:'12%', left:'67%', s:2,   d:1.8 }, { top:'6%',  left:'82%', s:1,   d:2.7 },
            { top:'18%', left:'44%', s:1.5, d:3.1 }, { top:'22%', left:'91%', s:1,   d:2.3 },
            { top:'28%', left:'15%', s:2,   d:4.0 }, { top:'33%', left:'58%', s:1,   d:2.6 },
            { top:'39%', left:'3%',  s:1.5, d:1.9 }, { top:'45%', left:'77%', s:2,   d:3.3 },
            { top:'52%', left:'31%', s:1,   d:2.8 }, { top:'58%', left:'88%', s:1.5, d:1.7 },
            { top:'63%', left:'49%', s:1,   d:3.6 }, { top:'71%', left:'12%', s:2,   d:2.2 },
            { top:'76%', left:'70%', s:1.5, d:4.1 }, { top:'82%', left:'36%', s:1,   d:2.5 },
            { top:'87%', left:'93%', s:2,   d:3.0 }, { top:'92%', left:'55%', s:1,   d:1.6 },
            { top:'3%',  left:'52%', s:1,   d:2.9 }, { top:'47%', left:'62%', s:1.5, d:3.8 },
            { top:'68%', left:'25%', s:1,   d:2.4 }, { top:'15%', left:'37%', s:2,   d:1.5 },
            { top:'55%', left:'7%',  s:1,   d:3.2 }, { top:'31%', left:'74%', s:1.5, d:2.0 },
          ].map((star, i) => (
            <div key={i} style={{
              position: 'absolute',
              top: star.top, left: star.left,
              width: `${star.s}px`, height: `${star.s}px`,
              borderRadius: '50%', background: '#fff',
              animation: `twinkle ${star.d}s ease-in-out infinite`,
              animationDelay: `${i * 0.18}s`,
            }} />
          ))}

          {/* ── Earth image — bottom right, large ── */}
          <div style={{
            position: 'absolute',
            bottom: '-180px',
            right: '-140px',
            width: '680px',
            height: '680px',
            borderRadius: '50%',
            overflow: 'hidden',
            opacity: 0.55,
            boxShadow: '0 0 80px 30px rgba(0,80,180,0.2), inset 0 0 40px rgba(0,50,150,0.3)',
          }}>
            {/* actual earth photo */}
            <img
              src="/earth-night.png"
              alt=""
              style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
            />
            {/* atmosphere rim */}
            <div style={{
              position: 'absolute', inset: 0, borderRadius: '50%',
              boxShadow: 'inset 0 0 50px rgba(0,120,255,0.35), 0 0 60px rgba(0,100,255,0.2)',
            }} />
          </div>

          {/* ── Orbit ring 1 — large tilted ── */}
          <div style={{
            position: 'absolute',
            top: '55%', left: '72%',
            width: '520px', height: '200px',
            border: '1px solid rgba(0,212,170,0.12)',
            borderRadius: '50%',
            transform: 'translate(-50%, -50%) rotate(-20deg)',
            animation: 'orbit1 40s linear infinite',
          }}>
            {/* Satellite A on ring 1 */}
            <div style={{
              position: 'absolute', top: '-6px', left: '50%',
              transform: 'translateX(-50%)',
              animation: 'satelliteFloat 3s ease-in-out infinite',
            }}>
              {/* satellite body */}
              <div style={{ position: 'relative', width: '14px', height: '6px' }}>
                <div style={{ position: 'absolute', top: '1px', left: '3px', width: '8px', height: '4px', background: '#c0c0c0', borderRadius: '1px', boxShadow: '0 0 4px rgba(192,192,192,0.5)' }} />
                {/* solar panels */}
                <div style={{ position: 'absolute', top: '2px', left: '-4px', width: '6px', height: '2px', background: '#00d4aa', opacity: 0.9, boxShadow: '0 0 6px #00d4aa' }} />
                <div style={{ position: 'absolute', top: '2px', right: '-4px', width: '6px', height: '2px', background: '#00d4aa', opacity: 0.9, boxShadow: '0 0 6px #00d4aa' }} />
              </div>
              {/* signal pulse */}
              <div style={{ position: 'absolute', top: '50%', left: '50%', width: '20px', height: '20px', marginLeft: '-10px', marginTop: '-10px', borderRadius: '50%', border: '1px solid rgba(0,212,170,0.5)', animation: 'pulse-ring 2s ease-out infinite' }} />
            </div>
          </div>

          {/* ── Orbit ring 2 — smaller, reverse ── */}
          <div style={{
            position: 'absolute',
            top: '40%', left: '78%',
            width: '320px', height: '140px',
            border: '1px solid rgba(0,153,255,0.1)',
            borderRadius: '50%',
            transform: 'translate(-50%, -50%) rotate(15deg)',
            animation: 'orbit2 28s linear infinite',
          }}>
            {/* Satellite B */}
            <div style={{
              position: 'absolute', top: '-5px', left: '50%',
              transform: 'translateX(-50%)',
            }}>
              <div style={{ position: 'relative', width: '12px', height: '5px' }}>
                <div style={{ position: 'absolute', top: '1px', left: '2px', width: '7px', height: '3px', background: '#a0a8b0', borderRadius: '1px' }} />
                <div style={{ position: 'absolute', top: '1.5px', left: '-3px', width: '4px', height: '1.5px', background: '#0099ff', opacity: 0.9, boxShadow: '0 0 5px #0099ff' }} />
                <div style={{ position: 'absolute', top: '1.5px', right: '-3px', width: '4px', height: '1.5px', background: '#0099ff', opacity: 0.9, boxShadow: '0 0 5px #0099ff' }} />
              </div>
            </div>
          </div>

          {/* ── Orbit ring 3 — vertical tilt ── */}
          <div style={{
            position: 'absolute',
            top: '48%', left: '75%',
            width: '420px', height: '420px',
            border: '1px solid rgba(255,107,53,0.07)',
            borderRadius: '50%',
            transform: 'translate(-50%, -50%) rotate(70deg)',
            animation: 'orbit3 65s linear infinite',
          }}>
            {/* Satellite C — ISRO style */}
            <div style={{
              position: 'absolute', top: '-7px', left: '50%',
              transform: 'translateX(-50%)',
            }}>
              <div style={{ position: 'relative', width: '16px', height: '8px' }}>
                <div style={{ position: 'absolute', top: '2px', left: '4px', width: '8px', height: '4px', background: '#d0d4da', borderRadius: '2px', boxShadow: '0 0 6px rgba(208,212,218,0.4)' }} />
                {/* dish */}
                <div style={{ position: 'absolute', top: '-2px', left: '5px', width: '6px', height: '4px', borderRadius: '50% 50% 0 0', border: '1.5px solid #ff6b35', borderBottom: 'none', opacity: 0.8 }} />
                <div style={{ position: 'absolute', top: '2.5px', left: '-4px', width: '5px', height: '2px', background: '#ff6b35', opacity: 0.8, boxShadow: '0 0 4px #ff6b35' }} />
                <div style={{ position: 'absolute', top: '2.5px', right: '-4px', width: '5px', height: '2px', background: '#ff6b35', opacity: 0.8, boxShadow: '0 0 4px #ff6b35' }} />
              </div>
            </div>
          </div>

          {/* ── Scanline effect on earth ── */}
          <div style={{
            position: 'absolute',
            bottom: '-180px', right: '-140px',
            width: '680px', height: '680px',
            borderRadius: '50%',
            overflow: 'hidden',
            pointerEvents: 'none',
          }}>
            <div style={{
              position: 'absolute', left: 0, right: 0, height: '3px',
              background: 'linear-gradient(90deg, transparent, rgba(0,212,170,0.15), transparent)',
              animation: 'scanline 6s ease-in-out infinite',
              animationDelay: '1s',
            }} />
          </div>

          {/* ── Ambient top-left glow ── */}
          <div style={{
            position: 'absolute', top: '-100px', left: '-100px',
            width: '400px', height: '400px', borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(0,212,170,0.04) 0%, transparent 70%)',
          }} />

          {/* ── Data stream lines (left side) ── */}
          {[15, 30, 48, 62, 78].map((top, i) => (
            <div key={i} style={{
              position: 'absolute',
              top: `${top}%`, left: '2px',
              fontSize: '8px', color: 'rgba(0,212,170,0.18)',
              fontFamily: 'monospace',
              animation: `dataStream ${3 + i * 0.5}s ease-in-out infinite`,
              animationDelay: `${i * 0.8}s`,
              letterSpacing: '0.05em',
            }}>
              {['LST:41.2', 'NDVI:0.32', 'SAT:OK', 'LAT:19.2N', 'SYNC'][i]}
            </div>
          ))}
        </div>

        {/* ══════════════════════════════════════
            MAIN CONTENT (above background)
        ══════════════════════════════════════ */}
        <div style={{ position: 'relative', zIndex: 1 }}>

          {/* ── HEADER ── */}
          <motion.div
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            style={{ textAlign: 'center', marginBottom: '2.5rem' }}
          >
            
            <h1 style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)', fontWeight: 900, lineHeight: 1.1, marginBottom: '1rem' }}>
              <span style={{ color: '#f0f4ff' }}>Urban Heat </span>
              <span style={{
                background: 'linear-gradient(135deg, #00d4aa, #0099ff)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}>Intelligence</span>
              <br />
              <span style={{ color: '#f0f4ff' }}>Platform</span>
            </h1>
            <p style={{ color: '#6b7a90', fontSize: '1rem', maxWidth: '540px', margin: '0 auto 1.5rem', lineHeight: 1.6 }}>
              Physics-informed AI/ML system for urban heat stress detection, human thermal stress &amp; mortality-risk early warning
            </p>

            {/* City selector */}
            <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', justifyContent: 'center', marginBottom: '1.5rem' }}>
              {cities.map(city => (
                <motion.button key={city} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                  onClick={() => analyzeCity(city)}
                  style={{
                    padding: '0.5rem 1.2rem', borderRadius: '2rem',
                    border: selectedCity === city ? '1.5px solid #00d4aa' : '1.5px solid rgba(30,45,74,0.8)',
                    background: selectedCity === city ? 'rgba(0,212,170,0.12)' : 'rgba(255,255,255,0.03)',
                    backdropFilter: 'blur(8px)',
                    color: selectedCity === city ? '#00d4aa' : '#6b7a90',
                    cursor: 'pointer', fontSize: '0.85rem', fontWeight: 500,
                    boxShadow: selectedCity === city ? '0 0 12px rgba(0,212,170,0.2)' : 'none',
                  }}>{city}</motion.button>
              ))}
            </div>

            {/* Analyze button */}
            <motion.button
              whileHover={{ scale: 1.04, boxShadow: '0 0 30px rgba(0,212,170,0.4)' }}
              whileTap={{ scale: 0.97 }}
              onClick={() => analyzeCity(selectedCity)}
              style={{
                padding: '0.9rem 2.8rem', borderRadius: '2rem', border: 'none',
                background: loading ? 'rgba(30,45,74,0.8)' : 'linear-gradient(135deg, #00d4aa, #0099ff)',
                color: loading ? '#5a6b82' : '#fff',
                fontSize: '1rem', fontWeight: 700,
                cursor: loading ? 'not-allowed' : 'pointer',
                backdropFilter: 'blur(8px)',
                boxShadow: loading ? 'none' : '0 0 20px rgba(0,212,170,0.3)',
              }}>
              {loading ? '🛰️ Fetching real satellite data...' : '🛰️ Analyze Heat Data'}
            </motion.button>
          </motion.div>

          {/* ── ANALYSIS CONTENT ── */}
          <AnimatePresence>
            {analysis && !loading && (
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                style={{ maxWidth: '1300px', margin: '0 auto' }}
              >
                {/* Badges */}
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                  {[
                    { bg: 'rgba(0,212,170,0.12)', border: '#00d4aa40', color: '#00d4aa', text: `✅ Live Data — ${analysis.dataSource}` },
                    { bg: 'rgba(0,153,255,0.12)', border: '#0099ff40', color: '#0099ff', text: `🤖 ML Risk: ${analysis.mlRiskLevel} (${analysis.mlConfidence}% confidence)` },
                    { bg: 'rgba(255,107,53,0.12)', border: '#ff6b3540', color: '#ff6b35', text: `📅 ${analysis.lstPeriod}` },
                  ].map((b, i) => (
                    <span key={i} style={{ background: b.bg, border: `1px solid ${b.border}`, borderRadius: '2rem', padding: '0.4rem 1rem', fontSize: '0.8rem', color: b.color, fontWeight: 600, backdropFilter: 'blur(8px)' }}>
                      {b.text}
                    </span>
                  ))}
                </motion.div>

                {/* Stats Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '0.9rem', marginBottom: '1.5rem' }}>
                  {[
                    { label: 'Current Temp',  value: `${analysis.currentTemp}°C`,     color: '#ff6b35', icon: '🌡️' },
                    { label: 'Feels Like',    value: `${analysis.apparentTemp}°C`,     color: '#ff3d3d', icon: '🔥' },
                    { label: 'Avg LST (30d)', value: `${analysis.avgLST}°C`,           color: '#ffd700', icon: '🛰️' },
                    { label: 'SUHII',         value: `${analysis.suhii}°C`,            color: '#bf5af2', icon: '🏙️' },
                    { label: 'NDVI',          value: analysis.ndvi,                    color: '#00d4aa', icon: '🌿' },
                    { label: 'NDBI',          value: analysis.ndbi,                    color: '#ff6b35', icon: '🏗️' },
                    { label: 'Humidity',      value: `${analysis.humidity}%`,          color: '#0099ff', icon: '💧' },
                    { label: 'Heat Stress',   value: `+${analysis.heatStressIndex}°C`, color: '#ff3d3d', icon: '⚠️' },
                  ].map((stat, i) => (
                    <motion.div key={i}
                      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.06 }}
                      style={{
                        background: 'rgba(13,22,40,0.75)',
                        backdropFilter: 'blur(16px)',
                        border: '1px solid rgba(30,45,74,0.8)',
                        borderRadius: '14px', padding: '1rem', textAlign: 'center',
                        position: 'relative', overflow: 'hidden',
                      }}>
                      {/* Top accent line */}
                      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: `linear-gradient(90deg, transparent, ${stat.color}60, transparent)` }} />
                      <div style={{ fontSize: '1.3rem', marginBottom: '0.3rem' }}>{stat.icon}</div>
                      <div style={{ fontSize: '0.62rem', color: '#5a6b82', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.3rem' }}>{stat.label}</div>
                      <div style={{ fontSize: '1.4rem', fontWeight: 800, color: stat.color }}>{stat.value}</div>
                    </motion.div>
                  ))}
                </div>

                {/* AI Recommendations */}
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
                  style={{ background: 'rgba(13,22,40,0.75)', backdropFilter: 'blur(16px)', border: '1px solid rgba(30,45,74,0.8)', borderRadius: '16px', padding: '1.25rem', marginBottom: '1.5rem' }}>
                  <h3 style={{ color: '#f0f4ff', fontWeight: 700, fontSize: '0.95rem', marginBottom: '0.75rem' }}>
                    🤖 AI Recommendations — {analysis.city}
                  </h3>
                  <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                    {analysis.recommendations?.map((rec: string, i: number) => (
                      <span key={i} style={{ background: 'rgba(0,212,170,0.08)', border: '1px solid rgba(0,212,170,0.2)', borderRadius: '8px', padding: '0.5rem 1rem', fontSize: '0.82rem', color: '#00d4aa' }}>
                        ✓ {rec}
                      </span>
                    ))}
                  </div>
                </motion.div>

                {/* Map */}
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
                  style={{ background: 'rgba(13,22,40,0.75)', backdropFilter: 'blur(16px)', border: '1px solid rgba(30,45,74,0.8)', borderRadius: '16px', padding: '1.25rem', marginBottom: '1.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <h3 style={{ color: '#f0f4ff', fontWeight: 700, fontSize: '0.95rem' }}>🗺️ Heat Stress Map — {analysis.city}</h3>
                    <div style={{ display: 'flex', gap: '0.75rem', fontSize: '0.75rem' }}>
                      {['low', 'medium', 'high', 'extreme'].map(r => (
                        <span key={r} style={{ color: getRiskColor(r), display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <span style={{ width: 8, height: 8, borderRadius: '50%', background: getRiskColor(r), display: 'inline-block' }} />{r}
                        </span>
                      ))}
                    </div>
                  </div>
                  <HeatMap city={selectedCity} hotspots={hotspots} />
                </motion.div>

                {/* Tabs */}
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                  {[
                    { key: 'hotspots',      label: '🔥 Heat Hotspots' },
                    { key: 'thermal',       label: '🧬 WBGT & Mortality Risk' },
                    { key: 'forecast',      label: '📅 5-Day Forecast' },
                    { key: 'interventions', label: '❄️ Cooling Interventions' },
                    { key: 'actionplan',    label: '🚨 Heat Action Plan' },
                    { key: 'compare',       label: '🏙️ City Comparison' },
                  ].map(tab => (
                    <button key={tab.key} onClick={() => setActiveTab(tab.key as any)}
                      style={{
                        padding: '0.6rem 1.4rem', borderRadius: '2rem', border: 'none', cursor: 'pointer',
                        background: activeTab === tab.key
                          ? 'linear-gradient(135deg, #00d4aa, #0099ff)'
                          : 'rgba(255,255,255,0.05)',
                        backdropFilter: 'blur(8px)',
                        color: activeTab === tab.key ? '#fff' : '#6b7a90',
                        fontWeight: 600, fontSize: '0.85rem',
                        boxShadow: activeTab === tab.key ? '0 0 16px rgba(0,212,170,0.3)' : 'none',
                      }}>{tab.label}</button>
                  ))}
                </div>

                {/* ── Hotspots Table ── */}
                {activeTab === 'hotspots' && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    style={{ background: 'rgba(13,22,40,0.75)', backdropFilter: 'blur(16px)', border: '1px solid rgba(30,45,74,0.8)', borderRadius: '16px', overflow: 'hidden' }}>
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                        <thead>
                          <tr style={{ borderBottom: '1px solid rgba(30,45,74,0.8)' }}>
                            {['District', 'LST (°C)', 'NDVI', 'NDBI', 'Humidity', 'Risk Level'].map(h => (
                              <th key={h} style={{ padding: '0.9rem 1rem', textAlign: 'left', color: '#5a6b82', fontWeight: 600, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {hotspots.map((h: any, i: number) => (
                            <motion.tr key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: i * 0.03 }}
                              style={{ borderBottom: '1px solid rgba(10,15,30,0.5)' }}
                              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(0,212,170,0.04)')}
                              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                              <td style={{ padding: '0.8rem 1rem', color: '#d0e0f0' }}>{h.district}</td>
                              <td style={{ padding: '0.8rem 1rem', color: '#ff6b35', fontWeight: 700 }}>{h.lst}</td>
                              <td style={{ padding: '0.8rem 1rem', color: '#00d4aa' }}>{h.ndvi}</td>
                              <td style={{ padding: '0.8rem 1rem', color: '#ffd700' }}>{h.ndbi}</td>
                              <td style={{ padding: '0.8rem 1rem', color: '#0099ff' }}>{h.humidity}%</td>
                              <td style={{ padding: '0.8rem 1rem' }}>
                                <span style={{ padding: '0.25rem 0.75rem', borderRadius: '2rem', fontSize: '0.75rem', fontWeight: 700, background: `${getRiskColor(h.heatRisk)}18`, color: getRiskColor(h.heatRisk), border: `1px solid ${getRiskColor(h.heatRisk)}35` }}>
                                  {h.heatRisk?.toUpperCase()}
                                </span>
                              </td>
                            </motion.tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </motion.div>
                )}

                {/* ── WBGT & Mortality Risk (PS26083) ── */}
                {activeTab === 'thermal' && (
                  <ThermalMortalityPanel city={selectedCity} />
                )}

                {/* ── 5-Day Forecast (PS26083) ── */}
                {activeTab === 'forecast' && (
                  <ForecastPanel city={selectedCity} />
                )}

                {/* ── Interventions ── */}
                {activeTab === 'interventions' && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
                    {interventions.map((inv: any, i: number) => (
                      <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.06 }}
                        style={{ background: 'rgba(13,22,40,0.75)', backdropFilter: 'blur(16px)', border: '1px solid rgba(30,45,74,0.8)', borderRadius: '14px', padding: '1.2rem', position: 'relative', overflow: 'hidden' }}>
                        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: `linear-gradient(90deg, ${getRiskColor(inv.priority)}60, transparent)` }} />
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                          <div style={{ fontSize: '1.5rem' }}>{interventionIcons[inv.type]}</div>
                          <span style={{ padding: '0.2rem 0.6rem', borderRadius: '2rem', fontSize: '0.7rem', fontWeight: 700, background: getRiskColor(inv.priority) + '20', color: getRiskColor(inv.priority), border: `1px solid ${getRiskColor(inv.priority)}40` }}>
                            {inv.priority?.toUpperCase()}
                          </span>
                        </div>
                        <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#d0e0f0', marginBottom: '0.4rem', textTransform: 'capitalize' }}>{inv.type?.replace(/_/g, ' ')}</div>
                        <div style={{ fontSize: '0.78rem', color: '#5a6b82', marginBottom: '0.75rem' }}>📍 {inv.area}</div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                          <span style={{ color: '#00d4aa' }}>❄️ -{inv.tempReduction}°C</span>
                          <span style={{ color: '#ffd700' }}>Impact: {(inv.impactScore * 100).toFixed(0)}%</span>
                        </div>
                        <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: '#5a6b82' }}>💰 Est. ₹{(inv.estimatedCost / 100000).toFixed(1)}L</div>
                      </motion.div>
                    ))}
                  </motion.div>
                )}

                {/* ── Heat Action Plan (replaces Predictor + Simulator) ── */}
                {activeTab === 'actionplan' && (
                  <HeatActionPlanPanel
                    city={selectedCity}
                    baseTemp={analysis.currentTemp}
                    humidity={analysis.humidity}
                    windSpeed={analysis.windSpeed}
                    elderlyPct={analysis.demographics?.elderlyPct ?? 8.0}
                    outdoorWorkerPct={analysis.demographics?.outdoorWorkerPct ?? 22.0}
                    population={analysis.demographics?.population ?? analysis.affectedPopulation ?? 1000000}
                  />
                )}
                {activeTab === 'compare' && <CityComparison />}

              </motion.div>
            )}
          </AnimatePresence>

          {/* Footer */}
          <div style={{ textAlign: 'center', padding: '2rem 0 0.5rem', fontSize: '0.75rem', color: 'rgba(30,45,74,0.9)' }}>
            Urban Heat Intelligence Platform | Powered by AI/ML 
          </div>
        </div>
      </main>
    </>
  );
}
