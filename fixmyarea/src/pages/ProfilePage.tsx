import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ReportItem } from '../types';
import { getUserReports } from '../services/reports';
import { CategoryIcon } from '../components/common/CategoryIcon';
import { RiskBadge } from '../components/common/RiskBadge';
import { StatusBadge } from '../components/common/StatusBadge';
import {
  Settings,
  Edit2,
  Save,
  Clock,
  Sparkles,
} from 'lucide-react';

export const ProfilePage: React.FC = () => {
  const { user, profile, updateUserProfile } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'my_reports' | 'stats'>('my_reports');
  const [myReports, setMyReports] = useState<ReportItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Edit Name State
  const [isEditingName, setIsEditingName] = useState<boolean>(false);
  const [editedName, setEditedName] = useState<string>('');
  const [savingName, setSavingName] = useState<boolean>(false);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    setEditedName(profile?.name || user.displayName || 'Resident');

    const loadData = async () => {
      setLoading(true);
      try {
        const userReports = await getUserReports(user.uid);
        setMyReports(userReports);
      } catch (err) {
        console.error('Error fetching profile data:', err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user, profile]);

  const handleSaveName = async () => {
    if (!editedName.trim()) return;
    setSavingName(true);
    try {
      await updateUserProfile({ name: editedName.trim() });
      setIsEditingName(false);
    } catch (err) {
      console.error('Error updating name:', err);
    } finally {
      setSavingName(false);
    }
  };

  const resolvedCount = myReports.filter((r) => r.status === 'Resolved').length;
  const inProgressCount = myReports.filter((r) => r.status === 'In Progress' || r.status === 'Acknowledged').length;
  const totalUpvotesReceived = myReports.reduce((acc, curr) => acc + (curr.upvote_count || 0), 0);

  if (!user) return null;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Profile Header Box */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-indigo-600 text-white font-heading font-black text-2xl flex items-center justify-center shadow-xs">
              {profile?.name ? profile.name.charAt(0).toUpperCase() : 'U'}
            </div>

            <div>
              {isEditingName ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={editedName}
                    onChange={(e) => setEditedName(e.target.value)}
                    className="px-3 py-1.5 text-base font-heading font-bold rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <button
                    onClick={handleSaveName}
                    disabled={savingName}
                    className="p-2 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
                  >
                    <Save className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <h1 className="font-heading text-xl sm:text-2xl font-bold text-slate-900">
                    {profile?.name || user.displayName || 'Resident User'}
                  </h1>
                  <button
                    onClick={() => setIsEditingName(true)}
                    className="text-slate-400 hover:text-indigo-600 p-1"
                    title="Edit Name"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              <p className="text-xs text-slate-500 mt-0.5">{user.email}</p>
              <div className="flex items-center gap-2 mt-2">
                <span className="px-2.5 py-0.5 text-[11px] font-bold bg-indigo-50 text-indigo-700 rounded-full border border-indigo-200 uppercase tracking-wide">
                  {profile?.role || 'Resident'}
                </span>
                <span className="text-[11px] text-slate-400">
                  Member since {user.metadata.creationTime ? new Date(user.metadata.creationTime).toLocaleDateString() : '2026'}
                </span>
              </div>
            </div>
          </div>

          <Link
            to="/settings"
            className="inline-flex items-center gap-1.5 py-2 px-3.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 transition-colors shadow-xs"
          >
            <Settings className="w-4 h-4" />
            <span>Account Settings</span>
          </Link>

        </div>

        {/* Civic Impact Metrics Bento Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-6 mt-6 border-t border-slate-100">
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Issues Filed</p>
            <p className="font-heading text-2xl font-black text-slate-900 mt-0.5">{myReports.length}</p>
          </div>
          <div className="p-4 bg-emerald-50/60 rounded-2xl border border-emerald-200">
            <p className="text-[10px] text-emerald-700 font-bold uppercase tracking-wider">Issues Resolved</p>
            <p className="font-heading text-2xl font-black text-emerald-700 mt-0.5">{resolvedCount}</p>
          </div>
          <div className="p-4 bg-indigo-50/60 rounded-2xl border border-indigo-200">
            <p className="text-[10px] text-indigo-700 font-bold uppercase tracking-wider">In Progress</p>
            <p className="font-heading text-2xl font-black text-indigo-700 mt-0.5">{inProgressCount}</p>
          </div>
          <div className="p-4 bg-amber-50/60 rounded-2xl border border-amber-200">
            <p className="text-[10px] text-amber-700 font-bold uppercase tracking-wider">Upvotes Earned</p>
            <p className="font-heading text-2xl font-black text-amber-700 mt-0.5">{totalUpvotesReceived}</p>
          </div>
        </div>
      </div>

      {/* Reports Section */}
      <div className="space-y-4">
        <h2 className="font-heading font-bold text-base text-slate-900">
          My Civic Reports ({myReports.length})
        </h2>

        {loading ? (
          <div className="bg-white rounded-2xl p-8 border border-slate-200 text-center animate-pulse">
            <div className="h-4 bg-slate-200 rounded w-1/4 mx-auto" />
          </div>
        ) : myReports.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center shadow-xs">
            <Sparkles className="w-8 h-8 text-indigo-600 mx-auto mb-2" />
            <h3 className="font-heading font-bold text-sm text-slate-900">No issues reported yet</h3>
            <p className="text-xs text-slate-500 mt-1 mb-4">
              Help your local community by reporting potholes, sanitation issues, or lighting problems.
            </p>
            <Link
              to="/report/new"
              className="py-2 px-4 rounded-xl bg-indigo-600 text-white font-bold text-xs shadow-xs hover:bg-indigo-700"
            >
              Report Your First Issue
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {myReports.map((report) => (
              <Link
                key={report.id}
                to={`/report/${report.id}`}
                className="bg-white rounded-2xl border border-slate-200 p-4 hover:shadow-sm hover:border-indigo-300 transition-all flex items-start justify-between gap-4 group"
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0 border border-slate-200">
                    <CategoryIcon category={report.category} className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="font-heading font-bold text-xs text-slate-900 group-hover:text-indigo-600 transition-colors">
                        {report.category}
                      </h4>
                      <RiskBadge level={report.risk_level} size="sm" showIcon={false} />
                    </div>
                    <p className="text-xs text-slate-600 line-clamp-1 mt-0.5">
                      {report.description}
                    </p>
                    <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-1">
                      <Clock className="w-3 h-3" />
                      <span>
                        {report.created_at?.toDate
                          ? report.created_at.toDate().toLocaleDateString([], { dateStyle: 'medium' })
                          : 'Recent'}
                      </span>
                      <span>•</span>
                      <span>{report.upvote_count || 0} upvotes</span>
                    </div>
                  </div>
                </div>

                <div className="shrink-0">
                  <StatusBadge status={report.status} size="sm" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};
