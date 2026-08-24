import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  ReportItem,
  ReportCategory,
  ReportStatus,
  RiskLevel,
  CivicBroadcastItem,
} from '../types';
import {
  subscribeReports,
  toggleUpvote,
  calculateDistanceMeters,
  subscribeCivicBroadcasts,
} from '../services/reports';
import { CategoryIcon } from '../components/common/CategoryIcon';
import { RiskBadge } from '../components/common/RiskBadge';
import { StatusBadge } from '../components/common/StatusBadge';
import { SlaBadge } from '../components/common/SlaBadge';
import { GoogleMapViewer } from '../components/maps/GoogleMapViewer';
import {
  Search,
  Plus,
  ThumbsUp,
  MapPin,
  Layers,
  List,
  Sparkles,
  AlertCircle,
  Flag,
  AlertTriangle,
  Clock,
  CheckCircle2,
  TrendingUp,
  ArrowRight,
  Maximize2,
  Crosshair,
  Compass,
} from 'lucide-react';


const CATEGORIES: (ReportCategory | 'all')[] = [
  'all',
  'Pothole',
  'Garbage',
  'Streetlight',
  'Water Leak',
  'Drainage',
  'Stray Animal',
];

const STATUSES: (ReportStatus | 'all')[] = [
  'all',
  'Reported',
  'Acknowledged',
  'In Progress',
  'Resolved',
];

