import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { NotificationDropdown } from '../common/NotificationDropdown';
import { Plus, Shield } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, profile, isAdmin } = useAuth();
  const location = useLocation();

  const navLinks = [
    { name: 'Dashboard', path: '/dashboard' },
    { name: 'Live Map', path: '/map' },
    { name: 'Leaderboard', path: '/leaderboard' },
    { name: 'Analytics', path: '/analytics' },
    { name: 'My Profile', path: '/profile' },
    ...(isAdmin ? [{ name: 'Admin Portal', path: '/admin' }] : []),
  ];

  const isActive = (path: string) => location.pathname === path;

  // Derive user initials
  const initials = profile?.name
    ? profile.name
        .split(' ')
        .map((n) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : user?.displayName
    ? user.displayName
        .split(' ')
        .map((n) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : 'U';

  return (
    <header className="sticky top-0 z-40 w-full bg-white border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Zone 1: Brand title */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          <Link
            to={user ? '/dashboard' : '/'}
            className="flex items-center gap-2 group transition-opacity"
          >
            <div className="w-8 h-8 bg-teal-800 rounded-xl flex items-center justify-center text-white font-bold text-base shadow-xs group-hover:bg-teal-900 transition-colors shrink-0">
              F
            </div>
            <span className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 font-heading">
              FixMyArea
            </span>
          </Link>

          {user && isAdmin && (
            <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 text-[11px] font-bold bg-purple-50 text-purple-800 rounded-full border border-purple-200 uppercase tracking-wide">
              <Shield className="w-3 h-3" />
              Officer
            </span>
          )}
        </div>

        {/* Zone 2: Navigation links (Authenticated Citizens Only) */}
        <div className="flex items-center gap-6">
          {user && (
            <>
              <div className="hidden lg:flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-full text-xs font-medium text-slate-600 border border-slate-200/60">
                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                <span>Live: Central District</span>
              </div>

              <nav className="hidden md:flex items-center gap-1 lg:gap-2">
                {navLinks.map((link) => (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap shrink-0 ${
                      isActive(link.path)
                        ? 'bg-teal-50 text-teal-900 border border-teal-200/60'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    {link.name}
                  </Link>
                ))}
              </nav>
            </>
          )}
        </div>

        {/* Zone 3: Primary Actions & User Badge */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {user ? (
            <>
              <NotificationDropdown />

              <Link
                to="/report/new"
                className="hidden sm:inline-flex items-center gap-1.5 py-2 px-3.5 rounded-xl bg-teal-800 text-white text-xs sm:text-sm font-bold hover:bg-teal-900 transition-all shadow-xs whitespace-nowrap shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>Report Issue</span>
              </Link>

              <Link
                to="/profile"
                className="flex items-center justify-center p-0.5 rounded-full hover:ring-2 hover:ring-teal-500/20 transition-all shrink-0"
                title="Account Profile"
              >
                <div className="w-8 h-8 rounded-full bg-teal-100 border border-teal-200 flex items-center justify-center text-teal-800 font-bold text-xs shadow-xs">
                  {initials}
                </div>
              </Link>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className="px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 rounded-xl transition-colors whitespace-nowrap"
              >
                Log In
              </Link>
              <Link
                to="/signup"
                className="px-4 py-2 text-xs font-bold bg-teal-800 text-white rounded-xl hover:bg-teal-900 transition-colors whitespace-nowrap shadow-xs"
              >
                Sign Up
              </Link>
            </div>
          )}
        </div>

      </div>
    </header>
  );
};
