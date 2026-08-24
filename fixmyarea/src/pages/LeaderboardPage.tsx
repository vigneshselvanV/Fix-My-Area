import React, { useEffect, useState } from 'react';
import { getCivicLeaderboard } from '../services/reports';
import { CitizenLeaderboardItem } from '../types';
import {
  Trophy,
  Award,
  Medal,
  ShieldCheck,
  Flame,
  Star,
  Users,
  CheckCircle2,
  TrendingUp,
  Sparkles,
  ArrowUpRight,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const LeaderboardPage: React.FC = () => {
  const [leaderboard, setLeaderboard] = useState<CitizenLeaderboardItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    loadLeaderboard();
  }, []);

  const loadLeaderboard = async () => {
    setLoading(true);
    try {
      const data = await getCivicLeaderboard();
      // If empty in fresh DB, provide seeded resident civic guardians
      if (data.length === 0) {
        setLeaderboard([
          {
            uid: 'seed-1',
            name: 'Priya Sharma',
            points: 480,
            reports_submitted: 8,
            reports_resolved: 6,
            badges: ['First Responder', 'Civic Guardian', 'Fix Champion'],
            rank: 1,
          },
          {
            uid: 'seed-2',
            name: 'Karthik Raman',
            points: 320,
            reports_submitted: 5,
            reports_resolved: 4,
            badges: ['First Responder', 'Civic Guardian'],
            rank: 2,
          },
          {
            uid: 'seed-3',
            name: 'Ananya Deshmukh',
            points: 210,
            reports_submitted: 4,
            reports_resolved: 2,
            badges: ['First Responder', 'Community Voice'],
            rank: 3,
          },
          {
            uid: 'seed-4',
            name: 'Rahul Varma',
            points: 150,
            reports_submitted: 3,
            reports_resolved: 1,
            badges: ['First Responder'],
            rank: 4,
          },
        ]);
      } else {
        setLeaderboard(data);
      }
    } catch (e) {
      console.warn('Leaderboard error:', e);
    } finally {
      setLoading(false);
    }
  };

  const getRankBadge = (rank: number) => {
    if (rank === 1) {
      return (
        <div className="w-9 h-9 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center font-extrabold text-sm shadow-xs border-2 border-amber-300">
          🥇
        </div>
      );
    }
    if (rank === 2) {
      return (
        <div className="w-9 h-9 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-extrabold text-sm shadow-xs border-2 border-slate-300">
          🥈
        </div>
      );
    }
    if (rank === 3) {
      return (
        <div className="w-9 h-9 rounded-full bg-amber-50 text-amber-800 flex items-center justify-center font-extrabold text-sm shadow-xs border-2 border-amber-600/30">
          🥉
        </div>
      );
    }
    return (
      <div className="w-9 h-9 rounded-full bg-slate-50 text-slate-600 flex items-center justify-center font-bold text-xs border border-slate-200">
        #{rank}
      </div>
    );
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-8 font-sans">
      
      {/* Hero Header */}
      <div className="bg-gradient-to-r from-teal-900 via-teal-800 to-teal-950 text-white rounded-3xl p-6 sm:p-10 shadow-lg relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 opacity-10 flex items-center pointer-events-none pr-8">
          <Trophy className="w-72 h-72 text-white" />
        </div>

        <div className="max-w-2xl relative z-10 space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/20 border border-amber-300/30 text-amber-300 text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Phase 5: Community Impact Engine</span>
          </div>

          <h1 className="font-heading text-2xl sm:text-3xl font-extrabold tracking-tight">
            Civic Champions & Karma Leaderboard
          </h1>

          <p className="text-sm text-teal-100/90 leading-relaxed">
            Recognizing citizens who actively spot hazards, verify completed repairs, and help build a safer, cleaner municipality.
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-3 text-xs text-teal-200">
            <div className="flex items-center gap-1.5 bg-teal-800/60 px-3 py-1.5 rounded-xl border border-teal-700">
              <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
              <span><strong>+50 pts</strong> Verified Report</span>
            </div>
            <div className="flex items-center gap-1.5 bg-teal-800/60 px-3 py-1.5 rounded-xl border border-teal-700">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span><strong>+30 pts</strong> Resolution Verification</span>
            </div>
            <div className="flex items-center gap-1.5 bg-teal-800/60 px-3 py-1.5 rounded-xl border border-teal-700">
              <Flame className="w-4 h-4 text-amber-400" />
              <span><strong>+5 pts</strong> Community Upvote</span>
            </div>
          </div>
        </div>
      </div>

      {/* Top 3 Podium Cards */}
      {leaderboard.length >= 3 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          
          {/* 2nd Place */}
          <div className="order-2 md:order-1 bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col items-center text-center relative mt-0 md:mt-4">
            <div className="w-14 h-14 rounded-full bg-slate-100 border-4 border-slate-200 flex items-center justify-center text-xl mb-3 shadow-inner">
              🥈
            </div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Rank #2</span>
            <h3 className="font-heading font-bold text-base text-slate-900 mb-1">{leaderboard[1].name}</h3>
            <div className="text-teal-900 font-extrabold text-lg mb-3">
              {leaderboard[1].points} <span className="text-xs font-semibold text-slate-500">Karma</span>
            </div>
            <div className="flex flex-wrap justify-center gap-1.5 text-[10px]">
              {leaderboard[1].badges.map((b) => (
                <span key={b} className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-bold border border-slate-200">
                  {b}
                </span>
              ))}
            </div>
          </div>

          {/* 1st Place */}
          <div className="order-1 md:order-2 bg-gradient-to-b from-amber-50 to-white rounded-2xl p-7 border-2 border-amber-300 shadow-md flex flex-col items-center text-center relative -translate-y-2">
            <div className="absolute -top-3.5 bg-amber-500 text-white font-extrabold text-[10px] uppercase px-3 py-0.5 rounded-full shadow-sm tracking-wider flex items-center gap-1">
              <Trophy className="w-3 h-3" /> Top Civic Champion
            </div>
            <div className="w-16 h-16 rounded-full bg-amber-100 border-4 border-amber-400 flex items-center justify-center text-2xl mb-3 shadow-md">
              🥇
            </div>
            <span className="text-xs font-bold text-amber-800 uppercase tracking-wider mb-1">Rank #1</span>
            <h3 className="font-heading font-extrabold text-lg text-slate-900 mb-1">{leaderboard[0].name}</h3>
            <div className="text-teal-900 font-black text-2xl mb-3">
              {leaderboard[0].points} <span className="text-xs font-semibold text-slate-500">Karma Points</span>
            </div>
            <div className="flex flex-wrap justify-center gap-1.5 text-[10px]">
              {leaderboard[0].badges.map((b) => (
                <span key={b} className="px-2.5 py-1 rounded-md bg-amber-100 text-amber-900 font-extrabold border border-amber-300">
                  ⭐ {b}
                </span>
              ))}
            </div>
          </div>

          {/* 3rd Place */}
          <div className="order-3 bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col items-center text-center relative mt-0 md:mt-8">
            <div className="w-14 h-14 rounded-full bg-amber-50 border-4 border-amber-200 flex items-center justify-center text-xl mb-3 shadow-inner">
              🥉
            </div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Rank #3</span>
            <h3 className="font-heading font-bold text-base text-slate-900 mb-1">{leaderboard[2].name}</h3>
            <div className="text-teal-900 font-extrabold text-lg mb-3">
              {leaderboard[2].points} <span className="text-xs font-semibold text-slate-500">Karma</span>
            </div>
            <div className="flex flex-wrap justify-center gap-1.5 text-[10px]">
              {leaderboard[2].badges.map((b) => (
                <span key={b} className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-bold border border-slate-200">
                  {b}
                </span>
              ))}
            </div>
          </div>

        </div>
      )}

      {/* Full Leaderboard Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-teal-800" />
            <h3 className="font-heading font-bold text-base text-slate-900">
              Community Impact Roster
            </h3>
          </div>
          <span className="text-xs text-slate-500 font-medium">
            Live updates based on verified municipal activity
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4 w-16 text-center">Rank</th>
                <th className="py-3 px-4">Citizen Name</th>
                <th className="py-3 px-4 text-center">Reports Filed</th>
                <th className="py-3 px-4 text-center">Issues Resolved</th>
                <th className="py-3 px-4">Earned Badges</th>
                <th className="py-3 px-4 text-right">Total Karma</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    Loading civic leaderboard...
                  </td>
                </tr>
              ) : leaderboard.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    No citizen reports logged yet. Be the first to report an issue!
                  </td>
                </tr>
              ) : (
                leaderboard.map((item, idx) => (
                  <tr key={item.uid || idx} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex justify-center">
                        {getRankBadge(item.rank || idx + 1)}
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900 text-sm">
                        {item.name}
                      </div>
                      <span className="text-[10px] text-teal-800 font-semibold">
                        Ward Resident
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-center font-bold text-slate-700">
                      {item.reports_submitted}
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <span className="inline-flex items-center gap-1 font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full text-[11px] border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3" />
                        {item.reports_resolved}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex flex-wrap gap-1">
                        {item.badges && item.badges.length > 0 ? (
                          item.badges.map((b) => (
                            <span
                              key={b}
                              className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md font-semibold text-[10px] border border-slate-200"
                            >
                              {b}
                            </span>
                          ))
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">New Contributor</span>
                        )}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-right font-black text-teal-900 text-sm">
                      {item.points} pts
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Call to action */}
      <div className="p-6 bg-teal-50 border border-teal-200 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h4 className="font-heading font-bold text-sm text-teal-950">
            Want to climb the Civic Leaderboard?
          </h4>
          <p className="text-xs text-teal-800 mt-0.5">
            Submit verified photos of potholes, drainage clogs, and water leaks in your neighborhood to earn karma and badges.
          </p>
        </div>
        <Link
          to="/report/create"
          className="py-2.5 px-5 rounded-xl bg-teal-800 hover:bg-teal-900 text-white font-bold text-xs shrink-0 shadow-xs flex items-center gap-1.5 transition-colors"
        >
          <span>Report an Issue</span>
          <ArrowUpRight className="w-4 h-4" />
        </Link>
      </div>

    </div>
  );
};
