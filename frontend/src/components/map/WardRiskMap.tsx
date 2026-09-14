'use client';

import { useEffect, useRef } from 'react';

interface WardRiskMapProps {
  city: string;
  centerLat: number;
  centerLng: number;
  wards: any[]; // WardMortalityRisk[]
}

const tierColor = (tier: string) => ({
  Low: '#00d4aa',
  Moderate: '#ffd700',
  High: '#ff6b35',
  Critical: '#ff3d3d',
}[tier] || '#fff');

export default function WardRiskMap({ city, centerLat, centerLng, wards }: WardRiskMapProps) {
  const mapRef = useRef<any>(null);
  const mapInstanceRef = useRef<any>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const initMap = async () => {
      const L = (await import('leaflet')).default;
      await import('leaflet/dist/leaflet.css');

      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
      }

      const map = L.map(mapRef.current, {
        center: [centerLat, centerLng],
        zoom: 12,
        zoomControl: true,
      });

      // Free OSM tiles, no API key — same dark-filter trick as main HeatMap
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(map);

      // Ward zones as filled circles — radius + opacity scale with mortality risk,
      // so worse-off wards visually read as bigger/hotter zones (Google-Maps-style
      // heat-zone look) rather than plain pins.
      wards.forEach((ward: any) => {
        const color = tierColor(ward.riskTier);
        const riskFraction = Math.min(ward.mortalityRiskIndex / 100, 1);
        const radiusMeters = 500 + riskFraction * 1600; // 500m - 2100m zone radius

        L.circle([ward.lat, ward.lng], {
          radius: radiusMeters,
          color,
          weight: 1.5,
          fillColor: color,
          fillOpacity: 0.18 + riskFraction * 0.32,
          opacity: 0.7,
        })
          .addTo(map)
          .bindPopup(`
            <div style="background:#111827;color:#f0f4ff;padding:10px;border-radius:8px;min-width:200px;">
              <div style="font-weight:700;color:${color};margin-bottom:6px;font-size:13px;">
                ${ward.ward}
              </div>
              <div style="font-size:12px;color:#8892b0;">🏥 Mortality Risk: <span style="color:${color};font-weight:700">${ward.mortalityRiskIndex}/100 (${ward.riskTier})</span></div>
              <div style="font-size:12px;color:#8892b0;">🧮 HSRI: <span style="color:#00d4aa;font-weight:700">${ward.hsri} (${ward.hsriTier})</span></div>
              <div style="font-size:12px;color:#8892b0;">🚑 Spike Prob.: <span style="color:#bf5af2;font-weight:600">${ward.hospitalizationSpikeProbability}%</span></div>
              <div style="font-size:12px;color:#8892b0;">👴 Elderly: <span style="color:#0099ff;font-weight:600">${ward.elderlyPct}%</span></div>
              <div style="font-size:12px;color:#8892b0;">🛠️ Outdoor Workers: <span style="color:#ffd700;font-weight:600">${ward.outdoorWorkerPct}%</span></div>
              <div style="font-size:12px;color:#8892b0;">👥 Population: ${ward.population.toLocaleString()}</div>
            </div>
          `);

        // Small center dot so the zone reads clearly even at low zoom
        L.circleMarker([ward.lat, ward.lng], {
          radius: 4,
          color: '#fff',
          weight: 1,
          fillColor: color,
          fillOpacity: 1,
        }).addTo(map);
      });

      mapInstanceRef.current = map;
    };

    initMap();

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [city, centerLat, centerLng, wards]);

  return (
    <>
      <style>{`
        .wardriskmap-dark-tiles .leaflet-tile-pane {
          filter: invert(1) hue-rotate(180deg) brightness(0.92) contrast(0.88) saturate(0.9);
        }
        .wardriskmap-dark-tiles .leaflet-popup-content-wrapper {
          background: #111827 !important;
          border: 1px solid #1e2d4a !important;
          border-radius: 12px !important;
          box-shadow: 0 0 20px rgba(0,212,170,0.2) !important;
        }
        .wardriskmap-dark-tiles .leaflet-popup-tip {
          background: #111827 !important;
        }
      `}</style>
      <div
        ref={mapRef}
        className="wardriskmap-dark-tiles"
        style={{
          width: '100%',
          height: '420px',
          borderRadius: '16px',
          overflow: 'hidden',
          border: '1px solid #1e2d4a',
          background: '#0a0f1e',
        }}
      />
    </>
  );
}
