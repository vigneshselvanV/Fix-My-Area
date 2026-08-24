import React from 'react';
import { ComprehensiveCivicAnalytics } from '../../services/analytics';
import {
  ShieldCheck,
  Printer,
  X,
  Building2,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Layers,
  FileCheck,
  Sparkles,
  Star,
} from 'lucide-react';

interface ExecutiveAuditModalProps {
  analytics: ComprehensiveCivicAnalytics;
  isOpen: boolean;
  onClose: () => void;
}

export const ExecutiveAuditModal: React.FC<ExecutiveAuditModalProps> = ({
  analytics,
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs font-sans animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-4xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 relative max-h-[92vh] overflow-y-auto print:max-h-none print:shadow-none print:border-none print:p-0 print:m-0">
        
        {/* Modal Controls (Hidden in Print) */}
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-200 print:hidden">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-teal-800" />
            <span className="font-heading font-bold text-sm text-slate-900">
              Executive Civic Audit & Ward Scorecard Preview
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="py-2 px-4 rounded-xl bg-teal-800 hover:bg-teal-900 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Print / Export PDF</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Executive Document Area */}
        <div className="space-y-6 text-slate-800 print:text-black">
          
          {/* Municipal Letterhead */}
          <div className="flex items-start justify-between border-b-2 border-teal-800 pb-4">
            <div>
              <div className="flex items-center gap-2 text-teal-800 mb-1">
                <Building2 className="w-6 h-6" />
                <span className="font-heading font-black text-lg tracking-wider uppercase">
                  MUNICIPAL CORPORATION & CIVIC GOVERNANCE
                </span>
              </div>
              <h1 className="font-heading text-2xl font-bold text-slate-900">
                Monthly Civic Infrastructure Audit & Ward Performance Index
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Generated from FixMyArea Real-Time Telemetry Database • {currentDate}
              </p>
            </div>

            <div className="text-right shrink-0">
              <span className="text-[11px] font-mono font-bold bg-teal-50 text-teal-900 px-3 py-1 rounded-lg border border-teal-200 block">
                REF: CIVIC-AUDIT-2026-Q3
              </span>
              <span className="text-[10px] text-slate-400 mt-1 block">
                Official Public Record
              </span>
            </div>
          </div>

          {/* Executive Summary Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 print:border-slate-400">
              <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block">
                Total Tracked Issues
              </span>
              <span className="text-2xl font-extrabold text-slate-900 block mt-1 font-heading">
                {analytics.totalReports}
              </span>
              <span className="text-[10px] text-slate-500 mt-0.5 block">
                100% Geo-verified
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 print:border-slate-400">
              <span className="text-[10px] uppercase font-bold text-emerald-800 tracking-wider block">
                Resolution Clearance
              </span>
              <span className="text-2xl font-extrabold text-emerald-700 block mt-1 font-heading">
                {analytics.resolutionRatePct}%
              </span>
              <span className="text-[10px] text-emerald-800 mt-0.5 block">
                {analytics.resolvedReports} of {analytics.totalReports} resolved
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-teal-50 border border-teal-200 print:border-slate-400">
              <span className="text-[10px] uppercase font-bold text-teal-800 tracking-wider block">
                Overall SLA Compliance
              </span>
              <span className="text-2xl font-extrabold text-teal-800 block mt-1 font-heading">
                {analytics.overallSlaCompliancePct}%
              </span>
              <span className="text-[10px] text-teal-800 mt-0.5 block">
                Avg Response: {analytics.avgResolutionHours} hrs
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 print:border-slate-400">
              <span className="text-[10px] uppercase font-bold text-amber-800 tracking-wider block">
                Citizen Satisfaction
              </span>
              <span className="text-2xl font-extrabold text-amber-700 block mt-1 font-heading flex items-center gap-1">
                <Star className="w-5 h-5 fill-amber-400 text-amber-500" />
                <span>{analytics.citizenSatisfactionAvg} / 5</span>
              </span>
              <span className="text-[10px] text-amber-800 mt-0.5 block">
                Community ground audits
              </span>
            </div>
          </div>

          {/* Ward Health Performance Table */}
          <div className="space-y-2">
            <h3 className="font-heading font-bold text-sm text-slate-900 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-teal-800" />
              <span>Ward-Level Operational Scorecards</span>
            </h3>

            <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-200 font-bold text-slate-700">
                    <th className="py-2.5 px-3">Ward Name</th>
                    <th className="py-2.5 px-3 text-center">Health Grade</th>
                    <th className="py-2.5 px-3 text-center">Total Issues</th>
                    <th className="py-2.5 px-3 text-center">Resolved</th>
                    <th className="py-2.5 px-3 text-center">SLA Adherence</th>
                    <th className="py-2.5 px-3 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {analytics.wardScorecards.map((w) => (
                    <tr key={w.wardName} className="hover:bg-slate-50">
                      <td className="py-2.5 px-3 font-bold text-slate-900">{w.wardName}</td>
                      <td className="py-2.5 px-3 text-center">
                        <span className="px-2 py-0.5 rounded-md font-extrabold text-xs bg-teal-100 text-teal-900 border border-teal-300">
                          {w.healthGrade}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono">{w.totalIssues}</td>
                      <td className="py-2.5 px-3 text-center font-mono text-emerald-700 font-bold">
                        {w.resolvedIssues} ({w.resolutionRatePct}%)
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono">{w.slaAdherencePct}%</td>
                      <td className="py-2.5 px-3 text-right font-medium text-slate-700">
                        {w.status}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Chronic Hazard Hotspots & Action Directives */}
          <div className="space-y-2">
            <h3 className="font-heading font-bold text-sm text-slate-900 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <span>Identified Chronic Hazard Hotspots (Immediate Field Action Required)</span>
            </h3>

            <div className="space-y-2">
              {analytics.chronicHotspots.map((h) => (
                <div
                  key={h.id}
                  className="p-3 rounded-xl border border-slate-200 bg-slate-50 text-xs space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">{h.name}</span>
                    <span className="px-2 py-0.5 rounded bg-red-100 text-red-800 font-bold text-[10px]">
                      {h.highestRisk} Risk • {h.activeIncidentsCount} Active Issues
                    </span>
                  </div>
                  <p className="text-slate-600">
                    <strong className="text-slate-800">Action Directive:</strong> {h.recommendation}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Signatures & Certification */}
          <div className="pt-8 border-t border-slate-200 grid grid-cols-2 gap-8 text-xs text-slate-600">
            <div>
              <div className="h-10 border-b border-dashed border-slate-400 w-48 mb-1" />
              <p className="font-bold text-slate-900">Ward Superintending Engineer</p>
              <p className="text-[11px] text-slate-500">Public Works & Urban Engineering</p>
            </div>

            <div className="text-right flex flex-col items-end">
              <div className="h-10 border-b border-dashed border-slate-400 w-48 mb-1" />
              <p className="font-bold text-slate-900">Chief Municipal Commissioner</p>
              <p className="text-[11px] text-slate-500">Civic Operations & Citizen Grievances</p>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
