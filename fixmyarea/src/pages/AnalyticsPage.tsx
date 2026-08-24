import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { computeLiveAnalytics, ComprehensiveCivicAnalytics } from '../services/analytics';
import { ReportCategory, RiskLevel } from '../types';
import { CategoryIcon } from '../components/common/CategoryIcon';
import { exportReportsToCsv } from '../services/sheetsExportStub';
import { ExecutiveAuditModal } from '../components/common/ExecutiveAuditModal';
import {
  BarChart3,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Download,
  Calendar,
  Layers,
  ArrowUpRight,
  ShieldCheck,
  RefreshCw,
  Building2,
  Star,
  FileCheck,
  Sparkles,
  MapPin,
} from 'lucide-react';

export const AnalyticsPage: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [data, setData] = useState<ComprehensiveCivicAnalytics | null>(null);
  const [exporting, setExporting] = useState<boolean>(false);
  const [exported, setExported] = useState<boolean>(false);
  const [showAuditModal, setShowAuditModal] = useState<boolean>(false);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const result = await computeLiveAnalytics();
      setData(result);
    } catch (err) {
      console.error('Failed to compute analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnalytics();
  }, []);

  const handleExportCsv = async () => {
    if (!data) return;
    setExporting(true);
    try {
      exportReportsToCsv(data.reportsList);
      setExported(true);
      setTimeout(() => setExported(false), 2500);
    } catch (err) {
      console.error('Export error:', err);
    } finally {
      setExporting(false);
    }
  };

  const CATEGORY_NAMES: ReportCategory[] = [
    'Pothole',
    'Garbage',
    'Streetlight',
    'Water Leak',
    'Drainage',
    'Stray Animal',
  ];

  const RISK_COLORS: Record<RiskLevel, { bg: string; text: string; bar: string }> = {
    Low: { bg: 'bg-emerald-50', text: 'text-emerald-800', bar: 'bg-emerald-600' },
    Medium: { bg: 'bg-amber-50', text: 'text-amber-800', bar: 'bg-amber-500' },
    High: { bg: 'bg-orange-50', text: 'text-orange-800', bar: 'bg-orange-600' },
    Critical: { bg: 'bg-red-50', text: 'text-red-900', bar: 'bg-red-600' },
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 font-sans">
      
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-teal-800 mb-1">
            <BarChart3 className="w-5 h-5" />
            <span className="text-xs font-bold uppercase tracking-wider">
              Civic Intelligence & Ward Diagnostics
            </span>
          </div>
          <h1 className="font-heading text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Municipal Operations & Ward Performance
          </h1>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Real-time telemetry on reported infrastructure hazards, dispatch resolution velocity, and ward-by-ward SLA compliance.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={loadAnalytics}
            disabled={loading}
            className="inline-flex items-center gap-1.5 py-2.5 px-3.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-colors shadow-2xs cursor-pointer"
            title="Refresh Live Data"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          {data && (
            <button
              onClick={() => setShowAuditModal(true)}
              className="inline-flex items-center gap-1.5 py-2.5 px-4 rounded-xl bg-teal-800 hover:bg-teal-900 text-white text-xs font-bold transition-colors shadow-2xs cursor-pointer"
            >
              <FileCheck className="w-4 h-4 text-teal-300" />
              <span>Monthly Audit Report</span>
            </button>
          )}

          <button
            onClick={handleExportCsv}
            disabled={exporting || !data}
            className={`inline-flex items-center gap-1.5 py-2.5 px-4 rounded-xl text-white text-xs font-bold transition-colors shadow-2xs disabled:opacity-50 cursor-pointer ${
              exported
                ? 'bg-emerald-600 hover:bg-emerald-700'
                : 'bg-slate-800 hover:bg-slate-900'
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            <span>
              {exporting ? 'Exporting...' : exported ? 'Dataset Downloaded!' : 'Export CSV'}
            </span>
          </button>
        </div>
      </div>

      {loading && !data ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-slate-100 rounded-3xl border border-slate-200" />
          ))}
        </div>
      ) : data ? (
        <>
          {/* Top KPI Bento Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Total Reports */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex items-start justify-between">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Total Tracked Issues
                </p>
                <h3 className="font-heading text-3xl font-black text-slate-900 mt-1">
                  {data.totalReports}
                </h3>
                <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1 font-medium">
                  <Layers className="w-3.5 h-3.5 text-teal-800" />
                  <span>Across 6 civic categories</span>
                </p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-800 flex items-center justify-center font-bold">
                <Layers className="w-6 h-6" />
              </div>
            </div>

            {/* Resolved */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex items-start justify-between">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">
                  Resolution Clearance
                </p>
                <h3 className="font-heading text-3xl font-black text-emerald-700 mt-1">
                  {data.resolutionRatePct}%
                </h3>
                <p className="text-[11px] text-slate-500 mt-1 font-medium">
                  {data.resolvedReports} of {data.totalReports} fixed
                </p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
                <CheckCircle2 className="w-6 h-6" />
              </div>
            </div>

            {/* SLA Compliance */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex items-start justify-between">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-teal-800">
                  SLA Adherence Rate
                </p>
                <h3 className="font-heading text-3xl font-black text-teal-800 mt-1">
                  {data.overallSlaCompliancePct}%
                </h3>
                <p className="text-[11px] text-slate-500 mt-1 font-medium">
                  Target turnaround achieved
                </p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-800 flex items-center justify-center font-bold">
                <Clock className="w-6 h-6" />
              </div>
            </div>

            {/* Citizen Satisfaction */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex items-start justify-between">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-amber-700">
                  Citizen Satisfaction
                </p>
                <h3 className="font-heading text-3xl font-black text-amber-700 mt-1 flex items-center gap-1.5">
                  <Star className="w-6 h-6 fill-amber-400 text-amber-400" />
                  <span>{data.citizenSatisfactionAvg} / 5</span>
                </h3>
                <p className="text-[11px] text-slate-500 mt-1 font-medium">
                  From ground audit reviews
                </p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                <ShieldCheck className="w-6 h-6" />
              </div>
            </div>

          </div>

          {/* WARD OPERATIONAL SCORECARDS */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-heading text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-teal-800" />
                  <span>Ward Performance & Health Index</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Comparative performance benchmarks across municipal administrative jurisdictions
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {data.wardScorecards.map((ward) => (
                <div
                  key={ward.wardName}
                  className="p-4 rounded-2xl border border-slate-200 bg-slate-50/60 hover:bg-slate-50 transition-colors space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-heading font-bold text-xs text-slate-900">
                        {ward.wardName}
                      </h4>
                      <span className="text-[11px] text-slate-500 font-medium">
                        {ward.totalIssues} total reported issues
                      </span>
                    </div>

                    <span
                      className={`px-2.5 py-0.5 rounded-lg text-xs font-black border ${
                        ward.healthGrade === 'A+' || ward.healthGrade === 'A'
                          ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                          : ward.healthGrade === 'B'
                          ? 'bg-teal-100 text-teal-900 border-teal-300'
                          : 'bg-amber-100 text-amber-900 border-amber-300'
                      }`}
                    >
                      {ward.healthGrade}
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] font-bold">
                      <span className="text-slate-600">Resolution Clearance</span>
                      <span className="text-emerald-700">{ward.resolutionRatePct}%</span>
                    </div>
                    <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-emerald-600 h-full rounded-full transition-all duration-500"
                        style={{ width: `${ward.resolutionRatePct}%` }}
                      />
                    </div>
                  </div>

                  {/* Micro stats */}
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200/80 text-[11px]">
                    <div>
                      <span className="text-slate-400 block">SLA Compliance</span>
                      <span className="font-bold text-teal-900">{ward.slaAdherencePct}%</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Critical Backlog</span>
                      <span
                        className={`font-bold ${
                          ward.criticalIssues > 0 ? 'text-red-600' : 'text-slate-700'
                        }`}
                      >
                        {ward.criticalIssues} issues
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* CHRONIC HOTSPOTS & ACTION PROTOCOLS */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-heading text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Flame className="w-5 h-5 text-red-600" />
                  <span>Identified Chronic Hazard Hotspots</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  High-frequency spatial clusters requiring root-cause engineering interventions
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {data.chronicHotspots.map((spot) => (
                <div
                  key={spot.id}
                  className="p-4 rounded-2xl border border-red-200 bg-red-50/40 space-y-2.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-heading font-bold text-xs text-slate-900 leading-tight">
                      {spot.name}
                    </span>
                    <span className="px-2 py-0.5 bg-red-100 text-red-900 font-extrabold text-[10px] rounded-md shrink-0">
                      {spot.activeIncidentsCount} Incidents
                    </span>
                  </div>

                  <div className="text-xs text-slate-700">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-0.5">
                      Preventive Protocol:
                    </span>
                    <p className="font-medium text-slate-800 leading-relaxed text-xs">
                      {spot.recommendation}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-red-200/60 flex items-center justify-between text-[11px] text-slate-500">
                    <span className="flex items-center gap-1">
                      <CategoryIcon category={spot.category} className="w-3.5 h-3.5 text-teal-800" />
                      <strong>{spot.category}</strong>
                    </span>
                    <span className="font-bold text-red-700">Priority Tier 1</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* TWO COLUMN GRID: Category Breakdown & Risk Distribution */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* Category Breakdown */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
              <h3 className="font-heading font-bold text-sm text-slate-900 flex items-center gap-2">
                <Layers className="w-4 h-4 text-teal-800" />
                <span>Issues by Civic Category</span>
              </h3>

              <div className="space-y-3">
                {CATEGORY_NAMES.map((cat) => {
                  const count = data.categoryBreakdown[cat] || 0;
                  const pct = data.totalReports > 0 ? Math.round((count / data.totalReports) * 100) : 0;
                  return (
                    <div key={cat} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2 font-bold text-slate-800">
                          <CategoryIcon category={cat} className="w-4 h-4 text-teal-800" />
                          <span>{cat}</span>
                        </div>
                        <span className="font-mono text-slate-600 font-bold">
                          {count} ({pct}%)
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-teal-800 h-full rounded-full transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Risk Level Distribution */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
              <h3 className="font-heading font-bold text-sm text-slate-900 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span>Hazard Severity Triage</span>
              </h3>

              <div className="grid grid-cols-2 gap-3">
                {(['Critical', 'High', 'Medium', 'Low'] as RiskLevel[]).map((level) => {
                  const count = data.riskBreakdown[level] || 0;
                  const pct = data.totalReports > 0 ? Math.round((count / data.totalReports) * 100) : 0;
                  const config = RISK_COLORS[level];

                  return (
                    <div
                      key={level}
                      className={`p-4 rounded-2xl border border-slate-200 ${config.bg} space-y-2`}
                    >
                      <div className="flex items-center justify-between">
                        <span className={`font-bold text-xs uppercase tracking-wider ${config.text}`}>
                          {level}
                        </span>
                        <span className="text-xs font-black font-mono text-slate-900">
                          {count}
                        </span>
                      </div>
                      <div className="w-full bg-white/70 h-2 rounded-full overflow-hidden">
                        <div
                          className={`${config.bar} h-full rounded-full transition-all duration-500`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <p className="text-[10px] text-slate-500 font-medium">
                        {pct}% of total incidents
                      </p>
                    </div>
                  );
                })}
              </div>

              {/* SLA Response Benchmark Note */}
              <div className="p-3.5 bg-teal-50/70 border border-teal-200/80 rounded-2xl text-xs text-teal-950 flex items-center gap-2.5">
                <Clock className="w-4 h-4 text-teal-800 shrink-0" />
                <span>
                  <strong>Municipal Target:</strong> Critical hazards require on-site emergency containment within 24 hours.
                </span>
              </div>
            </div>

          </div>

          {/* 7-DAY INGESTION VS RESOLUTION TREND */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-heading font-bold text-sm text-slate-900 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-teal-800" />
                <span>7-Day Telemetry Trend (New Ingestion vs Resolution)</span>
              </h3>
              <div className="flex items-center gap-4 text-xs font-bold">
                <span className="flex items-center gap-1 text-slate-600">
                  <span className="w-3 h-3 rounded-sm bg-teal-800" />
                  <span>Reported</span>
                </span>
                <span className="flex items-center gap-1 text-emerald-700">
                  <span className="w-3 h-3 rounded-sm bg-emerald-600" />
                  <span>Resolved</span>
                </span>
              </div>
            </div>

            <div className="overflow-x-auto pb-2">
              <div className="grid grid-cols-7 gap-2 pt-4 border-t border-slate-100 text-center min-w-[340px]">
                {data.recentTrends.map((trend) => (
                  <div key={trend.date} className="space-y-2">
                    <div className="flex items-end justify-center gap-1.5 h-28">
                      {/* Reported bar */}
                      <div
                        className="w-3.5 sm:w-4 bg-teal-800 rounded-t transition-all duration-300"
                        style={{
                          height: `${Math.min(100, Math.max(12, trend.reported * 18))}px`,
                        }}
                        title={`${trend.reported} reported on ${trend.date}`}
                      />
                      {/* Resolved bar */}
                      <div
                        className="w-3.5 sm:w-4 bg-emerald-600 rounded-t transition-all duration-300"
                        style={{
                          height: `${Math.min(100, Math.max(8, trend.resolved * 18))}px`,
                        }}
                        title={`${trend.resolved} resolved on ${trend.date}`}
                      />
                    </div>
                    <div className="text-[10px] sm:text-[11px] font-bold text-slate-600 truncate">{trend.date}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      ) : null}

      {/* Executive Civic Audit Report Modal */}
      {data && (
        <ExecutiveAuditModal
          analytics={data}
          isOpen={showAuditModal}
          onClose={() => setShowAuditModal(false)}
        />
      )}

    </div>
  );
};
