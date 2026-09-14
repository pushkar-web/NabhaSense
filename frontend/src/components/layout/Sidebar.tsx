'use client';

import { useState } from 'react';

interface SidebarProps {
  activeSection: string;
  onNavigate: (section: string) => void;
}

const navItems = [
  { key: 'dashboard', label: 'Dashboard', icon: '⊞' },
  { key: 'heatmap', label: 'Heat Map', icon: '🗺️' },
  { key: 'hotspots', label: 'Hotspots', icon: '🔥' },
  { key: 'drivers', label: 'Drivers Analysis', icon: '📊' },
  { key: 'predictions', label: 'AI Predictions', icon: '🧠' },
  { key: 'cooling', label: 'Cooling Strategies', icon: '❄️' },
  { key: 'simulate', label: 'Scenario Simulator', icon: '🧪' },
  { key: 'impact', label: 'Impact Assessment', icon: '📈' },
  { key: 'datalayers', label: 'Data Layers', icon: '🗂️' },
  { key: 'reports', label: 'Reports', icon: '📋' },
];

const dataSources = [
  'Landsat 8', 'ECOSTRESS', 'Sentinel-2', 'ERA5', 'CPCB'
];

export default function Sidebar({ activeSection, onNavigate }: SidebarProps) {
  return (
    <div style={{
      width: '200px',
      minWidth: '200px',
      background: '#080c14',
      borderRight: '1px solid #1e2d4a',
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      position: 'sticky',
      top: 0,
      overflowY: 'auto',
    }}>
      {/* Logo */}
      <div style={{
        padding: '1rem 0.875rem',
        borderBottom: '1px solid #1e2d4a',
        display: 'flex',
        alignItems: 'center',
        gap: '0.6rem',
      }}>
        <div style={{
          width: '36px', height: '36px',
          background: 'linear-gradient(135deg, #ff6b35, #f7931e)',
          borderRadius: '8px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '18px', flexShrink: 0,
        }}>🛸</div>
        <div>
          <div style={{ fontSize: '13px', fontWeight: 700, color: '#f0f4ff', lineHeight: 1.2 }}>इसरो ISRO</div>
          <div style={{ fontSize: '9px', color: '#00d4aa', letterSpacing: '0.05em' }}>NabhaSense</div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '0.5rem 0' }}>
        {navItems.map(item => (
          <button
            key={item.key}
            onClick={() => onNavigate(item.key)}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: '0.6rem',
              padding: '0.55rem 0.875rem',
              background: activeSection === item.key ? '#1a2535' : 'transparent',
              border: 'none',
              borderRight: activeSection === item.key ? '2px solid #00d4aa' : '2px solid transparent',
              color: activeSection === item.key ? '#00d4aa' : '#6b7a8d',
              fontSize: '11.5px',
              fontWeight: activeSection === item.key ? 600 : 400,
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => {
              if (activeSection !== item.key) {
                (e.currentTarget as HTMLButtonElement).style.background = '#0f1828';
                (e.currentTarget as HTMLButtonElement).style.color = '#b0bec5';
              }
            }}
            onMouseLeave={e => {
              if (activeSection !== item.key) {
                (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
                (e.currentTarget as HTMLButtonElement).style.color = '#6b7a8d';
              }
            }}
          >
            <span style={{ fontSize: '14px', width: '18px', textAlign: 'center' }}>{item.icon}</span>
            {item.label}
          </button>
        ))}
      </nav>

      {/* Data Sources */}
      <div style={{ padding: '0.875rem', borderTop: '1px solid #1e2d4a' }}>
        <div style={{
          fontSize: '9px', color: '#00d4aa', fontWeight: 700,
          letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '0.6rem',
        }}>ISRO Data Sources</div>
        {dataSources.map(src => (
          <div key={src} style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            fontSize: '10.5px', color: '#6b7a8d', marginBottom: '0.3rem',
          }}>
            <span>{src}</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '3px', color: '#00d4aa', fontSize: '10px' }}>
              <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#00d4aa', display: 'inline-block' }} />
              Live
            </span>
          </div>
        ))}
      </div>

      {/* About */}
      <button
        onClick={() => onNavigate('about')}
        style={{
          padding: '0.6rem 0.875rem',
          background: 'transparent', border: 'none',
          color: '#6b7a8d', fontSize: '11px', cursor: 'pointer',
          textAlign: 'left', display: 'flex', alignItems: 'center', gap: '0.5rem',
          borderTop: '1px solid #1e2d4a',
        }}>
        ℹ️ About Project
      </button>
    </div>
  );
}