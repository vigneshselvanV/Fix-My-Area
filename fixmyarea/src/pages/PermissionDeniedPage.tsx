import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert, ArrowLeft, Settings } from 'lucide-react';

export const PermissionDeniedPage: React.FC = () => {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-16">
      <div className="max-w-md w-full text-center space-y-4 bg-white rounded-2xl border border-slate-200 shadow-teal-soft p-8">
        <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 mx-auto flex items-center justify-center">
          <ShieldAlert className="w-7 h-7" />
        </div>
        <h1 className="font-heading text-2xl font-bold text-slate-900">
          Access Restricted
        </h1>
        <p className="text-xs text-[#526E6E] leading-relaxed">
          The Municipal Triage Portal requires administrative authority. You can switch your role in Settings to test admin workflows.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Link
            to="/dashboard"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Dashboard</span>
          </Link>
          <Link
            to="/settings"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[#0D6E6E] text-white text-xs font-semibold hover:bg-[#0A5757] shadow-teal-soft transition-colors"
          >
            <Settings className="w-4 h-4" />
            <span>Go to Settings</span>
          </Link>
        </div>
      </div>
    </div>
  );
};
