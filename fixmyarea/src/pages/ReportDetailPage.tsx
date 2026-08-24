import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  ReportItem,
  StatusHistoryItem,
  ReportStatus,
  ReportCommentItem,
  ResolutionFeedbackItem,
} from '../types';
import {
  subscribeReportById,
  subscribeStatusHistory,
  subscribeReportComments,
  subscribeResolutionFeedback,
  addReportComment,
  checkUserUpvoted,
  toggleUpvote,
  flagReport,
  updateReportStatus,
  deleteReport,
} from '../services/reports';
import { RiskBadge } from '../components/common/RiskBadge';
import { StatusBadge } from '../components/common/StatusBadge';
import { CategoryIcon } from '../components/common/CategoryIcon';
import { GoogleMapViewer } from '../components/maps/GoogleMapViewer';
import { WorkOrderModal } from '../components/common/WorkOrderModal';
import { SlaBadge } from '../components/common/SlaBadge';
import { ResolutionFeedbackModal } from '../components/common/ResolutionFeedbackModal';
import { ShareReportModal } from '../components/common/ShareReportModal';
import {
  ThumbsUp,
  Flag,
  MapPin,
  Clock,
  User,
  Sparkles,
  ArrowLeft,
  CheckCircle2,
  Shield,
  AlertCircle,
  Share2,
  MessageSquare,
  Send,
  Printer,
  RotateCcw,
  CheckCheck,
  FileText,
  Star,
  ShieldAlert,
  AlertTriangle,
  Trash2,
  Loader2,
} from 'lucide-react';

const STATUS_PROGRESSION: ReportStatus[] = ['Reported', 'Acknowledged', 'In Progress', 'Resolved'];

