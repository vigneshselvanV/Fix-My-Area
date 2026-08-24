import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ReportItem, ReportStatus, RiskLevel, CivicBroadcastItem } from '../types';
import {
  subscribeReports,
  updateReportStatus,
  deleteReport,
  createCivicBroadcast,
  subscribeCivicBroadcasts,
  getReportSlaInfo,
} from '../services/reports';
import { exportReportsToCsv, triggerGoogleSheetsSync } from '../services/sheetsExportStub';

import { RiskBadge } from '../components/common/RiskBadge';
import { StatusBadge } from '../components/common/StatusBadge';
import { SlaBadge } from '../components/common/SlaBadge';
import { CategoryIcon } from '../components/common/CategoryIcon';
import { WorkOrderModal } from '../components/common/WorkOrderModal';
import {
  Shield,
  Download,
  FileSpreadsheet,
  AlertTriangle,
  Flag,
  CheckCircle2,
  BarChart3,
  Layers,
  ArrowRight,
  Info,
  Send,
  ExternalLink,
  RefreshCw,
  FileText,
  Radio,
  Sparkles,
  Megaphone,
  Trash2,
  Loader2,
} from 'lucide-react';

const STATUS_PROGRESSION: ReportStatus[] = ['Reported', 'Acknowledged', 'In Progress', 'Resolved'];

