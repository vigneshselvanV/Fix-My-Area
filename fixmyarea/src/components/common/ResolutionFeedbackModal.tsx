import React, { useState } from 'react';
import { ReportItem } from '../../types';
import { submitResolutionFeedback } from '../../services/reports';
import { useAuth } from '../../context/AuthContext';
import {
  Star,
  CheckCircle2,
  AlertTriangle,
  Camera,
  X,
  Sparkles,
  Loader2,
  ThumbsUp,
  RotateCcw,
  ShieldCheck,
} from 'lucide-react';

interface ResolutionFeedbackModalProps {
  report: ReportItem;
  isOpen: boolean;
  onClose: () => void;
  onSubmitted?: () => void;
}

export const ResolutionFeedbackModal: React.FC<ResolutionFeedbackModalProps> = ({
  report,
  isOpen,
  onClose,
  onSubmitted,
}) => {
  const { user, profile } = useAuth();

  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [verifiedProperly, setVerifiedProperly] = useState<boolean>(true);
  const [comments, setComments] = useState<string>('');
  const [disputeReason, setDisputeReason] = useState<string>('');
  const [afterPhotoPreview, setAfterPhotoPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [success, setSuccess] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setAfterPhotoPreview(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setError('Please sign in to verify this resolution.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const isDispute = !verifiedProperly;
      await submitResolutionFeedback(report.id, {
        user_id: user.uid,
        user_name: profile?.name || user.displayName || 'Concerned Resident',
        rating: isDispute ? 1 : rating,
        verified_resolved: verifiedProperly,
        comments: comments.trim() || (isDispute ? 'Resolution disputed by citizen' : 'Resolution verified by community member'),
        after_photo_url: afterPhotoPreview || undefined,
        is_dispute: isDispute,
        dispute_reason: isDispute ? (disputeReason.trim() || 'Work incomplete or substandard.') : undefined,
      });

      setSuccess(true);
      if (onSubmitted) onSubmitted();
      setTimeout(() => {
        onClose();
      }, 2200);
    } catch (err: any) {
      console.error('Resolution verification error:', err);
      setError(err.message || 'Failed to submit verification.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs font-sans animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 relative max-h-[90vh] overflow-y-auto">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {success ? (
          <div className="py-8 text-center space-y-4 animate-in zoom-in-95">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto shadow-sm">
              <CheckCircle2 className="w-9 h-9" />
            </div>
            <div>
              <h3 className="font-heading text-xl font-bold text-slate-900">
                {verifiedProperly ? 'Resolution Confirmed!' : 'Dispute Submitted'}
              </h3>
              <p className="text-xs text-slate-600 mt-1 max-w-sm mx-auto">
                {verifiedProperly
                  ? 'Thank you for inspecting the ground reality! Your verification helps keep municipal accountability high.'
                  : 'Ticket has been re-opened and flagged for municipal supervisor re-inspection.'}
              </p>
            </div>

            {verifiedProperly && (
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-100 text-amber-900 text-xs font-bold border border-amber-300">
                <Sparkles className="w-4 h-4 text-amber-600" />
                <span>+30 Citizen Karma Points Awarded</span>
              </div>
            )}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Header */}
            <div>
              <div className="flex items-center gap-2 text-teal-800 font-bold text-xs uppercase tracking-wider mb-1">
                <ShieldCheck className="w-4 h-4" />
                <span>Citizen Ground-Check & Verification</span>
              </div>
              <h2 className="font-heading text-xl font-bold text-slate-900">
                Verify Municipal Resolution
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Issue: <span className="font-bold text-slate-800">{report.category}</span> at {report.address || 'Report Location'}
              </p>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Quality Verification Toggle */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700">
                Was this issue resolved satisfactorily in real life?
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setVerifiedProperly(true)}
                  className={`p-3 rounded-2xl border text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    verifiedProperly
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-800 shadow-2xs'
                      : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <ThumbsUp className="w-4 h-4 text-emerald-600" />
                  <span>Yes, Fixed Properly</span>
                </button>

                <button
                  type="button"
                  onClick={() => setVerifiedProperly(false)}
                  className={`p-3 rounded-2xl border text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    !verifiedProperly
                      ? 'border-red-500 bg-red-50 text-red-800 shadow-2xs'
                      : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <RotateCcw className="w-4 h-4 text-red-600" />
                  <span>No, Still Broken</span>
                </button>
              </div>
            </div>

            {/* Star Rating (if verified properly) */}
            {verifiedProperly ? (
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">
                  Rate Work Quality & Speed
                </label>
                <div className="flex items-center gap-2 py-1">
                  {[1, 2, 3, 4, 5].map((star) => {
                    const isFilled = (hoverRating !== null ? hoverRating : rating) >= star;
                    return (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(null)}
                        className="p-1 text-slate-300 hover:scale-110 transition-transform cursor-pointer"
                      >
                        <Star
                          className={`w-7 h-7 ${
                            isFilled
                              ? 'fill-amber-400 text-amber-400'
                              : 'fill-slate-100 text-slate-300'
                          }`}
                        />
                      </button>
                    );
                  })}
                  <span className="text-xs font-bold text-slate-600 ml-2 font-mono">
                    {rating} / 5 Stars
                  </span>
                </div>
              </div>
            ) : (
              /* Dispute Reason (if still broken) */
              <div className="space-y-1.5 p-3.5 bg-red-50/80 rounded-2xl border border-red-200">
                <label className="block text-xs font-bold text-red-900">
                  Reason for Disputing Resolution
                </label>
                <input
                  type="text"
                  value={disputeReason}
                  onChange={(e) => setDisputeReason(e.target.value)}
                  placeholder="e.g. Debris left behind / Patch caved in after 2 days"
                  className="w-full p-2.5 text-xs rounded-xl border border-red-300 bg-white focus:outline-none focus:ring-2 focus:ring-red-500 font-medium"
                  required={!verifiedProperly}
                />
                <p className="text-[11px] text-red-700">
                  ⚠️ This will automatically re-open the ticket to <strong>In Progress</strong> and escalate to municipal dispatch.
                </p>
              </div>
            )}

            {/* Optional "After" Photo Upload */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">
                {verifiedProperly ? 'Optional "After" Ground Photo Proof' : 'Ground Photo Proof of Remaining Issue'}
              </label>
              
              {afterPhotoPreview ? (
                <div className="relative rounded-2xl overflow-hidden border border-slate-200 max-h-40">
                  <img
                    src={afterPhotoPreview}
                    alt="After fix preview"
                    className="w-full h-40 object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => setAfterPhotoPreview(null)}
                    className="absolute top-2 right-2 p-1.5 bg-black/60 text-white rounded-full hover:bg-black/80"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-slate-300 rounded-2xl hover:border-teal-600 hover:bg-teal-50/30 transition-colors cursor-pointer text-center">
                  <Camera className="w-6 h-6 text-slate-400 mb-1" />
                  <span className="text-xs font-bold text-slate-700">
                    Upload Ground Photo Proof
                  </span>
                  <span className="text-[10px] text-slate-400">
                    JPEG, PNG, WebP up to 5MB
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoSelect}
                    className="hidden"
                  />
                </label>
              )}
            </div>

            {/* Citizen Feedback Comments */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">
                Ground Inspection Notes
              </label>
              <textarea
                rows={3}
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                placeholder="Share specific details about the repair quality..."
                className="w-full p-3 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="py-2.5 px-4 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={submitting}
                className={`py-2.5 px-5 rounded-xl text-white font-bold text-xs shadow-sm flex items-center gap-2 cursor-pointer disabled:opacity-50 ${
                  verifiedProperly
                    ? 'bg-teal-800 hover:bg-teal-900'
                    : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Submitting...</span>
                  </>
                ) : (
                  <>
                    {verifiedProperly ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                    ) : (
                      <RotateCcw className="w-4 h-4" />
                    )}
                    <span>{verifiedProperly ? 'Confirm Resolution' : 'Dispute & Re-open'}</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
};
