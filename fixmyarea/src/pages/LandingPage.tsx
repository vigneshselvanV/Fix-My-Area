import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  ArrowRight,
  Sparkles,
  TrendingUp,
  ShieldCheck,
  Zap,
  MapPin,
  Clock,
  Layers,
  LogIn,
} from 'lucide-react';
import { CategoryIcon } from '../components/common/CategoryIcon';
import { ReportCategory } from '../types';

export const LandingPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const categories: { name: ReportCategory; desc: string }[] = [
    { name: 'Pothole', desc: 'Damaged asphalt and road craters' },
    { name: 'Garbage', desc: 'Overflowing dumpsters and uncollected waste' },
    { name: 'Streetlight', desc: 'Dark streets and broken lampposts' },
    { name: 'Water Leak', desc: 'Burst mains and pipe leakages' },
    { name: 'Drainage', desc: 'Clogged storm drains and street flooding' },
    { name: 'Stray Animal', desc: 'Aggressive packs or injured animals' },
  ];

  return (
    <div className="w-full space-y-12 pb-12 font-sans">
      
      {/* Hero Section */}
      <section className="pt-10 pb-12 md:pt-16 md:pb-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-6">
            
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-teal-50 text-teal-800 text-xs font-bold border border-teal-200/80 shadow-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Next-Gen Civic Infrastructure Management</span>
            </div>

            <h1 className="font-heading text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-slate-900 leading-[1.15]">
              Report local civic issues in <span className="text-teal-800">under 2 minutes.</span>
            </h1>

            <p className="font-body text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
              Empower your neighborhood. Snap a photo, drop a GPS pin, and track verified repairs in real-time with smart duplicate detection and automated AI risk triage.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button
                onClick={() => navigate(user ? '/report/new' : '/signup')}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 py-3 px-6 rounded-xl bg-teal-800 text-white font-bold hover:bg-teal-900 shadow-md transition-all text-sm whitespace-nowrap cursor-pointer"
              >
                <span>{user ? 'Report an Issue Now' : 'Get Started / Sign Up'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => navigate(user ? '/dashboard' : '/login')}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 py-3 px-6 rounded-xl bg-white border border-slate-300 text-slate-700 font-bold hover:bg-slate-50 transition-colors text-sm whitespace-nowrap shadow-xs cursor-pointer"
              >
                {user ? (
                  <span>Go to Citizen Dashboard</span>
                ) : (
                  <>
                    <LogIn className="w-4 h-4 text-teal-800" />
                    <span>Citizen Log In</span>
                  </>
                )}
              </button>
            </div>

            {/* Bento Micro-metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 pt-8 border-t border-slate-200 max-w-xl mx-auto text-center sm:text-left">
              <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-xs">
                <p className="font-heading font-black text-xl text-teal-800">&lt; 50m</p>
                <p className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider">Duplicate Range</p>
              </div>
              <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-xs">
                <p className="font-heading font-black text-xl text-teal-800">4-Stage</p>
                <p className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider">Lifecycle Tracking</p>
              </div>
              <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-xs">
                <p className="font-heading font-black text-xl text-teal-800">Instant</p>
                <p className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider">AI Risk Scoring</p>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Bento Grid Features Showcase */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-xl mx-auto mb-8">
          <h2 className="font-heading text-2xl sm:text-3xl font-bold text-slate-900 mb-2">
            Civic Issue Categories
          </h2>
          <p className="text-xs sm:text-sm text-slate-600">
            Categorized civic issue management with dedicated dispatch routing.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          {categories.map((cat) => (
            <div
              key={cat.name}
              onClick={() => navigate(user ? `/dashboard?category=${encodeURIComponent(cat.name)}` : '/login')}
              className="bg-white hover:border-teal-600 p-4 rounded-2xl border border-slate-200 transition-all cursor-pointer text-center group shadow-sm hover:shadow-md"
            >
              <div className="w-10 h-10 rounded-xl bg-slate-100 group-hover:bg-teal-800 text-slate-700 group-hover:text-white mx-auto flex items-center justify-center transition-colors shadow-xs mb-2">
                <CategoryIcon category={cat.name} className="w-5 h-5" />
              </div>
              <h3 className="font-heading font-bold text-xs text-slate-900 mb-0.5">
                {cat.name}
              </h3>
              <p className="text-[10px] text-slate-500 line-clamp-2">
                {cat.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works: Bento Tiles */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-xl mx-auto mb-8">
          <h2 className="font-heading text-2xl sm:text-3xl font-bold text-slate-900 mb-2">
            Transparent Civic Resolution
          </h2>
          <p className="text-xs sm:text-sm text-slate-600">
            Built for citizen trust and municipal accountability.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
            <div>
              <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-800 font-black font-heading text-sm flex items-center justify-center mb-4 border border-teal-100">
                01
              </div>
              <h3 className="font-heading font-bold text-base text-slate-900 mb-2">
                Snap & Geotag
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Take a photo and let GPS pinpoint the issue. Auto-checks for existing duplicates within 50 meters so you can upvote instead of creating clutter.
              </p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
            <div>
              <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-800 font-black font-heading text-sm flex items-center justify-center mb-4 border border-amber-100">
                02
              </div>
              <h3 className="font-heading font-bold text-base text-slate-900 mb-2">
                AI Risk Assessment
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Each report is evaluated by AI for hazard risk (Low to Critical) with concise suggested actions to prioritize urgent water, drainage, or road faults.
              </p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
            <div>
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-800 font-black font-heading text-sm flex items-center justify-center mb-4 border border-emerald-100">
                03
              </div>
              <h3 className="font-heading font-bold text-base text-slate-900 mb-2">
                Live Resolution Timeline
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Track status updates from "Reported" to "Acknowledged", "In Progress", and "Resolved". Receive instant notifications on your reports and upvotes.
              </p>
            </div>
          </div>
        </div>

        {/* Bento Hero Action Tile */}
        <div className="mt-8 p-8 bg-teal-800 rounded-2xl text-white text-center shadow-lg border border-teal-900 relative overflow-hidden">
          <h3 className="font-heading text-xl sm:text-2xl font-bold mb-2">
            Ready to improve your neighborhood?
          </h3>
          <p className="text-teal-100 text-xs sm:text-sm max-w-md mx-auto mb-6">
            Join local residents making cities safer, cleaner, and better maintained.
          </p>
          <button
            onClick={() => navigate(user ? '/report/new' : '/signup')}
            className="inline-flex items-center gap-2 py-3 px-6 rounded-xl bg-white text-teal-900 font-bold hover:bg-teal-50 transition-colors text-sm shadow-md whitespace-nowrap cursor-pointer"
          >
            <span>{user ? 'Report an Issue' : 'Sign Up for FixMyArea'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </section>

    </div>
  );
};
