'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { api } from '@/lib/api';
import AlertSystemPanel from '@/components/dashboard/AlertSystemPanel';

interface HeatActionPlanPanelProps {
  city: string;
  baseTemp: number;
  humidity: number;
  windSpeed: number;
  elderlyPct: number;
  outdoorWorkerPct: number;
  population: number;
}

const alertColor = (level: string) => ({
  'Watch': '#00d4aa',
  'Yellow Alert': '#ffd700',
  'Orange Alert': '#ff9800',
  'Red Alert': '#ff3d3d',
}[level] || '#fff');

const cardStyle: React.CSSProperties = {
  background: 'rgba(13,22,40,0.75)',
  backdropFilter: 'blur(16px)',
  border: '1px solid rgba(30,45,74,0.8)',
  borderRadius: '16px',
  padding: '1.25rem',
};

export default function HeatActionPlanPanel({ city, baseTemp, humidity, windSpeed, elderlyPct, outdoorWorkerPct, population }: HeatActionPlanPanelProps) {
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const [treeCover, setTreeCover] = useState(0);
  const [coolRoof, setCoolRoof] = useState(0);
  const [waterBody, setWaterBody] = useState(0);
  const [simResult, setSimResult] = useState<any>(null);
  const [simLoading, setSimLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      setSimResult(null);
      try {
        const p = await api.getActionPlan(city.toLowerCase());
        if (!cancelled) setPlan(p);
      } catch (e) {
        if (!cancelled) setError('Could not load action plan. Try again.');
        console.error(e);
      }
      if (!cancelled) setLoading(false);
    }
    load();
    return () => { cancelled = true; };
  }, [city]);

  const runSimulation = async () => {
    setSimLoading(true);
    try {
      const result = await api.simulateActionPlan({
        city: city.toLowerCase(),
        baseTemp,
        humidity,
        windSpeed,
        shortwaveRadiation: 450,
        elderlyPct,
        outdoorWorkerPct,
        population,
        treeCoverIncrease: treeCover,
        coolRoofPercentage: coolRoof,
        waterBodyIncrease: waterBody,
        albedoIncrease: coolRoof > 0 ? 0.5 : 0,
      });
      setSimResult(result);
    } catch (e) { console.error(e); }
    setSimLoading(false);
  };

  if (loading) {
    return (
      <div style={{ ...cardStyle, textAlign: 'center', color: '#6b7a90' }}>
        🚨 Generating Heat Action Plan advisory...
      </div>
    );
  }

  if (error || !plan) {
    return (
      <div style={{ ...cardStyle, textAlign: 'center', color: '#ff6b35' }}>
        {error || 'No data available.'}
      </div>
    );
  }

  const color = alertColor(plan.overallAlertLevel);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

      {/* ── Why this replaces Predictor + Simulator ── */}
      <div style={{ ...cardStyle, padding: '0.9rem 1.25rem', borderColor: 'rgba(0,212,170,0.3)' }}>
        <p style={{ fontSize: '0.75rem', color: '#8892b0', lineHeight: 1.6, margin: 0 }}>
          🚨 <strong style={{ color: '#00d4aa' }}>Heat Action Plan Advisor</strong> — directly implements PS26083's requirement for
          automated triggers (cooling centers, work-hour advisories, power-grid alerts). Live risk auto-loads from
          real weather; the scenario tester below shows whether a cooling intervention would actually downgrade
          today's alert level — turning prediction and mitigation-testing into one decision-support tool.
        </p>
      </div>

      {/* ── Overall Alert Level — hero ── */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
        style={{ ...cardStyle, textAlign: 'center', borderColor: `${color}50`, position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: `linear-gradient(90deg, transparent, ${color}, transparent)` }} />
        <div style={{ fontSize: '0.7rem', color: '#5a6b82', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '0.5rem' }}>
          Current Alert Level — {plan.city}
        </div>
        <div style={{ fontSize: '2.2rem', fontWeight: 900, color }}>{plan.overallAlertLevel}</div>
        <div style={{ fontSize: '0.85rem', color: '#8892b0', marginTop: '0.4rem' }}>
          WBGT {plan.wbgt}°C · UTCI {plan.utci}°C · Mortality Risk {plan.mortalityRiskIndex}/100 · {plan.stressCategory}
        </div>
      </motion.div>

      {/* ── Three action triggers ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '0.9rem' }}>

        {/* Cooling Centers */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
          style={{ ...cardStyle, borderColor: plan.coolingCenters.triggered ? 'rgba(255,107,53,0.4)' : 'rgba(30,45,74,0.8)' }}>
          <div style={{ fontSize: '1.4rem', marginBottom: '0.5rem' }}>🏢</div>
          <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#f0f4ff', marginBottom: '0.5rem' }}>Cooling Centers</div>
          {plan.coolingCenters.triggered ? (
            <>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#ff6b35' }}>{plan.coolingCenters.centersRecommended}</div>
              <div style={{ fontSize: '0.72rem', color: '#8892b0' }}>centers recommended (5,000 people/center)</div>
              <div style={{ fontSize: '0.72rem', color: '#8892b0', marginTop: '0.3rem' }}>
                Covering ~{plan.coolingCenters.vulnerablePopulationCovered.toLocaleString()} vulnerable residents
              </div>
            </>
          ) : (
            <div style={{ fontSize: '0.82rem', color: '#00d4aa' }}>✓ Not required at current risk level</div>
          )}
        </motion.div>

        {/* Outdoor Work Advisory */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          style={{ ...cardStyle, borderColor: plan.outdoorWorkAdvisory.restriction !== 'None' ? 'rgba(255,215,0,0.4)' : 'rgba(30,45,74,0.8)' }}>
          <div style={{ fontSize: '1.4rem', marginBottom: '0.5rem' }}>👷</div>
          <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#f0f4ff', marginBottom: '0.5rem' }}>Outdoor Work Advisory</div>
          <div style={{ fontSize: '0.85rem', fontWeight: 700, color: plan.outdoorWorkAdvisory.restriction !== 'None' ? '#ffd700' : '#00d4aa', marginBottom: '0.4rem' }}>
            {plan.outdoorWorkAdvisory.restriction}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#8892b0' }}>{plan.outdoorWorkAdvisory.guidance}</div>
        </motion.div>

        {/* Power Grid Alert */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          style={{ ...cardStyle, borderColor: plan.powerGridAlert.triggered ? 'rgba(255,61,61,0.4)' : 'rgba(30,45,74,0.8)' }}>
          <div style={{ fontSize: '1.4rem', marginBottom: '0.5rem' }}>⚡</div>
          <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#f0f4ff', marginBottom: '0.5rem' }}>Power Grid Alert</div>
          {plan.powerGridAlert.triggered ? (
            <>
              <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#ff3d3d', marginBottom: '0.4rem' }}>⚠️ Triggered</div>
              <div style={{ fontSize: '0.72rem', color: '#8892b0', marginBottom: '0.3rem' }}>{plan.powerGridAlert.reason}</div>
              <div style={{ fontSize: '0.72rem', color: '#00d4aa' }}>→ {plan.powerGridAlert.recommendedAction}</div>
            </>
          ) : (
            <div style={{ fontSize: '0.82rem', color: '#00d4aa' }}>✓ Grid load within normal range</div>
          )}
        </motion.div>

        {/* Hospital Capacity Alert — optional chaining so an out-of-sync backend can't crash the page */}
        {plan.hospitalCapacityAlert ? (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            style={{ ...cardStyle, borderColor: plan.hospitalCapacityAlert.exceedsCapacity ? 'rgba(255,61,61,0.4)' : 'rgba(30,45,74,0.8)' }}>
            <div style={{ fontSize: '1.4rem', marginBottom: '0.5rem' }}>🏥</div>
            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#f0f4ff', marginBottom: '0.5rem' }}>Hospital Capacity</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: plan.hospitalCapacityAlert.exceedsCapacity ? '#ff3d3d' : '#00d4aa' }}>
              {plan.hospitalCapacityAlert.capacityUtilizationPct}%
            </div>
            <div style={{ fontSize: '0.72rem', color: '#8892b0', marginBottom: '0.3rem' }}>
              {plan.hospitalCapacityAlert.predictedHeatAdmissions?.toLocaleString()} predicted admissions vs {plan.hospitalCapacityAlert.surgeCapacityBeds?.toLocaleString()} surge beds
            </div>
            {plan.hospitalCapacityAlert.exceedsCapacity ? (
              <div style={{ fontSize: '0.72rem', color: '#ff6b35', fontWeight: 600 }}>⚠️ Surge capacity would be exceeded — coordinate with neighboring facilities</div>
            ) : (
              <div style={{ fontSize: '0.72rem', color: '#00d4aa' }}>✓ Within surge capacity</div>
            )}
          </motion.div>
        ) : (
          <div style={{ ...cardStyle, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#5a6b82', fontSize: '0.78rem' }}>
            🏥 Hospital capacity data unavailable — backend may still be deploying
          </div>
        )}
      </div>

      {plan.hospitalCapacityAlert?.note && (
        <div style={{ fontSize: '0.65rem', color: '#5a6b82', marginTop: '-0.5rem' }}>
          {plan.hospitalCapacityAlert.note}
        </div>
      )}

      {/* ── Mitigation Scenario Tester ── */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} style={cardStyle}>
        <h3 style={{ color: '#f0f4ff', fontWeight: 700, marginBottom: '0.4rem', fontSize: '0.95rem' }}>🧪 Test a Cooling Intervention</h3>
        <p style={{ fontSize: '0.75rem', color: '#8892b0', marginBottom: '1.1rem' }}>
          Adjust the sliders to simulate urban cooling measures, then see if the resulting temperature drop
          would actually downgrade today's alert level and action-plan triggers.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
          {[
            { label: 'Tree Cover Increase (%)', value: treeCover, set: setTreeCover, max: 40 },
            { label: 'Cool Roof Coverage (%)', value: coolRoof, set: setCoolRoof, max: 100 },
            { label: 'Water Body Increase (%)', value: waterBody, set: setWaterBody, max: 20 },
          ].map(field => (
            <div key={field.label}>
              <label style={{ fontSize: '0.72rem', color: '#5a6b82', display: 'block', marginBottom: '0.4rem' }}>{field.label}</label>
              <input type="range" min={0} max={field.max} step={1}
                value={field.value}
                onChange={e => field.set(parseFloat(e.target.value))}
                style={{ width: '100%', accentColor: '#00d4aa' }} />
              <div style={{ fontSize: '0.82rem', color: '#00d4aa', fontWeight: 700, textAlign: 'center' }}>{field.value}%</div>
            </div>
          ))}
        </div>

        <button onClick={runSimulation}
          style={{ padding: '0.7rem 1.8rem', borderRadius: '2rem', border: 'none', background: simLoading ? '#1e2d4a' : 'linear-gradient(135deg, #00d4aa, #0099ff)', color: '#fff', fontWeight: 700, cursor: simLoading ? 'not-allowed' : 'pointer', fontSize: '0.85rem' }}>
          {simLoading ? 'Simulating...' : '🧪 Run Scenario'}
        </button>

        {simResult && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            style={{ marginTop: '1.25rem', padding: '1.1rem', background: 'rgba(0,0,0,0.3)', borderRadius: '12px', border: '1px solid rgba(30,45,74,0.8)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '0.75rem' }}>
              <div>
                <div style={{ fontSize: '0.65rem', color: '#5a6b82', textTransform: 'uppercase' }}>Temp Reduction</div>
                <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#00d4aa' }}>-{simResult.totalCooling}°C</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: alertColor(simResult.before.plan.overallAlertLevel) }}>
                  {simResult.before.plan.overallAlertLevel}
                </span>
                <span style={{ color: '#5a6b82' }}>→</span>
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: alertColor(simResult.after.plan.overallAlertLevel) }}>
                  {simResult.after.plan.overallAlertLevel}
                </span>
              </div>
            </div>
            <div style={{
              padding: '0.5rem 0.9rem', borderRadius: '8px', fontSize: '0.78rem', fontWeight: 600,
              background: simResult.alertDowngraded
                ? 'rgba(0,212,170,0.1)'
                : simResult.before.plan.overallAlertLevel === 'Watch'
                  ? 'rgba(0,212,170,0.1)'
                  : 'rgba(255,107,53,0.1)',
              color: simResult.alertDowngraded
                ? '#00d4aa'
                : simResult.before.plan.overallAlertLevel === 'Watch'
                  ? '#00d4aa'
                  : '#ff6b35',
            }}>
              {simResult.alertDowngraded
                ? `✓ This intervention downgrades the alert level — cooling centers/work-hour restrictions may be relaxed.`
                : simResult.before.plan.overallAlertLevel === 'Watch'
                  ? `✓ Already at the lowest alert level (Watch) — no downgrade possible, but the ${simResult.totalCooling}°C reduction still helps prevent conditions from worsening.`
                  : `⚠️ Not enough to change the alert level yet — try increasing the intervention scale.`}
            </div>
          </motion.div>
        )}
      </motion.div>

      {/* ── SMS/WhatsApp Alert Dispatch (PS26083 requirement) ── */}
      <AlertSystemPanel city={city} />
    </div>
  );
}