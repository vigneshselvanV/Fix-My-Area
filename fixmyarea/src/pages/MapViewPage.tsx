import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ReportItem, ReportCategory, RiskLevel } from '../types';
import { subscribeReports } from '../services/reports';
import { GoogleMapViewer } from '../components/maps/GoogleMapViewer';
import { CategoryIcon } from '../components/common/CategoryIcon';
import { RiskBadge } from '../components/common/RiskBadge';
import { StatusBadge } from '../components/common/StatusBadge';
import { SlaBadge } from '../components/common/SlaBadge';
import {
  Layers,
  ChevronRight,
  Sparkles,
  MapPin,
  Building2,
  ExternalLink,
  SlidersHorizontal,
} from 'lucide-react';

const QUICK_AREAS = [
  { name: 'All Wards', lat: 12.9716, lng: 77.5946, zoom: 12 },
  { name: 'Indiranagar', lat: 12.9784, lng: 77.6408, zoom: 15 },
  { name: 'Koramangala', lat: 12.9352, lng: 77.6245, zoom: 15 },
  { name: 'MG Road', lat: 12.9756, lng: 77.6066, zoom: 15 },
  { name: 'Whitefield', lat: 12.9698, lng: 77.7499, zoom: 14 },
  { name: 'Jayanagar', lat: 12.9250, lng: 77.5938, zoom: 15 },
];

export const MapViewPage: React.FC = () => {
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [categoryFilter, setCategoryFilter] = useState<ReportCategory | 'all'>('all');
  const [riskFilter, setRiskFilter] = useState<RiskLevel | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedReport, setSelectedReport] = useState<ReportItem | null>(null);
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number }>({
    lat: 12.9716,
    lng: 77.5946,
  });
  const [mapZoom, setMapZoom] = useState<number>(12);

  const navigate = useNavigate();

  useEffect(() => {
    const unsub = subscribeReports((data) => {
      setReports(data);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const filteredReports = reports.filter((r) => {
    if (categoryFilter !== 'all' && r.category !== categoryFilter) return false;
    if (riskFilter !== 'all' && r.risk_level !== riskFilter) return false;
    if (statusFilter !== 'all' && r.status !== statusFilter) return false;
    return true;
  });

  const handleJumpToArea = (area: (typeof QUICK_AREAS)[0]) => {
    setMapCenter({ lat: area.lat, lng: area.lng });
    setMapZoom(area.zoom);
  };

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 min-h-[calc(100vh-5rem)] lg:h-[calc(100vh-5rem)] flex flex-col font-sans">
      
      {/* Top Filter bar */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm mb-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-teal-800 text-white flex items-center justify-center font-bold">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-heading font-bold text-sm text-slate-900">
                Interactive Civic Incident Map
              </h2>
              <p className="text-[11px] text-slate-500 font-medium">
                Real-time geo-triage • {filteredReports.length} incidents in view
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value as any)}
              className="px-3 py-1.5 rounded-xl border border-slate-300 bg-slate-50 text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="all">All Categories</option>
              <option value="Pothole">Pothole</option>
              <option value="Garbage">Garbage</option>
              <option value="Streetlight">Streetlight</option>
              <option value="Water Leak">Water Leak</option>
              <option value="Drainage">Drainage</option>
              <option value="Stray Animal">Stray Animal</option>
            </select>

            <select
              value={riskFilter}
              onChange={(e) => setRiskFilter(e.target.value as any)}
              className="px-3 py-1.5 rounded-xl border border-slate-300 bg-slate-50 text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="all">All Risks</option>
              <option value="Critical">Critical</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-slate-300 bg-slate-50 text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="all">All Statuses</option>
              <option value="Reported">Reported</option>
              <option value="Acknowledged">Acknowledged</option>
              <option value="In Progress">In Progress</option>
              <option value="Resolved">Resolved</option>
            </select>
          </div>
        </div>

        {/* Quick Area Jump Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto text-[11px] pt-1 scrollbar-none border-t border-slate-100">
          <span className="text-slate-500 font-bold flex items-center gap-1 shrink-0">
            <Building2 className="w-3.5 h-3.5 text-teal-800" />
            <span>Ward Focus:</span>
          </span>
          {QUICK_AREAS.map((area) => (
            <button
              key={area.name}
              onClick={() => handleJumpToArea(area)}
              className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-teal-50 hover:text-teal-900 text-slate-700 border border-slate-200 transition-colors shrink-0 font-medium cursor-pointer"
            >
              {area.name}
            </button>
          ))}
        </div>
      </div>

      {/* Main Map + Sidebar Split view */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 min-h-0">
        
        {/* Map Container */}
        <div className="lg:col-span-8 h-full rounded-3xl overflow-hidden shadow-sm border border-slate-200 min-h-[350px]">
          <GoogleMapViewer
            reports={filteredReports}
            center={mapCenter}
            zoom={mapZoom}
            selectedReportId={selectedReport?.id}
            onSelectReport={(r) => setSelectedReport(r)}
            className="w-full h-full"
          />
        </div>

        {/* Sidebar list of reports */}
        <div className="lg:col-span-4 bg-white rounded-3xl border border-slate-200 shadow-sm p-4 flex flex-col min-h-0 overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-heading font-bold text-xs uppercase tracking-wider text-slate-500 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-teal-600 animate-pulse" />
              <span>Incidents in Scope ({filteredReports.length})</span>
            </h3>
            {selectedReport && (
              <button
                onClick={() => setSelectedReport(null)}
                className="text-[10px] text-teal-800 font-bold hover:underline cursor-pointer"
              >
                Clear Selection
              </button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
            {filteredReports.length === 0 ? (
              <div className="text-center py-10 text-slate-400 text-xs">
                No reports found matching filters.
              </div>
            ) : (
              filteredReports.map((report) => {
                const isSelected = selectedReport?.id === report.id;
                return (
                  <div
                    key={report.id}
                    onClick={() => {
                      setSelectedReport(report);
                      setMapCenter({ lat: report.latitude, lng: report.longitude });
                      setMapZoom(16);
                    }}
                    className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'border-teal-800 bg-teal-50/80 ring-2 ring-teal-700/20 shadow-xs'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-7 h-7 rounded-lg bg-teal-800/10 text-teal-800 flex items-center justify-center shrink-0">
                          <CategoryIcon category={report.category} className="w-3.5 h-3.5" />
                        </div>
                        <span className="font-bold text-xs text-slate-900 truncate">
                          {report.category}
                        </span>
                      </div>
                      <RiskBadge level={report.risk_level} size="sm" showIcon={false} />
                    </div>

                    <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed mb-2">
                      {report.description}
                    </p>

                    <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1.5 border-t border-slate-100">
                      <div className="flex items-center gap-1 truncate max-w-[65%]">
                        <MapPin className="w-3 h-3 text-teal-800 shrink-0" />
                        <span className="truncate">
                          {report.address || `${report.latitude.toFixed(3)}, ${report.longitude.toFixed(3)}`}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/report/${report.id}`);
                        }}
                        className="text-teal-800 hover:text-teal-900 font-bold flex items-center gap-1 text-[11px] cursor-pointer"
                      >
                        <span>Details</span>
                        <ChevronRight className="w-3 h-3" />
                      </button>
                    </div>

                    <div className="mt-2 pt-1.5 border-t border-slate-100 flex items-center justify-between">
                      <StatusBadge status={report.status} size="sm" />
                      <SlaBadge report={report} size="sm" />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>

    </div>
  );
};
