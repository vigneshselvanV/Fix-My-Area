import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ReportItem, RiskLevel } from '../../types';
import { Eye, Flame } from 'lucide-react';
import { RiskBadge } from '../common/RiskBadge';
import { StatusBadge } from '../common/StatusBadge';
import { CategoryIcon } from '../common/CategoryIcon';
import L from 'leaflet';

interface GoogleMapViewerProps {
  reports: ReportItem[];
  center?: { lat: number; lng: number };
  zoom?: number;
  interactive?: boolean;
  selectedReportId?: string;
  onSelectReport?: (report: ReportItem) => void;
  className?: string;
}

const RISK_COLORS: Record<RiskLevel, string> = {
  Low: '#16A34A',
  Medium: '#D97706',
  High: '#EA580C',
  Critical: '#DC2626',
};

export const GoogleMapViewer: React.FC<GoogleMapViewerProps> = ({
  reports,
  center = { lat: 12.9716, lng: 77.5946 }, // Default Center
  zoom = 13,
  selectedReportId,
  onSelectReport,
  className = 'w-full h-full min-h-[380px]',
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const leafletMapRef = useRef<L.Map | null>(null);
  const leafletMarkersRef = useRef<L.Marker[]>([]);
  const leafletCirclesRef = useRef<L.Circle[]>([]);
  const navigate = useNavigate();

  const [activeReport, setActiveReport] = useState<ReportItem | null>(null);
  const [showDensityHeatmap, setShowDensityHeatmap] = useState<boolean>(false);

  // Sync active report if selectedReportId changes
  useEffect(() => {
    if (selectedReportId) {
      const found = reports.find((r) => r.id === selectedReportId);
      if (found) {
        setActiveReport(found);
        if (leafletMapRef.current) {
          leafletMapRef.current.setView([found.latitude, found.longitude], 15);
        }
      }
    }
  }, [selectedReportId, reports]);

  // Leaflet Map Initialization and Layer Rendering
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!leafletMapRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: reports.length > 0 ? [reports[0].latitude, reports[0].longitude] : [center.lat, center.lng],
        zoom: zoom,
        zoomControl: true,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap contributors',
      }).addTo(map);

      leafletMapRef.current = map;
    }

    const map = leafletMapRef.current;

    // Clear existing markers & heat circles
    leafletMarkersRef.current.forEach((m) => m.remove());
    leafletMarkersRef.current = [];
    leafletCirclesRef.current.forEach((c) => c.remove());
    leafletCirclesRef.current = [];

    const bounds: L.LatLngExpression[] = [];

    reports.forEach((report) => {
      const color = RISK_COLORS[report.risk_level] || '#0D6E6E';
      const areaLabel = report.address || `${report.latitude.toFixed(3)}, ${report.longitude.toFixed(3)}`;

      if (showDensityHeatmap) {
        const radiusMeters =
          report.risk_level === 'Critical' ? 450 : report.risk_level === 'High' ? 300 : 180;
        const heatCircle = L.circle([report.latitude, report.longitude], {
          color: color,
          fillColor: color,
          fillOpacity: report.risk_level === 'Critical' ? 0.35 : 0.22,
          radius: radiusMeters,
          weight: 1.5,
        }).addTo(map);

        leafletCirclesRef.current.push(heatCircle);
      }

      const customIcon = L.divIcon({
        className: 'custom-civic-pin',
        html: `
          <div style="
            background-color: ${color};
            width: 32px;
            height: 32px;
            border-radius: 50% 50% 50% 0;
            transform: rotate(-45deg);
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 4px 10px rgba(0,0,0,0.35);
            border: 2px solid #ffffff;
            cursor: pointer;
            position: relative;
          ">
            <div style="
              width: 10px;
              height: 10px;
              background-color: #ffffff;
              border-radius: 50%;
              transform: rotate(45deg);
            "></div>
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 32],
        popupAnchor: [0, -32],
      });

      const marker = L.marker([report.latitude, report.longitude], { icon: customIcon }).addTo(map);

      marker.bindTooltip(
        `<div style="font-family:sans-serif; font-size:11px; font-weight:700; color:#0f172a; padding:2px;">
          📍 ${areaLabel}
          <div style="font-size:10px; color:#475569; font-weight:500;">${report.category} (${report.risk_level})</div>
        </div>`,
        { direction: 'top', offset: [0, -30] }
      );

      marker.on('click', () => {
        setActiveReport(report);
        if (onSelectReport) onSelectReport(report);
      });

      leafletMarkersRef.current.push(marker);
      bounds.push([report.latitude, report.longitude]);
    });

    if (bounds.length > 1) {
      map.fitBounds(L.latLngBounds(bounds), { padding: [40, 40] });
    } else if (bounds.length === 1) {
      map.setView(bounds[0], 14);
    }
  }, [reports, showDensityHeatmap]);

  return (
    <div className={`relative rounded-3xl overflow-hidden border border-slate-200 shadow-sm bg-slate-100 ${className}`}>
      
      {/* Map Surface */}
      <div ref={mapContainerRef} className="w-full h-full min-h-[380px] z-0" />

      {/* Map Top Controls Bar */}
      <div className="absolute top-3 right-3 z-10 flex items-center gap-2">
        
        {/* Heatmap Toggle */}
        <button
          type="button"
          onClick={() => setShowDensityHeatmap(!showDensityHeatmap)}
          className={`py-1.5 px-3 rounded-xl border text-[11px] font-bold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer ${
            showDensityHeatmap
              ? 'bg-red-600 text-white border-red-700 ring-2 ring-red-300'
              : 'bg-white/95 text-slate-700 border-slate-200 hover:bg-slate-50'
          }`}
          title="Toggle Hazard Cluster Heatmap Overlay"
        >
          <Flame className={`w-3.5 h-3.5 ${showDensityHeatmap ? 'text-amber-200' : 'text-red-600'}`} />
          <span>{showDensityHeatmap ? 'Heatmap: ON' : 'Heatmap: OFF'}</span>
        </button>

        {/* Incidents Count Badge */}
        <div className="bg-white/95 backdrop-blur-sm border border-slate-200 px-3 py-1.5 rounded-xl shadow-xs hidden sm:flex items-center gap-1.5 text-[11px] font-bold text-slate-700">
          <span className="w-2 h-2 rounded-full bg-teal-600 animate-pulse" />
          <span className="text-teal-900 font-semibold">{reports.length} Incidents</span>
        </div>
      </div>

      {/* Selected Report Card Overlay */}
      {activeReport && (
        <div className="absolute bottom-4 left-4 right-4 sm:right-auto sm:max-w-sm bg-white rounded-3xl shadow-xl p-4 border-2 border-teal-600/30 z-20 transition-all animate-in fade-in slide-in-from-bottom-2 font-sans">
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="flex items-center gap-1.5">
              <RiskBadge level={activeReport.risk_level} size="sm" />
              <StatusBadge status={activeReport.status} size="sm" />
            </div>
            <button
              onClick={() => setActiveReport(null)}
              className="text-slate-400 hover:text-slate-600 p-1 text-xs cursor-pointer"
            >
              ✕
            </button>
          </div>

          <div className="flex items-center gap-2 mb-1">
            <CategoryIcon category={activeReport.category} className="w-4 h-4 text-teal-800 shrink-0" />
            <h5 className="font-heading font-bold text-slate-900 text-sm truncate">
              {activeReport.category}
            </h5>
          </div>

          <div className="p-2 bg-teal-50/70 border border-teal-100 rounded-xl mb-2">
            <span className="text-[10px] font-bold text-teal-800 uppercase tracking-wider block">
              📍 Area & Landmark
            </span>
            <p className="text-xs font-semibold text-slate-800 truncate">
              {activeReport.address || `${activeReport.latitude.toFixed(4)}, ${activeReport.longitude.toFixed(4)}`}
            </p>
          </div>

          <p className="text-xs text-slate-600 line-clamp-2 mb-3">
            {activeReport.description}
          </p>

          <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-100">
            <span className="text-slate-500 font-medium">
              👍 {activeReport.upvote_count || 0} verified
            </span>
            <button
              onClick={() => navigate(`/report/${activeReport.id}`)}
              className="text-teal-800 font-bold hover:underline flex items-center gap-1 cursor-pointer"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Full Details</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
