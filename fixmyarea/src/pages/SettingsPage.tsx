import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { updatePassword, deleteUser } from 'firebase/auth';
import { ReauthModal } from '../components/common/ReauthModal';
import {
  DEFAULT_OPENROUTER_KEY,
  DEFAULT_OPENROUTER_MODEL,
  assessReportRisk,
} from '../services/riskAssessment';
import {
  Key,
  Bell,
  Lock,
  LogOut,
  Shield,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Bot,
  Play,
  Trash2,
} from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { user, profile, isAdmin, updateUserProfile, logout } = useAuth();
  const navigate = useNavigate();

  // AI API Keys state (Configurable by Admin Only)
  const [openRouterKey, setOpenRouterKey] = useState<string>(
    localStorage.getItem('fixmyarea_openrouter_key') || DEFAULT_OPENROUTER_KEY
  );
  const [selectedModel, setSelectedModel] = useState<string>(
    localStorage.getItem('fixmyarea_openrouter_model') || DEFAULT_OPENROUTER_MODEL
  );
  const [keySaved, setKeySaved] = useState<boolean>(false);

  // Test AI Assessment state
  const [testingAi, setTestingAi] = useState<boolean>(false);
  const [aiTestResult, setAiTestResult] = useState<any>(null);

  // Notification Preferences
  const [inAppNotifs, setInAppNotifs] = useState<boolean>(
    profile?.notification_prefs?.in_app ?? true
  );
  const [emailNotifs, setEmailNotifs] = useState<boolean>(
    profile?.notification_prefs?.email ?? true
  );
  const [savingPrefs, setSavingPrefs] = useState<boolean>(false);
  const [prefsSaved, setPrefsSaved] = useState<boolean>(false);

  // Password Change State
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<boolean>(false);

  // Re-auth Modals State
  const [showPasswordReauthModal, setShowPasswordReauthModal] = useState<boolean>(false);
  const [showDeleteAccountModal, setShowDeleteAccountModal] = useState<boolean>(false);
  const [accountActionMessage, setAccountActionMessage] = useState<string | null>(null);

  // Role Toggle for College Demo
  const [changingRole, setChangingRole] = useState<boolean>(false);

  useEffect(() => {
    if (profile?.notification_prefs) {
      setInAppNotifs(profile.notification_prefs.in_app);
      setEmailNotifs(profile.notification_prefs.email);
    }
  }, [profile]);

  const handleSaveKeys = (e: React.FormEvent) => {
    e.preventDefault();

    if (openRouterKey.trim()) {
      localStorage.setItem('fixmyarea_openrouter_key', openRouterKey.trim());
    } else {
      localStorage.removeItem('fixmyarea_openrouter_key');
    }

    if (selectedModel.trim()) {
      localStorage.setItem('fixmyarea_openrouter_model', selectedModel.trim());
    } else {
      localStorage.removeItem('fixmyarea_openrouter_model');
    }

    setKeySaved(true);
    setTimeout(() => setKeySaved(false), 2500);
  };

  const handleTestAi = async () => {
    setTestingAi(true);
    setAiTestResult(null);
    try {
      const result = await assessReportRisk(
        'Water Leak',
        'Large main water pipe burst near market intersection, flooding the street and creating traffic hazard.',
        1,
        'Main Market'
      );
      setAiTestResult(result);
    } catch (err: any) {
      setAiTestResult({ error: err.message || 'Test failed' });
    } finally {
      setTestingAi(false);
    }
  };

  const handleSaveNotificationPrefs = async () => {
    setSavingPrefs(true);
    try {
      await updateUserProfile({
        notification_prefs: {
          in_app: inAppNotifs,
          email: emailNotifs,
        },
      });
      setPrefsSaved(true);
      setTimeout(() => setPrefsSaved(false), 2000);
    } catch (err) {
      console.error('Error saving notification preferences:', err);
    } finally {
      setSavingPrefs(false);
    }
  };

  const handleRoleToggle = async () => {
    if (!profile) return;
    setChangingRole(true);
    const newRole = profile.role === 'admin' ? 'resident' : 'admin';
    try {
      await updateUserProfile({ role: newRole });
    } catch (err) {
      console.error('Error updating role:', err);
    } finally {
      setChangingRole(false);
    }
  };

  // Triggered when clicking "Update Password" form button
  const handleInitiatePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(false);

    if (newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match.');
      return;
    }

    // Open Reauth Modal to verify current password upfront
    setShowPasswordReauthModal(true);
  };

  // Executed only after ReauthModal verifies the current password with Firebase
  const handlePerformPasswordUpdate = async () => {
    if (!user) return;
    try {
      await updatePassword(user, newPassword);
      setPasswordSuccess(true);
      setNewPassword('');
      setConfirmPassword('');
      setPasswordError(null);
    } catch (err: any) {
      setPasswordError(err.message || 'Failed to update password.');
      throw err;
    }
  };

  // Executed only after ReauthModal verifies the current password with Firebase
  const handlePerformAccountDeletion = async () => {
    if (!user) return;
    try {
      await deleteUser(user);
      navigate('/login');
    } catch (err: any) {
      setAccountActionMessage(err.message || 'Failed to delete account.');
      throw err;
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 font-sans">
      
      <div>
        <h1 className="font-heading text-2xl font-bold text-slate-900">
          Account & Preferences
        </h1>
        <p className="text-xs text-slate-500 font-medium mt-1">
          Manage your account profile, notification preferences, security credentials, and platform roles.
        </p>
      </div>

      {/* User Info Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex items-center justify-between">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-full bg-teal-100 border border-teal-200 flex items-center justify-center text-teal-800 font-bold text-base shadow-xs">
            {profile?.name ? profile.name[0].toUpperCase() : 'U'}
          </div>
          <div>
            <h2 className="font-heading font-bold text-sm text-slate-900">
              {profile?.name || user?.displayName || 'Citizen'}
            </h2>
            <p className="text-xs text-slate-500">{profile?.email || user?.email}</p>
          </div>
        </div>

        <span
          className={`text-xs font-bold px-3 py-1 rounded-full ${
            profile?.role === 'admin'
              ? 'bg-purple-100 text-purple-800 border border-purple-200'
              : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
          }`}
        >
          {profile?.role === 'admin' ? '🛡️ Administrator' : '🏡 Citizen Resident'}
        </span>
      </div>

      {/* 1. ADMIN-ONLY: AI Model & API Key Configuration */}
      {isAdmin ? (
        <div className="bg-white rounded-2xl border border-purple-200 shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Key className="w-5 h-5 text-purple-600" />
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-heading font-bold text-sm text-slate-900">
                    AI Risk Triage & Model Configuration
                  </h2>
                  <span className="text-[10px] font-bold bg-purple-100 text-purple-800 px-2 py-0.5 rounded-md">
                    Admin Exclusive
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Configure the OpenRouter model and key used by all citizens for automated hazard scoring, photo verification, and the citizen chat assistant.
                </p>
              </div>
            </div>
          </div>

          {keySaved && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>AI model & key configuration updated successfully for all citizens.</span>
            </div>
          )}

          <form onSubmit={handleSaveKeys} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                <Bot className="w-3.5 h-3.5 text-purple-600" />
                <span>OpenRouter AI Model</span>
              </label>
              <input
                type="text"
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                placeholder="deepseek/deepseek-chat"
                className="w-full p-2.5 rounded-xl border border-slate-300 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono text-xs font-bold text-slate-800"
              />
              <p className="text-[10px] text-slate-400 mt-1">
                Active model: <strong className="text-purple-700 font-mono">{selectedModel}</strong>. Used across all resident triage and chatbot queries.
              </p>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                <span>OpenRouter API Key</span>
              </label>
              <input
                type="password"
                value={openRouterKey}
                onChange={(e) => setOpenRouterKey(e.target.value)}
                placeholder="sk-or-v1-..."
                className="w-full p-2.5 rounded-xl border border-slate-300 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono text-xs"
              />
              <p className="text-[10px] text-slate-400 mt-1">
                Configured centrally by municipal administrator. Citizens seamlessly use this key without needing their own credentials.
              </p>
            </div>

            <div className="flex items-center gap-3 pt-1">
              <button
                type="submit"
                className="py-2.5 px-4 rounded-xl bg-purple-700 text-white font-bold hover:bg-purple-800 transition-colors shadow-xs cursor-pointer"
              >
                Save System AI Settings
              </button>

              <button
                type="button"
                onClick={handleTestAi}
                disabled={testingAi}
                className="py-2.5 px-3.5 rounded-xl border border-purple-200 bg-purple-50 hover:bg-purple-100 text-purple-800 font-bold transition-colors flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
              >
                <Play className={`w-3.5 h-3.5 ${testingAi ? 'animate-spin' : ''}`} />
                <span>{testingAi ? 'Testing Triage...' : 'Test AI Connection'}</span>
              </button>
            </div>
          </form>

          {aiTestResult && (
            <div className="mt-3 p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1 text-xs">
              <p className="font-bold text-slate-900 flex items-center gap-1.5">
                <span>AI Connection Verification Result</span>
                <span className="text-[10px] text-slate-400 font-normal">
                  (Source: {aiTestResult.source || 'OpenRouter / Fallback'})
                </span>
              </p>
              {aiTestResult.error ? (
                <p className="text-red-600">{aiTestResult.error}</p>
              ) : (
                <div className="space-y-1 text-slate-700">
                  <p>
                    <strong>Risk Level:</strong> <span className="font-bold text-teal-800">{aiTestResult.risk_level}</span>
                  </p>
                  <p>
                    <strong>Suggested Action:</strong> {aiTestResult.suggested_action}
                  </p>
                  <p>
                    <strong>Rationale:</strong> {aiTestResult.rationale}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        /* Resident Informational AI Status Box */
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700 shrink-0">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-heading font-bold text-xs text-slate-900">
                FixMyArea AI Services: Active
              </h3>
              <p className="text-[11px] text-slate-500">
                Automated risk scoring and the citizen assistant are centrally managed by municipal administrators.
              </p>
            </div>
          </div>
          <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-full text-[10px] font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            Online
          </span>
        </div>
      )}

      {/* 2. Notification Preferences */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <Bell className="w-5 h-5 text-teal-700" />
          <div>
            <h2 className="font-heading font-bold text-sm text-slate-900">
              Notification Preferences
            </h2>
            <p className="text-[11px] text-slate-500">
              Control which municipal status updates and advisories you receive.
            </p>
          </div>
        </div>

        {prefsSaved && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Notification preferences updated.</span>
          </div>
        )}

        <div className="space-y-3 text-xs">
          <label className="flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
            <div>
              <p className="font-bold text-slate-800">In-App Notifications</p>
              <p className="text-slate-500 text-[11px]">
                Receive instant status updates and municipal badges inside FixMyArea.
              </p>
            </div>
            <input
              type="checkbox"
              checked={inAppNotifs}
              onChange={(e) => setInAppNotifs(e.target.checked)}
              className="w-4 h-4 text-teal-700 rounded focus:ring-teal-500 cursor-pointer"
            />
          </label>

          <label className="flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
            <div>
              <p className="font-bold text-slate-800">Email Digest & Advisories</p>
              <p className="text-slate-500 text-[11px]">
                Receive email notifications when municipal workers resolve your reported issues.
              </p>
            </div>
            <input
              type="checkbox"
              checked={emailNotifs}
              onChange={(e) => setEmailNotifs(e.target.checked)}
              className="w-4 h-4 text-teal-700 rounded focus:ring-teal-500 cursor-pointer"
            />
          </label>

          <button
            onClick={handleSaveNotificationPrefs}
            disabled={savingPrefs}
            className="py-2.5 px-4 rounded-xl bg-teal-800 hover:bg-teal-900 text-white font-bold text-xs transition-colors shadow-xs cursor-pointer"
          >
            {savingPrefs ? 'Saving...' : 'Save Notification Preferences'}
          </button>
        </div>
      </div>

      {/* 3. Security & Password Change (With Upfront Reauthentication) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <Lock className="w-5 h-5 text-teal-700" />
          <div>
            <h2 className="font-heading font-bold text-sm text-slate-900">
              Security & Credentials
            </h2>
            <p className="text-[11px] text-slate-500">
              Update your Firebase Authentication password credentials securely.
            </p>
          </div>
        </div>

        {passwordSuccess && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Password updated successfully.</span>
          </div>
        )}

        {passwordError && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{passwordError}</span>
          </div>
        )}

        <form onSubmit={handleInitiatePasswordChange} className="space-y-3 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">New Password</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Minimum 6 characters"
              className="w-full p-2.5 rounded-xl border border-slate-300 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Confirm New Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter new password"
              className="w-full p-2.5 rounded-xl border border-slate-300 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <button
            type="submit"
            className="py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs transition-colors shadow-xs cursor-pointer"
          >
            Change Password
          </button>
        </form>
      </div>

      {/* 4. College Demo Role Switcher */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-teal-700" />
            <div>
              <h2 className="font-heading font-bold text-sm text-slate-900">
                Portal Role Switcher
              </h2>
              <p className="text-[11px] text-slate-500">
                Toggle between Citizen Resident and Municipal Officer for college project evaluation.
              </p>
            </div>
          </div>

          <span
            className={`text-xs font-bold px-2.5 py-1 rounded-full ${
              profile?.role === 'admin'
                ? 'bg-purple-100 text-purple-800'
                : 'bg-emerald-100 text-emerald-800'
            }`}
          >
            {profile?.role === 'admin' ? 'Officer View' : 'Resident View'}
          </span>
        </div>

        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
          <div>
            <p className="font-bold text-slate-800">
              {profile?.role === 'admin'
                ? 'You currently have Municipal Officer / Admin privileges.'
                : 'You are currently browsing as a standard Citizen Resident.'}
            </p>
            <p className="text-slate-500 text-[11px] mt-0.5">
              Admins can triage reports, update status workflows, configure the OpenRouter AI model, and review flags.
            </p>
          </div>

          <button
            onClick={handleRoleToggle}
            disabled={changingRole}
            className={`py-2 px-4 rounded-xl font-bold text-xs transition-colors shrink-0 shadow-2xs cursor-pointer ${
              profile?.role === 'admin'
                ? 'bg-slate-200 hover:bg-slate-300 text-slate-800'
                : 'bg-teal-800 hover:bg-teal-900 text-white'
            }`}
          >
            {changingRole
              ? 'Switching...'
              : profile?.role === 'admin'
              ? 'Switch to Resident View'
              : 'Switch to Admin View'}
          </button>
        </div>
      </div>

      {/* 5. Danger Zone: Account Deletion */}
      <div className="bg-white rounded-2xl border border-red-200 shadow-sm p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-red-100 pb-3">
          <div className="flex items-center gap-2">
            <Trash2 className="w-5 h-5 text-red-600" />
            <div>
              <h2 className="font-heading font-bold text-sm text-red-900">
                Delete Account
              </h2>
              <p className="text-[11px] text-slate-500">
                Permanently delete your profile and authentication credentials.
              </p>
            </div>
          </div>
        </div>

        {accountActionMessage && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{accountActionMessage}</span>
          </div>
        )}

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
          <p className="text-slate-600 leading-relaxed max-w-lg">
            Once you delete your account, your authentication record will be removed. This action requires password confirmation and cannot be reversed.
          </p>
          <button
            onClick={() => setShowDeleteAccountModal(true)}
            className="py-2.5 px-4 rounded-xl bg-red-50 border border-red-200 text-red-700 hover:bg-red-100 font-bold text-xs transition-colors shrink-0 shadow-xs cursor-pointer"
          >
            Delete Account
          </button>
        </div>
      </div>

      {/* 6. Session Actions */}
      <div className="bg-slate-100/80 rounded-2xl border border-slate-200 p-6 flex items-center justify-between">
        <div>
          <h3 className="font-heading font-bold text-sm text-slate-800">
            Sign Out
          </h3>
          <p className="text-[11px] text-slate-500">
            End your current active session on this device.
          </p>
        </div>
        <button
          onClick={handleLogout}
          className="py-2.5 px-4 rounded-xl bg-slate-700 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>

      {/* Upfront Re-Authentication Modal for Changing Password */}
      <ReauthModal
        isOpen={showPasswordReauthModal}
        onClose={() => setShowPasswordReauthModal(false)}
        onSuccess={handlePerformPasswordUpdate}
        title="Confirm Password Change"
        description="For security, please enter your current account password to authorize changing your login credentials."
        actionLabel="Verify & Update Password"
        isDestructive={false}
      />

      {/* Upfront Re-Authentication Modal for Deleting Account */}
      <ReauthModal
        isOpen={showDeleteAccountModal}
        onClose={() => setShowDeleteAccountModal(false)}
        onSuccess={handlePerformAccountDeletion}
        title="Confirm Account Deletion"
        description="This action will permanently delete your authentication account. Please enter your current password to confirm."
        actionLabel="Verify & Delete Account"
        isDestructive={true}
      />

    </div>
  );
};
