'use client';

interface TopbarProps {
  dateRange?: string;
}

export default function Topbar({ dateRange = '2026-05-17 to 2026-06-16' }: TopbarProps) {
  return (
    <div style={{
      height: '44px',
      background: '#080c14',
      borderBottom: '1px solid #1e2d4a',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 1.25rem',
      flexShrink: 0,
      position: 'sticky',
      top: 0,
      zIndex: 10,
    }}>
      {/* Left — branding */}
      <span style={{
        fontSize: '10px', color: '#00d4aa',
        letterSpacing: '0.12em', fontWeight: 600,
      }}>
        ISRO × BHARATIYA ANTARIKSH HACKATHON 2026
      </span>

      {/* Right — badges + icons */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        {/* Live dot */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', color: '#00d4aa' }}>
          <span style={{
            width: '7px', height: '7px', borderRadius: '50%',
            background: '#00d4aa', display: 'inline-block',
            boxShadow: '0 0 6px #00d4aa',
          }} />
          Live Data
        </div>

        {/* Date range */}
        <div style={{
          fontSize: '10.5px', color: '#6b7a8d',
          background: '#111827', padding: '3px 10px',
          borderRadius: '4px', border: '1px solid #1e2d4a',
          display: 'flex', alignItems: 'center', gap: '5px',
        }}>
          📅 {dateRange}
        </div>

        {/* Bell */}
        <div style={{
          width: '28px', height: '28px', borderRadius: '50%',
          background: '#111827', border: '1px solid #1e2d4a',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', fontSize: '13px',
        }}>🔔</div>

        {/* Avatar */}
        <div style={{
          width: '28px', height: '28px', borderRadius: '50%',
          background: 'linear-gradient(135deg, #00d4aa, #0099ff)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', fontSize: '12px', fontWeight: 700, color: '#0a0f1e',
        }}>D</div>
      </div>
    </div>
  );
}