'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { api } from '@/lib/api';

interface AlertSystemPanelProps {
  city: string;
}

const cardStyle: React.CSSProperties = {
  background: 'rgba(13,22,40,0.75)',
  backdropFilter: 'blur(16px)',
  border: '1px solid rgba(30,45,74,0.8)',
  borderRadius: '16px',
  padding: '1.25rem',
};

export default function AlertSystemPanel({ city }: AlertSystemPanelProps) {
  const [channel, setChannel] = useState<'sms' | 'whatsapp'>('sms');
  const [preview, setPreview] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('+91');
  const [sendResult, setSendResult] = useState<any>(null);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setSendResult(null);
      try {
        const p = await api.previewAlert(city.toLowerCase(), channel);
        if (!cancelled) setPreview(p);
      } catch (e) { console.error(e); }
      if (!cancelled) setLoading(false);
    }
    load();
    return () => { cancelled = true; };
  }, [city, channel]);

  const handleSend = async () => {
    if (!phoneNumber || phoneNumber.length < 10) return;
    setSending(true);
    try {
      const result = await api.sendAlert({ city: city.toLowerCase(), toNumber: phoneNumber, channel });
      setSendResult(result);
    } catch (e) { console.error(e); }
    setSending(false);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={cardStyle}>
      <h3 style={{ color: '#f0f4ff', fontWeight: 700, marginBottom: '0.3rem', fontSize: '0.95rem' }}>📲 SMS / WhatsApp Alert Dispatch</h3>
      <p style={{ fontSize: '0.75rem', color: '#8892b0', marginBottom: '1.1rem' }}>
        Push the current Heat Action Plan as an automated regional alert — the exact PS26083 requirement for
        SMS/WhatsApp-based city administration triggers.
      </p>

      {/* Channel selector */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
        {(['sms', 'whatsapp'] as const).map(c => (
          <button key={c} onClick={() => setChannel(c)}
            style={{
              padding: '0.5rem 1.2rem', borderRadius: '2rem', border: 'none', cursor: 'pointer',
              background: channel === c ? 'linear-gradient(135deg, #00d4aa, #0099ff)' : 'rgba(255,255,255,0.05)',
              color: channel === c ? '#fff' : '#8892b0', fontWeight: 600, fontSize: '0.82rem',
            }}>
            {c === 'sms' ? '💬 SMS' : '🟢 WhatsApp'}
          </button>
        ))}
      </div>

      {/* Alert trigger status */}
      {preview && (
        <div style={{
          padding: '0.5rem 0.9rem', borderRadius: '8px', fontSize: '0.78rem', fontWeight: 600, marginBottom: '1rem',
          background: preview.shouldTrigger ? 'rgba(255,107,53,0.1)' : 'rgba(0,212,170,0.1)',
          color: preview.shouldTrigger ? '#ff6b35' : '#00d4aa',
        }}>
          {preview.shouldTrigger
            ? `⚠️ Auto-trigger condition met (${preview.overallAlertLevel}) — this alert would fire automatically in a live deployment`
            : `✓ Currently at Watch level — alert available on-demand, not auto-triggered`}
        </div>
      )}

      {/* Message preview */}
      <div style={{ marginBottom: '1.1rem' }}>
        <label style={{ fontSize: '0.7rem', color: '#5a6b82', display: 'block', marginBottom: '0.4rem', textTransform: 'uppercase' }}>Message Preview</label>
        <div style={{
          background: '#0a0f1e', border: '1px solid #1e2d4a', borderRadius: '12px', padding: '1rem',
          fontSize: '0.82rem', color: '#d0e0f0', whiteSpace: 'pre-wrap', fontFamily: 'monospace', minHeight: '80px',
        }}>
          {loading ? 'Loading preview...' : preview?.message || 'No preview available'}
        </div>
      </div>

      {/* Send controls */}
      <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <input
          type="tel"
          value={phoneNumber}
          onChange={e => setPhoneNumber(e.target.value)}
          placeholder="+919999999999"
          style={{
            padding: '0.6rem 1rem', borderRadius: '8px', border: '1px solid #1e2d4a',
            background: '#0a0f1e', color: '#f0f4ff', fontSize: '0.85rem', flex: '1 1 200px',
          }}
        />
        <button onClick={handleSend} disabled={sending}
          style={{
            padding: '0.6rem 1.5rem', borderRadius: '8px', border: 'none',
            background: sending ? '#1e2d4a' : 'linear-gradient(135deg, #00d4aa, #0099ff)',
            color: '#fff', fontWeight: 700, cursor: sending ? 'not-allowed' : 'pointer', fontSize: '0.85rem',
          }}>
          {sending ? 'Sending...' : `🚀 Send ${channel === 'sms' ? 'SMS' : 'WhatsApp'} Alert`}
        </button>
      </div>

      {/* Send result */}
      {sendResult && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          style={{
            marginTop: '1rem', padding: '0.9rem 1rem', borderRadius: '10px',
            background: sendResult.status === 'sent' ? 'rgba(0,212,170,0.1)' : sendResult.status === 'simulated' ? 'rgba(255,215,0,0.08)' : 'rgba(255,61,61,0.1)',
            border: `1px solid ${sendResult.status === 'sent' ? 'rgba(0,212,170,0.3)' : sendResult.status === 'simulated' ? 'rgba(255,215,0,0.3)' : 'rgba(255,61,61,0.3)'}`,
          }}>
          <div style={{
            fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.3rem',
            color: sendResult.status === 'sent' ? '#00d4aa' : sendResult.status === 'simulated' ? '#ffd700' : '#ff3d3d',
          }}>
            {sendResult.status === 'sent' && '✓ Sent successfully'}
            {sendResult.status === 'simulated' && '🧪 Simulated (Twilio not configured)'}
            {sendResult.status === 'failed' && '✗ Send failed'}
          </div>
          {sendResult.note && <div style={{ fontSize: '0.72rem', color: '#8892b0' }}>{sendResult.note}</div>}
          {sendResult.twilioSid && <div style={{ fontSize: '0.72rem', color: '#8892b0' }}>Twilio SID: {sendResult.twilioSid}</div>}
          {sendResult.error && <div style={{ fontSize: '0.72rem', color: '#ff6b35' }}>{sendResult.error}</div>}
        </motion.div>
      )}
    </motion.div>
  );
}
