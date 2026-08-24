import React from 'react';
import { Link } from 'react-router-dom';
import { MapPinOff, ArrowLeft } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-16">
      <div className="max-w-md w-full text-center space-y-4 bg-white rounded-2xl border border-slate-200 shadow-teal-soft p-8">
        <div className="w-14 h-14 rounded-2xl bg-[#E6F3F3] text-[#0D6E6E] mx-auto flex items-center justify-center">
          <MapPinOff className="w-7 h-7" />
        </div>
        <h1 className="font-heading text-2xl font-bold text-slate-900">
          404 — Page Not Found
        </h1>
        <p className="text-xs text-[#526E6E] leading-relaxed">
          The page or civic report you are looking for has moved or does not exist.
        </p>
        <div className="pt-2">
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 py-2.5 px-5 rounded-xl bg-[#0D6E6E] text-white text-xs font-semibold hover:bg-[#0A5757] shadow-teal-soft transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Dashboard</span>
          </Link>
        </div>
      </div>
    </div>
  );
};
