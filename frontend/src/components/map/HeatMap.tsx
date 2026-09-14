'use client';

import { useEffect, useRef } from 'react';

interface HeatMapProps {
  city: string;
  hotspots: any[];
}

const getRiskColor = (risk: string) => {
  const colors: any = {
    low: '#00d4aa',
    medium: '#ffd700',
    high: '#ff6b35',
    extreme: '#ff3d3d',
  };
  return colors[risk] || '#fff';
};

export default function HeatMap({ city, hotspots }: HeatMapProps) {
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

      const cityCoords: any = {
        mumbai: [19.0760, 72.8777],
        thane: [19.2183, 72.9781],
        delhi: [28.6139, 77.2090],
        bangalore: [12.9716, 77.5946],
        chennai: [13.0827, 80.2707],
        hyderabad: [17.3850, 78.4867],
        pune: [18.5204, 73.8567],
      };

      const coords = cityCoords[city.toLowerCase()] || [19.0760, 72.8777];

      const map = L.map(mapRef.current, {
        center: coords,
        zoom: 12,
        zoomControl: true,
      });

      // FREE tiles, no API key ever required — standard OpenStreetMap raster tiles.
      // Dark look is achieved with a CSS filter on the tile pane (no paid dark-theme
      // tile provider needed — CartoDB's free dark tiles now require a signup/API key).
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(map);

      // Add hotspot markers
      hotspots.forEach((hotspot: any) => {
        const color = getRiskColor(hotspot.heatRisk);
        
        const pulseIcon = L.divIcon({
          className: '',
          html: `
            <div style="position:relative;width:20px;height:20px;">
              <div style="
                position:absolute;
                width:20px;height:20px;
                border-radius:50%;
                background:${color};
                opacity:0.8;
                animation:pulse 2s infinite;
              "></div>
              <div style="
                position:absolute;
                top:5px;left:5px;
                width:10px;height:10px;
                border-radius:50%;
                background:${color};
              "></div>
            </div>
          `,
          iconSize: [20, 20],
        });

        L.marker([hotspot.lat, hotspot.lng], { icon: pulseIcon })
          .addTo(map)
          .bindPopup(`
            <div style="background:#111827;color:#f0f4ff;padding:10px;border-radius:8px;min-width:180px;">
              <div style="font-weight:700;color:${color};margin-bottom:6px;text-transform:uppercase;font-size:12px;">
                ${hotspot.heatRisk} risk
              </div>
              <div style="font-size:13px;color:#8892b0;">🌡️ LST: <span style="color:#ff6b35;font-weight:600">${hotspot.lst}°C</span></div>
              <div style="font-size:13px;color:#8892b0;">🌿 NDVI: <span style="color:#00d4aa;font-weight:600">${hotspot.ndvi}</span></div>
              <div style="font-size:13px;color:#8892b0;">🏗️ NDBI: <span style="color:#ffd700;font-weight:600">${hotspot.ndbi}</span></div>
              <div style="font-size:13px;color:#8892b0;">💧 Humidity: <span style="color:#0099ff;font-weight:600">${hotspot.humidity}%</span></div>
              <div style="font-size:13px;color:#8892b0;">📍 ${hotspot.district}</div>
            </div>
          `, { 
            className: 'custom-popup'
          });
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
  }, [city, hotspots]);

  return (
    <>
      <style>{`
        @keyframes pulse {
          0% { transform: scale(1); opacity: 0.8; }
          50% { transform: scale(2); opacity: 0.2; }
          100% { transform: scale(1); opacity: 0.8; }
        }
        .leaflet-popup-content-wrapper {
          background: #111827 !important;
          border: 1px solid #1e2d4a !important;
          border-radius: 12px !important;
          box-shadow: 0 0 20px rgba(0,212,170,0.2) !important;
        }
        .leaflet-popup-tip {
          background: #111827 !important;
        }
        /* Dark-mode tile filter — turns free OSM tiles into a dark map, no paid provider needed */
        .heatmap-dark-tiles .leaflet-tile-pane {
          filter: invert(1) hue-rotate(180deg) brightness(0.92) contrast(0.88) saturate(0.9);
        }
        .heatmap-dark-tiles .leaflet-marker-icon,
        .heatmap-dark-tiles .leaflet-popup {
          filter: none;
        }
      `}</style>
      <div
        ref={mapRef}
        className="heatmap-dark-tiles"
        style={{
          width: '100%',
          height: '450px',
          borderRadius: '16px',
          overflow: 'hidden',
          border: '1px solid #1e2d4a',
          background: '#0a0f1e',
        }}
      />
    </>
  );
}