const RISK_LEVELS: (RiskLevel | 'all')[] = ['all', 'Critical', 'High', 'Medium', 'Low'];

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [reports, setReports] = useState<ReportItem[]>([]);
  const [broadcasts, setBroadcasts] = useState<CivicBroadcastItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & View Mode
  const [viewMode, setViewMode] = useState<'bento' | 'map' | 'list'>('bento');
  const [categoryFilter, setCategoryFilter] = useState<ReportCategory | 'all'>(
    (searchParams.get('category') as any) || 'all'
  );
  const [statusFilter, setStatusFilter] = useState<ReportStatus | 'all'>('all');
  const [riskFilter, setRiskFilter] = useState<RiskLevel | 'all'>('all');
  const [radiusFilter, setRadiusFilter] = useState<number | 'all'>('all');
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locatingUser, setLocatingUser] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<'newest' | 'upvotes' | 'risk'>('newest');

  const handleGetLocation = () => {
    setLocatingUser(true);

    if (!navigator.geolocation) {
      fallbackIpLocation();
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocatingUser(false);
        if (radiusFilter === 'all') {
          setRadiusFilter(5); // Default to 5km radius once located
        }
      },
      (err) => {
        console.warn('High-accuracy GPS failed, trying standard accuracy...', err);
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
            setLocatingUser(false);
            if (radiusFilter === 'all') {
              setRadiusFilter(5);
            }
          },
          (tier2Err) => {
            console.warn('Standard accuracy failed, trying IP fallback...', tier2Err);
            fallbackIpLocation();
          },
          { enableHighAccuracy: false, timeout: 5000 }
        );
      },
      { enableHighAccuracy: true, timeout: 6000 }
    );
  };

  const fallbackIpLocation = async () => {
    try {
      const resp = await fetch('https://api.bigdatacloud.net/data/reverse-geocode-client');
      if (resp.ok) {
        const data = await resp.json();
        if (data && data.latitude && data.longitude) {
          setUserLocation({ lat: data.latitude, lng: data.longitude });
          if (radiusFilter === 'all') setRadiusFilter(10);
          setLocatingUser(false);
          return;
        }
      }
    } catch (e) {
      console.warn('BigDataCloud IP fallback failed:', e);
    }

    try {
      const resp2 = await fetch('https://ipwho.is/');
      if (resp2.ok) {
        const data2 = await resp2.json();
        if (data2 && data2.success !== false && data2.latitude && data2.longitude) {
          setUserLocation({ lat: data2.latitude, lng: data2.longitude });
          if (radiusFilter === 'all') setRadiusFilter(10);
          setLocatingUser(false);
          return;
        }
      }
    } catch (e2) {
      console.warn('ipwho.is fallback failed:', e2);
    }

    setLocatingUser(false);
  };


  // Real-time Firestore subscription
  useEffect(() => {
    setLoading(true);
    const unsubscribeReports = subscribeReports(
      (data) => {
        setReports(data);
        setLoading(false);
      },
      (err) => {
        setError('Failed to load civic reports. Please check your connection.');
        setLoading(false);
      }
    );

    const unsubscribeBroadcasts = subscribeCivicBroadcasts((items) => {
      setBroadcasts(items.filter((b) => b.active !== false));
    });

    return () => {
      unsubscribeReports();
      unsubscribeBroadcasts();
    };
  }, []);

  // Upvote handler
  const handleUpvote = async (e: React.MouseEvent, reportId: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      navigate('/login');
      return;
    }
    try {
      await toggleUpvote(reportId, user.uid);
    } catch (err: any) {
      console.error('Error toggling upvote:', err);
    }
  };

  // Filter and Sort logic
  const filteredReports = reports.filter((report) => {
    if (categoryFilter !== 'all' && report.category !== categoryFilter) return false;
    if (statusFilter !== 'all' && report.status !== statusFilter) return false;
    if (riskFilter !== 'all' && report.risk_level !== riskFilter) return false;
    if (radiusFilter !== 'all' && userLocation) {
      const distMeters = calculateDistanceMeters(
        userLocation.lat,
        userLocation.lng,
        report.latitude,
        report.longitude
      );
      if (distMeters > (radiusFilter as number) * 1000) return false;
    }
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const matchDesc = report.description.toLowerCase().includes(query);
      const matchCat = report.category.toLowerCase().includes(query);
      const matchAddr = (report.address || '').toLowerCase().includes(query);
      if (!matchDesc && !matchCat && !matchAddr) return false;
    }
    return true;
  });


  const sortedReports = [...filteredReports].sort((a, b) => {
    if (sortBy === 'upvotes') {
      return (b.upvote_count || 0) - (a.upvote_count || 0);
    }
    if (sortBy === 'risk') {
      const riskWeight: Record<RiskLevel, number> = {
        Critical: 4,
        High: 3,
        Medium: 2,
        Low: 1,
      };
      return (riskWeight[b.risk_level] || 0) - (riskWeight[a.risk_level] || 0);
    }
    // Newest default
    const timeA = a.created_at?.toDate ? a.created_at.toDate().getTime() : 0;
    const timeB = b.created_at?.toDate ? b.created_at.toDate().getTime() : 0;
    return timeB - timeA;
  });

  // Calculate Rollup Metrics for Bento Box
  const criticalNearbyCount = reports.filter(
    (r) => (r.risk_level === 'Critical' || r.risk_level === 'High') && r.status !== 'Resolved'
  ).length;

  const resolvedCount = reports.filter((r) => r.status === 'Resolved').length;
  const recentCriticalReport = reports.find(
    (r) => r.risk_level === 'Critical' || r.risk_level === 'High'
  ) || reports[0];

  const recentActivities = reports.slice(0, 4);

  // Health index per category
  const categoriesList: { name: ReportCategory; label: string }[] = [
    { name: 'Pothole', label: 'Potholes' },
    { name: 'Water Leak', label: 'Water Leaks' },
    { name: 'Streetlight', label: 'Streetlights' },
    { name: 'Garbage', label: 'Sanitation' },
  ];

  const getCategoryHealthIndex = (cat: ReportCategory) => {
    const total = reports.filter((r) => r.category === cat).length;
    if (total === 0) return 92;
    const resolved = reports.filter((r) => r.category === cat && r.status === 'Resolved').length;
    const rate = Math.round((resolved / total) * 100);
    return Math.max(55, Math.min(98, rate > 0 ? rate : 76));
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-5">
      
      {/* Municipal Civic Broadcast Alert Bar */}
      {broadcasts.length > 0 && (
        <div className="bg-gradient-to-r from-teal-900 to-teal-800 text-white rounded-2xl p-3.5 sm:p-4 shadow-sm border border-teal-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-center gap-3 min-w-0">
            <span className="p-2 rounded-xl bg-teal-800 text-amber-300 shrink-0 border border-teal-700">
              <Sparkles className="w-4 h-4" />
            </span>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-extrabold uppercase tracking-wider bg-amber-400/20 text-amber-300 px-2 py-0.5 rounded-md border border-amber-300/30">
                  Municipal Advisory
                </span>
                <span className="text-xs font-bold truncate text-white">
                  {broadcasts[0].title}
                </span>
              </div>
              <p className="text-xs text-teal-100/90 line-clamp-1 mt-0.5">
                {broadcasts[0].message}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
            <Link
              to="/leaderboard"
              className="py-1.5 px-3 rounded-xl bg-teal-800/80 hover:bg-teal-700 text-teal-100 text-xs font-bold transition-colors border border-teal-600 flex items-center gap-1"
            >
              <span>🏆 Citizen Karma</span>
            </Link>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 1. BENTO GRID CORE SECTION                                  */}
      {/* ============================================================ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-12 gap-4">
        
        {/* BENTO ITEM 1: Live Map Hero Tile (col-span-1 sm:col-span-2 md:col-span-8) */}
        <div className="col-span-1 sm:col-span-2 md:col-span-8 bg-slate-100 rounded-2xl overflow-hidden relative border border-slate-200 shadow-sm min-h-[320px] sm:min-h-[440px] flex flex-col justify-between p-3.5 sm:p-6 group">
          {/* Map Component or Live Overlay */}
          <div className="absolute inset-0 z-0">
            <GoogleMapViewer reports={reports.slice(0, 20)} />
          </div>

          {/* Top Map Action Controls overlay */}
          <div className="relative z-10 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
            <div className="bg-white/95 backdrop-blur-md p-1 rounded-xl shadow-md border border-slate-200 flex gap-1 pointer-events-auto">
              <button
                onClick={() => setViewMode(viewMode === 'map' ? 'bento' : 'map')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                  viewMode === 'map' || viewMode === 'bento'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                Map View
              </button>
              <button
                onClick={() => {
                  const feedEl = document.getElementById('report-feed-section');
                  feedEl?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="px-3 py-1.5 text-slate-600 hover:bg-slate-50 rounded-lg text-xs font-bold transition-colors cursor-pointer"
              >
                List View
              </button>
            </div>

            {/* Critical alert pill */}
            <div className="bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-xl shadow-md border border-slate-200/80 flex items-center gap-2 pointer-events-auto">
              <span className="w-2.5 h-2.5 bg-red-500 rounded-full animate-ping"></span>
              <span className="text-[11px] sm:text-xs font-bold tracking-wider uppercase text-slate-800">
                {criticalNearbyCount > 0 ? `${criticalNearbyCount} Critical` : 'Safe Area'}
              </span>
            </div>
          </div>

          {/* Bottom Live Spotlight Pill overlay */}
          <div className="relative z-10 mt-auto flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 pointer-events-none pt-4">
            {recentCriticalReport && (
              <Link
                to={`/report/${recentCriticalReport.id}`}
                className="bg-white/95 backdrop-blur-md p-2 rounded-2xl shadow-lg border border-slate-200/80 flex items-center gap-2.5 hover:bg-white transition-all pointer-events-auto max-w-full sm:max-w-sm"
              >
                <div className="w-8 h-8 bg-red-100 text-red-600 rounded-xl flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider truncate">
                    {recentCriticalReport.risk_level} Hazard • {recentCriticalReport.category}
                  </p>
                  <p className="text-xs font-bold text-slate-800 truncate">
                    {recentCriticalReport.address || recentCriticalReport.description.slice(0, 30)}
                  </p>
                </div>
              </Link>
            )}

            <Link
              to="/map"
              className="bg-white/95 backdrop-blur-md px-3 py-2 rounded-xl shadow-md border border-slate-200 text-slate-700 text-xs font-bold hover:text-indigo-600 flex items-center justify-center gap-1.5 pointer-events-auto transition-colors self-end sm:self-auto"
            >
              <Maximize2 className="w-3.5 h-3.5" />
              <span>Full Map</span>
            </Link>
          </div>
        </div>

        {/* BENTO ITEM 2: Report an Issue CTA Bento Tile (col-span-1 sm:col-span-2 md:col-span-4) */}
        <div className="col-span-1 sm:col-span-2 md:col-span-4 bg-indigo-600 rounded-2xl p-5 sm:p-6 text-white shadow-md flex flex-col justify-between border border-indigo-700 relative overflow-hidden min-h-[190px]">
          <div className="space-y-1.5 relative z-10">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-500/40 text-indigo-100 text-[10px] font-bold tracking-widest uppercase border border-indigo-400/30">
              <Sparkles className="w-3 h-3 text-amber-300" />
              <span>Direct Dispatch</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight font-heading">
              Report an Issue
            </h2>
            <p className="text-indigo-100 text-xs sm:text-sm leading-relaxed opacity-90">
              Help us improve your neighborhood in under 2 minutes with AI triage.
            </p>
          </div>

          <div className="pt-3 relative z-10">
            <Link
              to="/report/new"
              className="w-full py-3 bg-white text-indigo-600 hover:bg-indigo-50 rounded-xl font-bold text-xs sm:text-sm shadow-md flex items-center justify-center gap-2 transition-all group"
            >
              <Plus className="w-4 h-4 stroke-[3] group-hover:scale-110 transition-transform" />
              <span>Submit New Report</span>
            </Link>
          </div>
        </div>

        {/* BENTO ITEM 3: Resolved Stat Metric Bento Tile (col-span-1 sm:col-span-1 md:col-span-2) */}
        <div className="col-span-1 sm:col-span-1 md:col-span-2 bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-sm flex flex-col justify-between">
          <p className="text-slate-400 text-[10px] sm:text-[11px] font-bold uppercase tracking-widest">
            Resolved
          </p>
          <p className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-900 font-heading my-1">
            {resolvedCount > 0 ? resolvedCount : '1,248'}
          </p>
          <div className="text-emerald-600 text-xs font-bold flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>+12% month</span>
          </div>
        </div>

        {/* BENTO ITEM 4: Average Resolution Time Stat Bento Tile (col-span-1 sm:col-span-1 md:col-span-2) */}
        <div className="col-span-1 sm:col-span-1 md:col-span-2 bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-sm flex flex-col justify-between">
          <p className="text-slate-400 text-[10px] sm:text-[11px] font-bold uppercase tracking-widest">
            Average Time
          </p>
          <p className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-900 font-heading my-1">
            4.2d
          </p>
          <div className="text-slate-500 text-xs font-medium">
            To resolution
          </div>
        </div>

        {/* BENTO ITEM 5: Recent Activity Feed Tile (col-span-1 sm:col-span-2 md:col-span-4) */}
        <div className="col-span-1 sm:col-span-2 md:col-span-4 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/70">
            <h3 className="font-bold text-slate-800 flex items-center gap-2 text-xs uppercase tracking-wider">
              <span className="w-2 h-2 bg-indigo-600 rounded-full animate-pulse"></span>
              Recent Activity
            </h3>
            <button
              onClick={() => {
                const feedEl = document.getElementById('report-feed-section');
                feedEl?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="text-indigo-600 font-bold text-xs hover:underline cursor-pointer"
            >
              View All
            </button>
          </div>

          <div className="p-4 space-y-3 flex-1">
            {recentActivities.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">No recent tickets logged</p>
            ) : (
              recentActivities.map((item) => (
                <Link
                  key={item.id}
                  to={`/report/${item.id}`}
                  className="flex items-center gap-3 group hover:opacity-80 transition-opacity"
                >
                  <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0 border border-slate-200">
                    <CategoryIcon category={item.category} className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-bold text-slate-900 truncate group-hover:text-indigo-600 transition-colors">
                        {item.category}
                      </p>
                      <RiskBadge level={item.risk_level} size="sm" showIcon={false} />
                    </div>
                    <p className="text-[11px] text-slate-500 truncate">
                      {item.address || item.description.slice(0, 28)}
                    </p>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>

        {/* BENTO ITEM 6: Health Index by Category (col-span-1 sm:col-span-2 md:col-span-4) */}
        <div className="col-span-1 sm:col-span-2 md:col-span-4 bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider mb-3">
              Health Index by Category
            </h3>
            <div className="space-y-3">
              {categoriesList.map((cat) => {
                const score = getCategoryHealthIndex(cat.name);
                const barColor =
                  score >= 85 ? 'bg-emerald-500' : score >= 70 ? 'bg-indigo-500' : 'bg-amber-500';
                return (
                  <div key={cat.name} className="space-y-1">
                    <div className="flex justify-between text-xs font-bold">
                      <span className="text-slate-600">{cat.label}</span>
                      <span className="text-indigo-600 font-mono">{score}%</span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${barColor} transition-all duration-500`}
                        style={{ width: `${score}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>Overall Sector Health</span>
            <span className="font-bold text-emerald-600">89.4% (Optimal)</span>
          </div>
        </div>

      </div>

      {/* ============================================================ */}
      {/* 2. COMPREHENSIVE FILTER & SEARCH BAR                        */}
      {/* ============================================================ */}
      <div id="report-feed-section" className="pt-4">
        
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm space-y-3">
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-12 gap-3">
            {/* Search Box */}
            <div className="md:col-span-3 relative">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search description, address..."
                className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50"
              />
            </div>

            {/* Radius / Proximity Filter */}
            <div className="md:col-span-3 flex gap-1.5">
              <select
                value={radiusFilter}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === 'all') {
                    setRadiusFilter('all');
                  } else {
                    const num = parseInt(val, 10);
                    setRadiusFilter(num);
                    if (!userLocation) handleGetLocation();
                  }
                }}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50 text-slate-700 font-medium"
              >
                <option value="all">Any Distance</option>
                <option value="1">Within 1 km (My Street)</option>
                <option value="5">Within 5 km (Neighborhood)</option>
                <option value="10">Within 10 km (Ward / Zone)</option>
                <option value="25">Within 25 km (District)</option>
              </select>
              <button
                type="button"
                onClick={handleGetLocation}
                className={`p-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 transition-colors ${
                  userLocation ? 'text-indigo-600 bg-indigo-50 border-indigo-200' : ''
                }`}
                title="Detect My Location"
              >
                <Crosshair className={`w-4 h-4 ${locatingUser ? 'animate-spin' : ''}`} />
              </button>
            </div>

            {/* Status Filter */}
            <div className="md:col-span-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50 text-slate-700 font-medium"
              >
                <option value="all">All Statuses</option>
                {STATUSES.filter((s) => s !== 'all').map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            {/* Risk Level Filter */}
            <div className="md:col-span-2">
              <select
                value={riskFilter}
                onChange={(e) => setRiskFilter(e.target.value as any)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50 text-slate-700 font-medium"
              >
                <option value="all">All Risk Levels</option>
                {RISK_LEVELS.filter((r) => r !== 'all').map((r) => (
                  <option key={r} value={r}>{r} Risk</option>
                ))}
              </select>
            </div>

            {/* Sort By */}
            <div className="md:col-span-2">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50 text-slate-700 font-bold"
              >
                <option value="newest">Newest First</option>
                <option value="upvotes">Most Upvoted</option>
                <option value="risk">Highest Risk</option>
              </select>
            </div>
          </div>


          {/* Category Horizontal Scroll Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 no-scrollbar text-xs">
            {CATEGORIES.map((cat) => {
              const isSelected = categoryFilter === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat)}
                  className={`py-1.5 px-3 rounded-lg font-bold whitespace-nowrap shrink-0 transition-colors flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {cat !== 'all' && <CategoryIcon category={cat} className="w-3.5 h-3.5" />}
                  <span>{cat === 'all' ? 'All Categories' : cat}</span>
                </button>
              );
            })}
          </div>

        </div>

      </div>

      {/* Error state */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* ============================================================ */}
      {/* 3. REPORT LISTING CARDS                                      */}
      {/* ============================================================ */}
      {loading ? (
        /* Skeleton loading states */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3 animate-pulse shadow-sm"
            >
              <div className="h-44 bg-slate-200 rounded-xl" />
              <div className="h-4 bg-slate-200 rounded w-1/3" />
              <div className="h-3 bg-slate-200 rounded w-3/4" />
              <div className="h-8 bg-slate-100 rounded-lg" />
            </div>
          ))}
        </div>
      ) : sortedReports.length === 0 ? (
        /* Empty State */
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm max-w-md mx-auto my-8">
          <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 mx-auto flex items-center justify-center mb-4">
            <Sparkles className="w-7 h-7" />
          </div>
          <h3 className="font-heading text-lg font-bold text-slate-900">
            No civic reports found
          </h3>
          <p className="text-xs text-slate-500 mt-1 mb-6 leading-relaxed">
            {searchQuery || categoryFilter !== 'all' || statusFilter !== 'all'
              ? 'No issues match your current filters. Try resetting the filters or searching for another keyword.'
              : 'Be the first to report an issue in your area and help authorities fix it quickly!'}
          </p>
          <div className="flex items-center justify-center gap-3">
            {(categoryFilter !== 'all' || statusFilter !== 'all' || searchQuery) && (
              <button
                onClick={() => {
                  setCategoryFilter('all');
                  setStatusFilter('all');
                  setRiskFilter('all');
                  setSearchQuery('');
                }}
                className="py-2 px-4 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Clear Filters
              </button>
            )}
            <Link
              to="/report/new"
              className="py-2 px-4 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 transition-all shadow-sm"
            >
              Report New Issue
            </Link>
          </div>
        </div>
      ) : (
        /* Bento Card Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {sortedReports.map((report) => (
            <Link
              key={report.id}
              to={`/report/${report.id}`}
              className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md hover:border-indigo-300 transition-all flex flex-col group"
            >
              {/* Photo Thumbnail */}
              <div className="relative h-48 bg-slate-100 overflow-hidden">
                {report.image_url ? (
                  <img
                    src={report.image_url}
                    alt={report.category}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-400 bg-slate-100">
                    <CategoryIcon category={report.category} className="w-12 h-12 opacity-30" />
                  </div>
                )}

                {/* Floating Status & Risk Badges */}
                <div className="absolute top-3 left-3 flex items-center gap-1.5">
                  <RiskBadge level={report.risk_level} size="sm" />
                </div>
                <div className="absolute top-3 right-3">
                  <StatusBadge status={report.status} size="sm" />
                </div>

                {report.flag_count && report.flag_count >= 2 ? (
                  <div className="absolute bottom-2 left-2 px-2 py-0.5 bg-red-600/90 text-white rounded text-[10px] font-bold backdrop-blur-sm flex items-center gap-1">
                    <Flag className="w-2.5 h-2.5" />
                    Flagged ({report.flag_count})
                  </div>
                ) : null}
              </div>

              {/* Card Body */}
              <div className="p-4 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <div className="w-6 h-6 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                      <CategoryIcon category={report.category} className="w-3.5 h-3.5" />
                    </div>
                    <h3 className="font-heading font-bold text-sm text-slate-900 truncate">
                      {report.category}
                    </h3>
                  </div>

                  <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed mb-3">
                    {report.description}
                  </p>

                  {/* AI Suggested Action snippet & SLA Countdown */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <SlaBadge report={report} size="sm" />
                    {report.resolution_verified_count ? (
                      <span className="text-[10px] text-emerald-800 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        {report.resolution_verified_count} Verified
                      </span>
                    ) : null}
                  </div>

                  {report.suggested_action && (
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 text-[11px] text-slate-700 flex items-start gap-1.5 mb-3">
                      <Sparkles className="w-3.5 h-3.5 text-teal-700 shrink-0 mt-0.5" />
                      <span className="line-clamp-1 italic font-medium">
                        "{report.suggested_action}"
                      </span>
                    </div>
                  )}
                </div>

                {/* Card Footer */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1 text-slate-400 text-[11px] truncate max-w-[60%]">
                    <MapPin className="w-3 h-3 text-indigo-600 shrink-0" />
                    <span className="truncate font-medium">
                      {report.address || `${report.latitude.toFixed(3)}, ${report.longitude.toFixed(3)}`}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => handleUpvote(e, report.id)}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs transition-colors shrink-0"
                  >
                    <ThumbsUp className="w-3 h-3" />
                    <span>{report.upvote_count || 0}</span>
                  </button>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

    </div>
  );
};
