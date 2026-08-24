import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import { Lock, AlertCircle, Loader2, X, ShieldAlert } from 'lucide-react';

interface ReauthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => Promise<void> | void;
  title: string;
  description: string;
  actionLabel?: string;
  isDestructive?: boolean;
}

export const ReauthModal: React.FC<ReauthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  title,
  description,
  actionLabel = 'Verify & Proceed',
  isDestructive = false,
}) => {
  const { user } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!currentPassword) {
      setError('Please enter your current password.');
      return;
    }

    if (!user || !user.email) {
      setError('Unable to identify authenticated user.');
      return;
    }

    setLoading(true);
    try {
      // 1. Prompt and reauthenticate upfront with Firebase EmailAuthProvider
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);

      // 2. Perform the sensitive action
      await onSuccess();
      
      // 3. Close on success
      setCurrentPassword('');
      setError(null);
      onClose();
    } catch (err: any) {
      console.error('Re-authentication error:', err);
      if (
        err.code === 'auth/wrong-password' ||
        err.code === 'auth/invalid-credential' ||
        err.code === 'auth/user-mismatch'
      ) {
        setError('Incorrect password. Please verify your current password and try again.');
      } else if (err.code === 'auth/too-many-requests') {
        setError('Too many failed attempts. Please wait a few moments before trying again.');
      } else {
        setError(err.message || 'Re-authentication failed. Please check your credentials.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (loading) return;
    setCurrentPassword('');
    setError(null);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
      aria-labelledby="reauth-modal-title"
    >
      <div className="bg-white w-full max-w-md rounded-2xl border border-slate-200 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150 font-sans">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                isDestructive ? 'bg-red-50 text-red-700' : 'bg-teal-50 text-teal-800'
              }`}
            >
              {isDestructive ? (
                <ShieldAlert className="w-5 h-5" />
              ) : (
                <Lock className="w-5 h-5" />
              )}
            </div>
            <div>
              <h3 id="reauth-modal-title" className="font-heading font-bold text-sm text-slate-900">
                {title}
              </h3>
              <p className="text-[11px] text-slate-500">Security verification required</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            disabled={loading}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors disabled:opacity-40 cursor-pointer"
            aria-label="Close dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <p className="text-xs text-slate-600 leading-relaxed">
            {description}
          </p>

          {/* Inline Error Notice */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-start gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span className="leading-snug">{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Current Account Password
            </label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Enter current password"
              autoFocus
              disabled={loading}
              className="w-full p-2.5 rounded-xl border border-slate-300 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-teal-500 text-xs font-mono"
            />
            <p className="text-[10px] text-slate-400 mt-1">
              Signed in as: <strong className="text-slate-600">{user?.email}</strong>
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="py-2.5 px-4 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs transition-colors disabled:opacity-50 cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading || !currentPassword.trim()}
              className={`py-2.5 px-4 rounded-xl font-bold text-xs text-white transition-all shadow-xs flex items-center gap-1.5 disabled:opacity-50 cursor-pointer ${
                isDestructive
                  ? 'bg-red-600 hover:bg-red-700'
                  : 'bg-teal-800 hover:bg-teal-900'
              }`}
            >
              {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>{loading ? 'Verifying...' : actionLabel}</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