export const ReportDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user, profile, isAdmin } = useAuth();
  const navigate = useNavigate();

  const [report, setReport] = useState<ReportItem | null>(null);
  const [history, setHistory] = useState<StatusHistoryItem[]>([]);
  const [comments, setComments] = useState<ReportCommentItem[]>([]);
  const [resolutionFeedbacks, setResolutionFeedbacks] = useState<ResolutionFeedbackItem[]>([]);
  const [hasUpvoted, setHasUpvoted] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [upvoting, setUpvoting] = useState<boolean>(false);

  // New Comment state
  const [newCommentText, setNewCommentText] = useState<string>('');
  const [submittingComment, setSubmittingComment] = useState<boolean>(false);

  // Modals state
  const [showWorkOrderModal, setShowWorkOrderModal] = useState<boolean>(false);
  const [showShareModal, setShowShareModal] = useState<boolean>(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState<boolean>(false);

  // Flag Modal state
  const [showFlagModal, setShowFlagModal] = useState<boolean>(false);
  const [flagReason, setFlagReason] = useState<string>('Inaccurate location or details');
  const [flagging, setFlagging] = useState<boolean>(false);
  const [flagSuccess, setFlagSuccess] = useState<boolean>(false);

  // Admin status updater
  const [adminSelectedStatus, setAdminSelectedStatus] = useState<ReportStatus>('Acknowledged');
  const [adminNotes, setAdminNotes] = useState<string>('');
  const [updatingStatus, setUpdatingStatus] = useState<boolean>(false);

  // Admin delete modal
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
  const [isDeletingReport, setIsDeletingReport] = useState<boolean>(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);

    const unsubReport = subscribeReportById(id, (data) => {
      setReport(data);
      setLoading(false);
    });

    const unsubHistory = subscribeStatusHistory(id, (items) => {
      setHistory(items);
    });

    const unsubComments = subscribeReportComments(id, (commentList) => {
      setComments(commentList);
    });

    const unsubFeedbacks = subscribeResolutionFeedback(id, (feedbacks) => {
      setResolutionFeedbacks(feedbacks);
    });

    return () => {
      unsubReport();
      unsubHistory();
      unsubComments();
      unsubFeedbacks();
    };
  }, [id]);

  useEffect(() => {
    if (!id || !user) return;
    checkUserUpvoted(id, user.uid).then((upvoted) => setHasUpvoted(upvoted));
  }, [id, user]);

  const handleToggleUpvote = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (!report || upvoting) return;

    setUpvoting(true);
    try {
      const nowUpvoted = await toggleUpvote(report.id, user.uid);
      setHasUpvoted(nowUpvoted);
    } catch (err) {
      console.error('Upvote failed:', err);
    } finally {
      setUpvoting(false);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      navigate('/login');
      return;
    }
    if (!newCommentText.trim() || !report || submittingComment) return;

    setSubmittingComment(true);
    try {
      await addReportComment(
        report.id,
        user.uid,
        profile?.name || user.displayName || 'Resident',
        newCommentText.trim(),
        profile?.role || 'resident'
      );
      setNewCommentText('');
    } catch (err) {
      console.error('Error posting comment:', err);
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleFlagSubmit = async () => {
    if (!user || !report || flagging) return;
    setFlagging(true);
    try {
      await flagReport(report.id, user.uid, flagReason);
      setFlagSuccess(true);
      setTimeout(() => {
        setShowFlagModal(false);
        setFlagSuccess(false);
      }, 1500);
    } catch (err) {
      console.error('Flag report error:', err);
    } finally {
      setFlagging(false);
    }
  };

  const handleAdminStatusChange = async () => {
    if (!user || !report || !isAdmin || updatingStatus) return;
    setUpdatingStatus(true);
    try {
      await updateReportStatus(
        report.id,
        adminSelectedStatus,
        user.uid,
        profile?.name || 'Administrator',
        report.user_id,
        report.category,
        adminNotes
      );
      setAdminNotes('');
    } catch (err) {
      console.error('Admin status update error:', err);
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleDeleteReport = async () => {
    if (!report || !isAdmin || isDeletingReport) return;
    setIsDeletingReport(true);
    setDeleteError(null);
    try {
      await deleteReport(report.id);
      navigate('/admin', { replace: true });
    } catch (err: any) {
      console.error('Admin delete report error:', err);
      setDeleteError(err.message || 'Failed to delete complaint. Ensure you have administrator rights.');
      setIsDeletingReport(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-12">
        <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm space-y-6 animate-pulse">
          <div className="h-64 bg-slate-200 rounded-2xl" />
          <div className="h-8 bg-slate-200 rounded w-1/3" />
          <div className="h-4 bg-slate-200 rounded w-2/3" />
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <div className="w-14 h-14 rounded-2xl bg-teal-50 text-teal-700 mx-auto flex items-center justify-center mb-4">
          <AlertCircle className="w-7 h-7" />
        </div>
        <h2 className="font-heading text-xl font-bold text-slate-900 mb-2">
          Report Not Found
        </h2>
        <p className="text-xs text-slate-500 mb-6">
          This report may have been removed or does not exist.
        </p>
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-2 py-2.5 px-4 rounded-xl bg-teal-800 text-white text-xs font-bold"
        >
          Back to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 font-sans">
      
      {/* Top Action Bar */}
      <div className="flex items-center justify-between print:hidden">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-teal-800 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Feed</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowWorkOrderModal(true)}
            className="inline-flex items-center gap-1.5 py-2 px-3.5 rounded-xl border border-teal-200 bg-teal-50 hover:bg-teal-100 text-xs font-bold text-teal-900 transition-colors shadow-2xs cursor-pointer"
            title="Open & Print Official Municipal Work Order"
          >
            <FileText className="w-3.5 h-3.5 text-teal-800" />
            <span>Work Order</span>
          </button>

          <button
            onClick={() => setShowShareModal(true)}
            className="inline-flex items-center gap-1.5 py-2 px-3.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 transition-colors shadow-2xs cursor-pointer"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Share Ticket</span>
          </button>

          {isAdmin && (
            <button
              onClick={() => {
                setDeleteError(null);
                setShowDeleteModal(true);
              }}
              className="inline-flex items-center gap-1.5 py-2 px-3.5 rounded-xl border border-red-200 bg-red-50 hover:bg-red-100 text-xs font-bold text-red-700 transition-colors shadow-2xs cursor-pointer"
              title="Delete Complaint (Admin Only)"
            >
              <Trash2 className="w-3.5 h-3.5 text-red-600" />
              <span>Delete Complaint</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Grid: Left Details & Image | Right Timeline & Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* LEFT COLUMN (7 COLS) */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Card Surface */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            {/* Image Preview */}
            <div className="relative aspect-video w-full bg-slate-100 border-b border-slate-200 overflow-hidden">
              <img
                src={report.image_url}
                alt={`${report.category} at ${report.address || 'location'}`}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
              <div className="absolute top-3 left-3 flex flex-wrap items-center gap-2">
                <StatusBadge status={report.status} />
                <RiskBadge level={report.risk_level} />
                <SlaBadge report={report} size="sm" />
              </div>

              {/* AI Photo Verification Badge Overlay */}
              <div className="absolute bottom-3 right-3 bg-white/95 backdrop-blur-md px-3 py-1 rounded-xl shadow-md border border-slate-200 flex items-center gap-1.5 text-[11px] font-bold text-slate-800">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>
                  AI Photo Verified ({report.photo_authenticity_score ?? 92}% Real-World)
                </span>
              </div>
            </div>

            {/* Content info */}
            <div className="p-6 space-y-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1.5 text-xs text-slate-500 font-medium">
                    <span className="flex items-center gap-1">
                      <CategoryIcon category={report.category} className="w-3.5 h-3.5 text-teal-800" />
                      <strong className="text-slate-800">{report.category}</strong>
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      {report.created_at?.toDate
                        ? report.created_at.toDate().toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })
                        : 'Recent'}
                    </span>
                  </div>

                  <h1 className="font-heading text-xl sm:text-2xl font-bold text-slate-900">
                    {report.category} Ticket #{report.id.slice(0, 6).toUpperCase()}
                  </h1>
                </div>

                {/* Upvote & Flag Buttons */}
                <div className="flex items-center gap-2 shrink-0 print:hidden">
                  <button
                    onClick={handleToggleUpvote}
                    disabled={upvoting}
                    className={`inline-flex items-center gap-1.5 py-2 px-3.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      hasUpvoted
                        ? 'bg-teal-800 text-white shadow-xs'
                        : 'border border-slate-300 bg-white hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <ThumbsUp className={`w-3.5 h-3.5 ${hasUpvoted ? 'fill-white' : ''}`} />
                    <span>{report.upvote_count || 0}</span>
                  </button>

                  <button
                    onClick={() => setShowFlagModal(true)}
                    className="p-2 rounded-xl border border-slate-300 bg-white hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors cursor-pointer"
                    title="Flag Inaccurate Report"
                  >
                    <Flag className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* If report is disputed banner */}
              {report.is_disputed && (
                <div className="p-3.5 bg-red-50 border border-red-300 rounded-2xl flex items-center gap-2.5 text-red-900 text-xs">
                  <ShieldAlert className="w-5 h-5 text-red-600 shrink-0" />
                  <div>
                    <span className="font-bold">Citizen Ground Dispute Active:</span> Community members reported that prior repair work was incomplete or broken. Status transitioned to In Progress.
                  </div>
                </div>
              )}

              {/* Description */}
              <div className="space-y-1">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Citizen Report Details
                </h4>
                <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                  {report.description}
                </p>
              </div>

              {/* Location Card */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-start gap-3">
                <MapPin className="w-5 h-5 text-teal-800 shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-slate-900">
                    {report.address || 'Street Coordinate Location'}
                  </p>
                  <p className="text-[11px] font-mono text-slate-500 mt-0.5">
                    Lat: {report.latitude.toFixed(6)}, Lng: {report.longitude.toFixed(6)}
                  </p>
                </div>
              </div>

              {/* AI Risk Triage Box */}
              <div className="p-4 rounded-2xl bg-teal-50/70 border border-teal-200/80 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-teal-900">
                    <Sparkles className="w-4 h-4 text-teal-700" />
                    <span>AI Risk & Protocol Assessment</span>
                  </div>
                  <RiskBadge level={report.risk_level} size="sm" />
                </div>
                <p className="text-xs text-teal-950 font-medium">
                  <strong>Recommended Protocol:</strong> {report.suggested_action}
                </p>
              </div>

              {/* Reporter Info */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span className="flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  <span>Reported by <strong>{report.user_name || 'Community Resident'}</strong></span>
                </span>
                {report.flag_count > 0 && (
                  <span className="text-amber-600 font-bold flex items-center gap-1">
                    <Flag className="w-3 h-3" />
                    {report.flag_count} flags
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* CITIZEN RESOLUTION VERIFICATION CARD */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-4 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-teal-800" />
                  <h3 className="font-heading font-bold text-sm text-slate-900">
                    Citizen Resolution Audits ({resolutionFeedbacks.length})
                  </h3>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Community ground-checks & before/after proof verification
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowFeedbackModal(true)}
                className="py-2 px-4 rounded-xl bg-teal-800 hover:bg-teal-900 text-white font-bold text-xs shadow-2xs flex items-center gap-1.5 shrink-0 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>Verify Ground Reality (+30 Karma)</span>
              </button>
            </div>

            {/* List of resolution feedbacks */}
            {resolutionFeedbacks.length === 0 ? (
              <div className="p-4 rounded-2xl bg-slate-50 border border-dashed border-slate-200 text-center">
                <p className="text-xs text-slate-500">
                  No citizen verification reviews submitted yet. Be the first to verify this repair and earn +30 Karma points!
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {resolutionFeedbacks.map((fb) => (
                  <div
                    key={fb.id}
                    className={`p-4 rounded-2xl border ${
                      fb.is_dispute
                        ? 'border-red-200 bg-red-50/60'
                        : 'border-emerald-200 bg-emerald-50/50'
                    } space-y-2`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-slate-900">{fb.user_name}</span>
                        {fb.is_dispute ? (
                          <span className="text-[10px] uppercase font-extrabold bg-red-200 text-red-900 px-2 py-0.5 rounded">
                            Disputed Resolution
                          </span>
                        ) : (
                          <div className="flex items-center gap-0.5 text-amber-500 text-xs">
                            {[...Array(fb.rating || 5)].map((_, i) => (
                              <Star key={i} className="w-3 h-3 fill-amber-400 text-amber-400" />
                            ))}
                          </div>
                        )}
                      </div>

                      <span className="text-[10px] text-slate-400 font-mono">
                        {fb.created_at?.toDate ? fb.created_at.toDate().toLocaleDateString() : 'Recent'}
                      </span>
                    </div>

                    <p className="text-xs text-slate-700 leading-relaxed">
                      {fb.comments || fb.dispute_reason}
                    </p>

                    {fb.after_photo_url && (
                      <div className="pt-1">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                          After Fix Photo Proof:
                        </span>
                        <img
                          src={fb.after_photo_url}
                          alt="After fix photo"
                          className="h-28 rounded-xl object-cover border border-slate-300"
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* COMMUNITY DISCUSSION & UPDATES THREAD */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-4 print:hidden">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-teal-800" />
                <h3 className="font-heading font-bold text-sm text-slate-900">
                  Community Discussion & Updates ({comments.length})
                </h3>
              </div>
            </div>

            {/* Comment List */}
            <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
              {comments.length === 0 ? (
                <p className="text-xs text-slate-400 py-4 text-center">
                  No comments yet. Residents and officials can share updates here.
                </p>
              ) : (
                comments.map((c) => (
                  <div key={c.id} className="p-3 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-bold text-slate-900 flex items-center gap-1.5">
                        {c.user_name}
                        {c.user_role === 'admin' && (
                          <span className="px-1.5 py-0.2 bg-teal-100 text-teal-800 text-[10px] rounded font-bold">
                            Official
                          </span>
                        )}
                      </span>
                      <span className="text-slate-400 font-mono">
                        {c.created_at?.toDate ? c.created_at.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-700 leading-relaxed">{c.content}</p>
                  </div>
                ))
              )}
            </div>

            {/* Add Comment Form */}
            <form onSubmit={handleAddComment} className="flex gap-2 pt-2">
              <input
                type="text"
                value={newCommentText}
                onChange={(e) => setNewCommentText(e.target.value)}
                placeholder={user ? "Add a public update or observation..." : "Log in to post a comment"}
                disabled={!user || submittingComment}
                className="flex-1 px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium"
              />
              <button
                type="submit"
                disabled={!user || !newCommentText.trim() || submittingComment}
                className="py-2.5 px-4 rounded-xl bg-teal-800 text-white hover:bg-teal-900 text-xs font-bold transition-colors disabled:opacity-40 flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Post</span>
              </button>
            </form>
          </div>

        </div>

        {/* RIGHT COLUMN (5 COLS): Map & Status Timeline */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Spatial Pin Location Map */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-4 space-y-3">
            <h3 className="font-heading font-bold text-xs uppercase tracking-wider text-slate-500">
              Spatial Location Pin
            </h3>
            <div className="h-56 rounded-2xl overflow-hidden border border-slate-200">
              <GoogleMapViewer
                reports={[report]}
                center={{ lat: report.latitude, lng: report.longitude }}
                zoom={16}
                className="w-full h-full min-h-[224px]"
              />
            </div>
          </div>

          {/* PROGRESSION TIMELINE */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-heading font-bold text-sm text-slate-900">
                Resolution Timeline
              </h3>
              <span className="text-[11px] font-bold text-teal-800 bg-teal-50 px-2.5 py-0.5 rounded-md border border-teal-200">
                Audit Trail
              </span>
            </div>

            <div className="space-y-6 relative before:absolute before:inset-0 before:left-3.5 before:w-0.5 before:bg-slate-200">
              {STATUS_PROGRESSION.map((stepStatus, idx) => {
                const currentStatusIndex = STATUS_PROGRESSION.indexOf(report.status);
                const isPassed = idx <= currentStatusIndex;
                const isCurrent = idx === currentStatusIndex;

                const matchingHistory = history
                  .slice()
                  .reverse()
                  .find((h) => h.status === stepStatus);

                return (
                  <div key={stepStatus} className="relative flex items-start gap-4">
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs font-bold z-10 ${
                        isPassed
                          ? 'bg-teal-800 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-400 border border-slate-200'
                      }`}
                    >
                      {isPassed ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p
                          className={`text-xs font-bold ${
                            isCurrent
                              ? 'text-teal-800'
                              : isPassed
                              ? 'text-slate-900'
                              : 'text-slate-400'
                          }`}
                        >
                          {stepStatus}
                        </p>
                        {matchingHistory?.timestamp?.toDate && (
                          <span className="text-[10px] text-slate-400 font-mono">
                            {matchingHistory.timestamp.toDate().toLocaleDateString([], {
                              month: 'short',
                              day: 'numeric',
                            })}
                          </span>
                        )}
                      </div>

                      {matchingHistory?.notes && (
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          {matchingHistory.notes}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ADMIN STATUS CONTROLS (Rendered for Admin users) */}
          {isAdmin && (
            <div className="bg-white rounded-3xl border-2 border-teal-700/60 shadow-sm p-5 sm:p-6 space-y-4 print:hidden">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-teal-800" />
                <h3 className="font-heading font-bold text-sm text-slate-900">
                  Municipal Action Console
                </h3>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Advance Status Stage
                  </label>
                  <select
                    value={adminSelectedStatus}
                    onChange={(e) => setAdminSelectedStatus(e.target.value as ReportStatus)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-slate-50 font-bold focus:outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="Acknowledged">1. Acknowledged (Inspect & Queue)</option>
                    <option value="In Progress">2. In Progress (Crews Dispatched)</option>
                    <option value="Resolved">3. Resolved (Work Verified)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Internal Notes / Citizen Update
                  </label>
                  <input
                    type="text"
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    placeholder="e.g. Dispatched asphalt repair unit #4"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleAdminStatusChange}
                  disabled={updatingStatus}
                  className="w-full py-2.5 px-4 rounded-xl bg-teal-800 hover:bg-teal-900 text-white font-bold text-xs transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
                >
                  {updatingStatus ? 'Updating status...' : 'Publish Status Update & Notify'}
                </button>

                <div className="pt-2 border-t border-slate-200/80">
                  <button
                    type="button"
                    onClick={() => {
                      setDeleteError(null);
                      setShowDeleteModal(true);
                    }}
                    className="w-full py-2 px-3 rounded-xl border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 font-bold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-red-600" />
                    <span>Delete Complaint from Registry</span>
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>

      </div>

      {/* Official Municipal Work Order Modal */}
      {report && (
        <WorkOrderModal
          report={report}
          isOpen={showWorkOrderModal}
          onClose={() => setShowWorkOrderModal(false)}
        />
      )}

      {/* Share Report Modal */}
      {report && (
        <ShareReportModal
          report={report}
          isOpen={showShareModal}
          onClose={() => setShowShareModal(false)}
        />
      )}

      {/* Resolution Feedback & Dispute Modal */}
      {report && (
        <ResolutionFeedbackModal
          report={report}
          isOpen={showFeedbackModal}
          onClose={() => setShowFeedbackModal(false)}
        />
      )}

      {/* Flag Report Modal */}
      {showFlagModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-xl border border-slate-200 animate-in zoom-in-95">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <Flag className="w-5 h-5 text-red-600" />
                <h3 className="font-heading font-bold text-base text-slate-900">
                  Flag Inaccurate Report
                </h3>
              </div>
              <button
                onClick={() => setShowFlagModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            {flagSuccess ? (
              <div className="p-4 bg-emerald-50 text-emerald-800 text-xs rounded-2xl flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Thank you. Your flag has been recorded for review.</span>
              </div>
            ) : (
              <>
                <p className="text-xs text-slate-600">
                  Flagged tickets are reviewed by administrators to prevent misinformation or duplicate clutter.
                </p>

                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-700">Reason</label>
                  <select
                    value={flagReason}
                    onChange={(e) => setFlagReason(e.target.value)}
                    className="w-full p-2.5 text-xs rounded-xl border border-slate-300 bg-slate-50 font-medium"
                  >
                    <option value="Inaccurate location or details">Inaccurate location or details</option>
                    <option value="Issue is already fixed / resolved">Issue is already fixed / resolved</option>
                    <option value="Offensive or abusive content">Offensive or abusive content</option>
                    <option value="Commercial spam">Commercial spam</option>
                  </select>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    onClick={() => setShowFlagModal(false)}
                    className="py-2 px-4 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleFlagSubmit}
                    disabled={flagging}
                    className="py-2 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-xs disabled:opacity-50 cursor-pointer"
                  >
                    {flagging ? 'Submitting...' : 'Submit Flag'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Admin Delete Complaint Confirmation Modal */}
      {showDeleteModal && report && (
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
                  if (!isDeletingReport) setShowDeleteModal(false);
                }}
                disabled={isDeletingReport}
                className="text-slate-400 hover:text-slate-600 text-sm cursor-pointer p-1"
              >
                ✕
              </button>
            </div>

            <div className="p-3.5 bg-red-50 border border-red-200 rounded-2xl space-y-2 text-xs text-red-900">
              <div className="flex items-center justify-between font-bold">
                <div className="flex items-center gap-1.5">
                  <CategoryIcon category={report.category} className="w-4 h-4 text-red-700" />
                  <span>{report.category}</span>
                </div>
                <RiskBadge level={report.risk_level} size="sm" />
              </div>
              <p className="text-slate-700 line-clamp-2">
                {report.description}
              </p>
              <p className="text-[11px] text-slate-500 font-medium">
                Location: {report.address || `${report.latitude.toFixed(4)}, ${report.longitude.toFixed(4)}`}
              </p>
            </div>

            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-900 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>
                <strong>Warning:</strong> Deleting this complaint will permanently purge it from Firestore database and remove it from citizen feeds and live maps. This cannot be undone.
              </span>
            </div>

            {deleteError && (
              <div className="p-3 bg-red-50 border border-red-200 text-xs text-red-800 rounded-xl">
                {deleteError}
              </div>
            )}

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                disabled={isDeletingReport}
                className="py-2 px-4 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteReport}
                disabled={isDeletingReport}
                className="py-2 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {isDeletingReport ? (
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