export const AdminPage: React.FC = () => {
  const { user, profile, isAdmin, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [reports, setReports] = useState<ReportItem[]>([]);
  const [broadcasts, setBroadcasts] = useState<CivicBroadcastItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'all' | 'flagged' | 'broadcasts' | 'analytics'>('all');
  const [statusFilter, setStatusFilter] = useState<ReportStatus | 'all'>('all');
  const [riskFilter, setRiskFilter] = useState<RiskLevel | 'all'>('all');
  const [updatingReportId, setUpdatingReportId] = useState<string | null>(null);
  const [showSheetsTooltip, setShowSheetsTooltip] = useState<boolean>(false);
  const [selectedWorkOrderReport, setSelectedWorkOrderReport] = useState<ReportItem | null>(null);

  // Delete Complaint Modal State
  const [deletingReport, setDeletingReport] = useState<ReportItem | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [deleteSuccessMsg, setDeleteSuccessMsg] = useState<string | null>(null);
  const [deleteErrorMsg, setDeleteErrorMsg] = useState<string | null>(null);

  // New Broadcast Form State
  const [newBroadcastTitle, setNewBroadcastTitle] = useState('');
  const [newBroadcastMessage, setNewBroadcastMessage] = useState('');
  const [newBroadcastSeverity, setNewBroadcastSeverity] = useState<'info' | 'warning' | 'alert'>('info');
  const [publishingBroadcast, setPublishingBroadcast] = useState(false);
  const [broadcastSuccess, setBroadcastSuccess] = useState<string | null>(null);

  // Protection
  useEffect(() => {
    if (!authLoading && !isAdmin) {
      navigate('/permission-denied', { replace: true });
    }
  }, [isAdmin, authLoading, navigate]);

  useEffect(() => {
    if (!isAdmin) return;
    setLoading(true);
    const unsubReports = subscribeReports((data) => {
      setReports(data);
      setLoading(false);
    });

    const unsubBroadcasts = subscribeCivicBroadcasts((items) => {
      setBroadcasts(items);
    });

    return () => {
      unsubReports();
      unsubBroadcasts();
    };
  }, [isAdmin]);

  const handleStatusAdvance = async (report: ReportItem, nextStatus: ReportStatus) => {
    if (!user) return;
    setUpdatingReportId(report.id);
    try {
      await updateReportStatus(
        report.id,
        nextStatus,
        user.uid,
        profile?.name || 'Municipal Admin',
        report.user_id,
        report.category,
        `Status transitioned to ${nextStatus} by dispatch authority.`
      );
    } catch (err) {
      console.error('Failed to update status:', err);
    } finally {
      setUpdatingReportId(null);
    }
  };

  const handleDeleteReport = async () => {
    if (!deletingReport || isDeleting) return;
    setIsDeleting(true);
    setDeleteErrorMsg(null);
    try {
      await deleteReport(deletingReport.id);
      setDeleteSuccessMsg(`Complaint #${deletingReport.id.slice(0, 6)} (${deletingReport.category}) was deleted successfully.`);
      setDeletingReport(null);
      setTimeout(() => setDeleteSuccessMsg(null), 3500);
    } catch (err: any) {
      console.error('Failed to delete report:', err);
      setDeleteErrorMsg(err.message || 'Failed to delete complaint. Please check your admin privileges.');
    } finally {
      setIsDeleting(false);
    }
  };

  const [csvDownloaded, setCsvDownloaded] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  const handleDownloadCsv = () => {
    setExportError(null);
    try {
      exportReportsToCsv(reports);
      setCsvDownloaded(true);
      setTimeout(() => setCsvDownloaded(false), 3000);
    } catch (err: any) {
      console.error('Export CSV error:', err);
      setExportError(err.message || 'Failed to generate CSV export.');
    }
  };

  const handlePublishBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBroadcastTitle.trim() || !newBroadcastMessage.trim()) return;

    setPublishingBroadcast(true);
    try {
      await createCivicBroadcast({
        title: newBroadcastTitle.trim(),
        message: newBroadcastMessage.trim(),
        severity: newBroadcastSeverity,
        active: true,
      });

      setNewBroadcastTitle('');
      setNewBroadcastMessage('');
      setBroadcastSuccess('District broadcast published successfully to all citizens!');
      setTimeout(() => setBroadcastSuccess(null), 3500);
    } catch (err) {
      console.error('Error publishing broadcast:', err);
    } finally {
      setPublishingBroadcast(false);
    }
  };

  // Sort reports by risk descending, then upvotes descending
  const riskWeight: Record<RiskLevel, number> = {
    Critical: 4,
    High: 3,
    Medium: 2,
    Low: 1,
  };

  const sortedReports = [...reports].sort((a, b) => {
    const riskDiff = (riskWeight[b.risk_level] || 0) - (riskWeight[a.risk_level] || 0);
    if (riskDiff !== 0) return riskDiff;
    return (b.upvote_count || 0) - (a.upvote_count || 0);
  });

  const flaggedReports = sortedReports.filter((r) => (r.flag_count || 0) >= 2);

  const breachedReports = reports.filter(
    (r) => r.status !== 'Resolved' && getReportSlaInfo(r).isBreached
  );

  const displayedReports = (
    activeTab === 'flagged'
      ? flaggedReports
      : activeTab === 'overdue'
      ? breachedReports
      : sortedReports
  ).filter((r) => {
    if (statusFilter !== 'all' && r.status !== statusFilter) return false;
    if (riskFilter !== 'all' && r.risk_level !== riskFilter) return false;
    return true;
  });

  // Analytics Rollup Calculations
  const categoryCounts = reports.reduce((acc, r) => {
    acc[r.category] = (acc[r.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const riskCounts = reports.reduce((acc, r) => {
    acc[r.risk_level] = (acc[r.risk_level] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const resolvedReports = reports.filter((r) => r.status === 'Resolved');
  const criticalCount = riskCounts['Critical'] || 0;
  const highCount = riskCounts['High'] || 0;

  if (authLoading || loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm animate-pulse space-y-4">
          <div className="h-8 bg-slate-200 rounded w-1/4" />
          <div className="h-64 bg-slate-100 rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 font-sans">
      
      {/* Header & Export Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-teal-800 text-white flex items-center justify-center font-bold">
              <Shield className="w-5 h-5" />
            </div>
            <h1 className="font-heading text-2xl font-bold text-slate-900">
              Municipal Triage & Dispatch Portal
            </h1>
          </div>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Prioritized risk management, official work orders, live broadcasts, and resolution audits
          </p>
        </div>

        {/* Export Action Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            to="/settings"
            className="inline-flex items-center gap-1.5 py-2 px-3.5 rounded-xl border border-purple-200 bg-purple-50 hover:bg-purple-100 text-purple-800 text-xs font-bold shadow-xs transition-colors whitespace-nowrap"
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-700" />
            <span>AI Model & Keys</span>
          </Link>

          <button
            onClick={handleDownloadCsv}
            className={`inline-flex items-center gap-1.5 py-2 px-3.5 rounded-xl border text-xs font-bold shadow-xs transition-colors whitespace-nowrap cursor-pointer ${
              csvDownloaded
                ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                : 'border-slate-300 bg-white hover:bg-slate-50 text-slate-700'
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            <span>{csvDownloaded ? 'CSV Downloaded!' : 'Download CSV'}</span>
          </button>

          {/* Sheets Export Button (Stubbed with Tooltip) */}
          <div className="relative">
            <button
              onMouseEnter={() => setShowSheetsTooltip(true)}
              onMouseLeave={() => setShowSheetsTooltip(false)}
              onClick={() => setShowSheetsTooltip(!showSheetsTooltip)}
              className="inline-flex items-center gap-1.5 py-2 px-3.5 rounded-xl bg-slate-100 border border-slate-300 text-slate-400 text-xs font-bold cursor-not-allowed whitespace-nowrap"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-slate-400" />
              <span>Export to Google Sheets</span>
              <Info className="w-3 h-3 text-slate-400" />
            </button>

            {showSheetsTooltip && (
              <div className="absolute right-0 top-full mt-2 w-72 p-3 bg-slate-900 text-slate-200 text-[11px] rounded-xl shadow-lg z-50 leading-relaxed animate-in fade-in">
                <p className="font-bold text-white mb-1">Architecture & Security Policy:</p>
                Direct Google Sheets Service Account export requires server-side private credentials and cannot run in-browser. Please use <strong>Download CSV</strong> or configure a Google Apps Script Webhook.
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Delete Success Alert Banner */}
      {deleteSuccessMsg && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-2xl flex items-center justify-between text-xs animate-in fade-in">
          <div className="flex items-center gap-2 font-bold">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{deleteSuccessMsg}</span>
          </div>
          <button
            onClick={() => setDeleteSuccessMsg(null)}
            className="text-emerald-700 hover:text-emerald-900 text-xs font-bold cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Delete Error Alert Banner */}
      {deleteErrorMsg && (
        <div className="p-3.5 bg-red-50 border border-red-200 text-red-900 rounded-2xl flex items-center justify-between text-xs animate-in fade-in">
          <div className="flex items-center gap-2 font-bold">
            <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{deleteErrorMsg}</span>
          </div>
          <button
            onClick={() => setDeleteErrorMsg(null)}
            className="text-red-700 hover:text-red-900 text-xs font-bold cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Bento Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-1">
            <span>Total Tickets</span>
            <Layers className="w-4 h-4 text-teal-800" />
          </div>
          <p className="font-heading text-3xl font-black text-slate-900">{reports.length}</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-red-600 text-[10px] font-bold uppercase tracking-widest mb-1">
            <span>Critical Hazards</span>
            <AlertTriangle className="w-4 h-4 text-red-600" />
          </div>
          <p className="font-heading text-3xl font-black text-red-600">{criticalCount + highCount}</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-emerald-600 text-[10px] font-bold uppercase tracking-widest mb-1">
            <span>Resolved</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="font-heading text-3xl font-black text-emerald-600">{resolvedReports.length}</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-amber-600 text-[10px] font-bold uppercase tracking-widest mb-1">
            <span>Flagged Reviews</span>
            <Flag className="w-4 h-4 text-amber-600" />
          </div>
          <p className="font-heading text-3xl font-black text-amber-600">{flaggedReports.length}</p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('all')}
          className={`py-2 px-4 rounded-xl text-xs font-bold transition-colors cursor-pointer shrink-0 ${
            activeTab === 'all'
              ? 'bg-teal-800 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          All Issues ({sortedReports.length})
        </button>

        <button
          onClick={() => setActiveTab('overdue')}
          className={`py-2 px-4 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer shrink-0 ${
            activeTab === 'overdue'
              ? 'bg-red-700 text-white shadow-xs'
              : 'text-red-700 hover:bg-red-50'
          }`}
        >
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>SLA Breached ({breachedReports.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('flagged')}
          className={`py-2 px-4 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer shrink-0 ${
            activeTab === 'flagged'
              ? 'bg-amber-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Flag className="w-3.5 h-3.5" />
          <span>Flagged Reviews ({flaggedReports.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('broadcasts')}
          className={`py-2 px-4 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer shrink-0 ${
            activeTab === 'broadcasts'
              ? 'bg-teal-800 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Megaphone className="w-3.5 h-3.5" />
          <span>Municipal Broadcasts ({broadcasts.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('analytics')}
          className={`py-2 px-4 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer shrink-0 ${
            activeTab === 'analytics'
              ? 'bg-teal-800 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <BarChart3 className="w-3.5 h-3.5" />
          <span>Analytics Rollup</span>
        </button>
      </div>

      {/* TAB 1 & 2: REPORT TABLE */}
      {activeTab !== 'analytics' && activeTab !== 'broadcasts' && (
        <div className="space-y-4">
          
          {/* Quick Filters */}
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-3 py-1.5 text-xs rounded-xl border border-slate-300 bg-white text-slate-700 font-medium"
            >
              <option value="all">All Statuses</option>
              <option value="Reported">Reported</option>
              <option value="Acknowledged">Acknowledged</option>
              <option value="In Progress">In Progress</option>
              <option value="Resolved">Resolved</option>
            </select>

            <select
              value={riskFilter}
              onChange={(e) => setRiskFilter(e.target.value as any)}
              className="px-3 py-1.5 text-xs rounded-xl border border-slate-300 bg-white text-slate-700 font-medium"
            >
              <option value="all">All Risk Levels</option>
              <option value="Critical">Critical</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>

          {/* Table Surface */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden w-full">
            <div className="overflow-x-auto w-full">
              <table className="w-full text-left border-collapse text-xs table-fixed min-w-[700px] sm:min-w-full">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="py-3 px-4 w-[32%]">Hazard & Area</th>
                    <th className="py-3 px-4 w-[16%]">Risk Triage</th>
                    <th className="py-3 px-4 w-[18%]">Status & Dispatch</th>
                    <th className="py-3 px-4 w-[12%]">Engagement</th>
                    <th className="py-3 px-4 text-right w-[22%]">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {displayedReports.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-slate-400">
                        No reports matching filter criteria.
                      </td>
                    </tr>
                  ) : (
                    displayedReports.map((report) => {
                      const currentIdx = STATUS_PROGRESSION.indexOf(report.status);
                      const nextStatus =
                        currentIdx < STATUS_PROGRESSION.length - 1
                          ? STATUS_PROGRESSION[currentIdx + 1]
                          : null;

                      return (
                        <tr key={report.id} className="hover:bg-slate-50/60 transition-colors">
                          {/* Col 1: Category & Details */}
                          <td className="py-3 px-4 align-top">
                            <div className="flex items-start gap-2.5 min-w-0">
                              <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0 mt-0.5">
                                <CategoryIcon category={report.category} className="w-4 h-4 text-teal-800" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <Link
                                  to={`/report/${report.id}`}
                                  className="font-bold text-slate-900 hover:text-teal-800 hover:underline block truncate text-xs"
                                  title={`${report.category} - ${report.address || 'Street Pin'}`}
                                >
                                  {report.category} - {report.address || 'Street Pin'}
                                </Link>
                                <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5" title={report.description}>
                                  {report.description}
                                </p>
                              </div>
                            </div>
                          </td>

                          {/* Col 2: Risk Level */}
                          <td className="py-3 px-4 align-top">
                            <div className="space-y-1 min-w-0">
                              <RiskBadge level={report.risk_level} size="sm" />
                              <p className="text-[10px] text-slate-500 font-mono truncate" title={report.suggested_action}>
                                AI: {report.suggested_action?.slice(0, 20)}...
                              </p>
                            </div>
                          </td>

                          {/* Col 3: Status & SLA */}
                          <td className="py-3 px-4 align-top">
                            <div className="space-y-1.5 min-w-0">
                              <StatusBadge status={report.status} size="sm" />
                              <div>
                                <SlaBadge report={report} size="sm" />
                              </div>
                            </div>
                          </td>

                          {/* Col 4: Engagement */}
                          <td className="py-3 px-4 align-top">
                            <div className="flex flex-wrap items-center gap-2 text-slate-600 font-bold text-xs">
                              <span className="whitespace-nowrap">👍 {report.upvote_count || 0}</span>
                              {report.flag_count > 0 && (
                                <span className="text-red-600 font-bold flex items-center gap-1 whitespace-nowrap">
                                  <Flag className="w-3 h-3" />
                                  {report.flag_count}
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Col 5: Advance Status / Work Order */}
                          <td className="py-3 px-4 align-top text-right">
                            <div className="flex flex-wrap items-center justify-end gap-1">
                              {/* Create Work Order Dispatch Button */}
                              <button
                                type="button"
                                onClick={() => setSelectedWorkOrderReport(report)}
                                className="py-1 px-2 rounded-lg border border-teal-600 bg-teal-50 hover:bg-teal-100 text-teal-900 font-bold text-[11px] flex items-center gap-1 transition-colors shadow-2xs cursor-pointer whitespace-nowrap"
                                title="Generate Formal Municipal Work Order Dispatch"
                              >
                                <FileText className="w-3 h-3 text-teal-800" />
                                <span className="hidden xl:inline">Work Order</span>
                              </button>

                              {nextStatus && (
                                <button
                                  type="button"
                                  onClick={() => handleStatusAdvance(report, nextStatus)}
                                  disabled={updatingReportId === report.id}
                                  className="py-1 px-2 rounded-lg bg-teal-800 hover:bg-teal-900 text-white font-bold text-[11px] flex items-center gap-1 transition-colors shadow-2xs disabled:opacity-50 cursor-pointer whitespace-nowrap"
                                >
                                  <span>{updatingReportId === report.id ? '...' : nextStatus}</span>
                                  <ArrowRight className="w-3 h-3" />
                                </button>
                              )}

                              <Link
                                to={`/report/${report.id}`}
                                className="p-1 text-slate-400 hover:text-teal-800 rounded-lg hover:bg-slate-100 transition-colors"
                                title="Open Full Details"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                              </Link>

                              {/* Delete Complaint Button */}
                              <button
                                type="button"
                                onClick={() => {
                                  setDeleteErrorMsg(null);
                                  setDeletingReport(report);
                                }}
                                className="p-1 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
                                title="Delete Complaint (Admin Only)"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: MUNICIPAL BROADCASTS COMPOSER */}
      {activeTab === 'broadcasts' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left: Compose Form (col-span-5) */}
          <div className="lg:col-span-5 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div>
              <div className="flex items-center gap-2 text-teal-800 font-bold text-sm mb-1">
                <Megaphone className="w-4 h-4" />
                <span>Publish Municipal Broadcast</span>
              </div>
              <p className="text-xs text-slate-500">
                Broadcast instant emergency advisories, road repair schedules, or flood alerts to all citizen feeds.
              </p>
            </div>

            {broadcastSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{broadcastSuccess}</span>
              </div>
            )}

            <form onSubmit={handlePublishBroadcast} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Advisory Title
                </label>
                <input
                  type="text"
                  value={newBroadcastTitle}
                  onChange={(e) => setNewBroadcastTitle(e.target.value)}
                  placeholder="e.g. Monsoon Storm Drain Clearance Drive"
                  className="w-full p-2.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Broadcast Message & Guidance
                </label>
                <textarea
                  rows={4}
                  value={newBroadcastMessage}
                  onChange={(e) => setNewBroadcastMessage(e.target.value)}
                  placeholder="e.g. Municipal crews are patrolling Indiranagar and Koramangala wards. Please report any severe water-logging or fallen electrical lines..."
                  className="w-full p-2.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Alert Severity
                </label>
                <select
                  value={newBroadcastSeverity}
                  onChange={(e) => setNewBroadcastSeverity(e.target.value as any)}
                  className="w-full p-2.5 text-xs rounded-xl border border-slate-300 bg-white"
                >
                  <option value="info">Info / General Notice</option>
                  <option value="warning">Warning / Ward Advisory</option>
                  <option value="alert">Critical Emergency Alert</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={publishingBroadcast || !newBroadcastTitle.trim()}
                className="w-full py-2.5 rounded-xl bg-teal-800 hover:bg-teal-900 text-white font-bold text-xs shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{publishingBroadcast ? 'Publishing...' : 'Broadcast to City'}</span>
              </button>
            </form>
          </div>

          {/* Right: Active Broadcasts List (col-span-7) */}
          <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-heading font-bold text-sm text-slate-900">
              Active Municipal Broadcasts ({broadcasts.length})
            </h3>

            <div className="space-y-3">
              {broadcasts.length === 0 ? (
                <p className="text-xs text-slate-400 py-8 text-center">
                  No active broadcasts. Publish your first advisory using the form.
                </p>
              ) : (
                broadcasts.map((b) => (
                  <div
                    key={b.id}
                    className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-1.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-teal-600 animate-pulse" />
                        {b.title}
                      </span>
                      <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-md bg-teal-100 text-teal-800">
                        {b.severity}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      {b.message}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>
      )}

      {/* TAB 4: ANALYTICS ROLLUP */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Category Breakdown */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <h3 className="font-heading font-bold text-sm text-slate-900">
                Issues by Category
              </h3>
              <div className="space-y-3">
                {Object.entries(categoryCounts).map(([cat, countVal]) => {
                  const count = Number(countVal) || 0;
                  const percent = reports.length ? Math.round((count / reports.length) * 100) : 0;
                  return (
                    <div key={cat} className="space-y-1">
                      <div className="flex justify-between text-xs font-medium">
                        <span className="text-slate-700">{cat}</span>
                        <span className="text-slate-500 font-mono">{count} ({percent}%)</span>
                      </div>
                      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-teal-800 rounded-full"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Risk Distribution */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <h3 className="font-heading font-bold text-sm text-slate-900">
                Risk Distribution
              </h3>
              <div className="space-y-3">
                {(['Critical', 'High', 'Medium', 'Low'] as RiskLevel[]).map((level) => {
                  const count = riskCounts[level] || 0;
                  const percent = reports.length ? Math.round((count / reports.length) * 100) : 0;
                  const barColor =
                    level === 'Critical'
                      ? 'bg-red-600'
                      : level === 'High'
                      ? 'bg-orange-500'
                      : level === 'Medium'
                      ? 'bg-amber-500'
                      : 'bg-emerald-500';

                  return (
                    <div key={level} className="space-y-1">
                      <div className="flex justify-between text-xs font-bold">
                        <span className="text-slate-700">{level} Hazard</span>
                        <span className="text-slate-900 font-mono">{count} ({percent}%)</span>
                      </div>
                      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${barColor}`}
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Official Municipal Work Order Modal */}
      {selectedWorkOrderReport && (
        <WorkOrderModal
          report={selectedWorkOrderReport}
          isOpen={!!selectedWorkOrderReport}
          onClose={() => setSelectedWorkOrderReport(null)}
        />
      )}

      {/* Delete Complaint Confirmation Modal */}
      {deletingReport && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200 animate-in zoom-in-95">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-red-100 text-red-700 flex items-center justify-center shrink-0 font-bold">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-heading font-bold text-base text-slate-900">
                    Delete Civic Complaint
                  </h3>
                  <p className="text-xs text-slate-500">
                    Permanent municipal purge
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (!isDeleting) setDeletingReport(null);
                }}
                disabled={isDeleting}
                className="text-slate-400 hover:text-slate-600 text-sm cursor-pointer p-1"
              >
                ✕
              </button>
            </div>

            <div className="p-3.5 bg-red-50 border border-red-200 rounded-2xl space-y-2 text-xs text-red-900">
              <div className="flex items-center justify-between font-bold">
                <div className="flex items-center gap-1.5">
                  <CategoryIcon category={deletingReport.category} className="w-4 h-4 text-red-700" />
                  <span>{deletingReport.category}</span>
                </div>
                <RiskBadge level={deletingReport.risk_level} size="sm" />
              </div>
              <p className="text-slate-700 line-clamp-2">
                {deletingReport.description}
              </p>
              <p className="text-[11px] text-slate-500 font-medium">
                Location: {deletingReport.address || `${deletingReport.latitude.toFixed(4)}, ${deletingReport.longitude.toFixed(4)}`}
              </p>
            </div>

            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-900 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>
                <strong>Warning:</strong> Deleting this complaint will permanently remove it from the municipal registry, citizen feeds, and map layers. This action cannot be undone.
              </span>
            </div>

            {deleteErrorMsg && (
              <div className="p-3 bg-red-50 border border-red-200 text-xs text-red-800 rounded-xl">
                {deleteErrorMsg}
              </div>
            )}

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setDeletingReport(null)}
                disabled={isDeleting}
                className="py-2 px-4 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteReport}
                disabled={isDeleting}
                className="py-2 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Permanently</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
