import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Map, Plus, User, BarChart2 } from 'lucide-react';

export const BottomNav: React.FC = () => {
  return (
    <nav
      aria-label="Mobile navigation"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-[0_-4px_16px_rgba(0,0,0,0.06)] px-0 pb-[max(env(safe-area-inset-bottom),8px)] pt-1 w-full"
    >
      <div className="flex items-center justify-between w-full max-w-md mx-auto px-1 relative">
        
        {/* Tab 1: Feed / Dashboard */}
        <NavLink
          to="/dashboard"
          className={({ isActive }) =>
            `flex-1 flex flex-col items-center justify-center py-1 text-center transition-colors ${
              isActive ? 'text-indigo-600 font-bold' : 'text-slate-500 hover:text-slate-800'
            }`
          }
        >
          <LayoutDashboard className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] tracking-tight leading-none">Feed</span>
        </NavLink>

        {/* Tab 2: Map */}
        <NavLink
          to="/map"
          className={({ isActive }) =>
            `flex-1 flex flex-col items-center justify-center py-1 text-center transition-colors ${
              isActive ? 'text-indigo-600 font-bold' : 'text-slate-500 hover:text-slate-800'
            }`
          }
        >
          <Map className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] tracking-tight leading-none">Map</span>
        </NavLink>

        {/* Tab 3: Center Elevated Report FAB */}
        <div className="flex-1 flex items-center justify-center relative -top-3">
          <NavLink
            to="/report/new"
            aria-label="Report new civic issue"
            className={({ isActive }) =>
              `w-12 h-12 rounded-full flex flex-col items-center justify-center text-white shadow-lg transition-transform active:scale-95 ${
                isActive
                  ? 'bg-indigo-700 ring-4 ring-indigo-200 scale-105'
                  : 'bg-indigo-600 hover:bg-indigo-700'
              }`
            }
          >
            <Plus className="w-6 h-6 stroke-[2.5]" />
          </NavLink>
        </div>

        {/* Tab 4: Analytics */}
        <NavLink
          to="/analytics"
          className={({ isActive }) =>
            `flex-1 flex flex-col items-center justify-center py-1 text-center transition-colors ${
              isActive ? 'text-indigo-600 font-bold' : 'text-slate-500 hover:text-slate-800'
            }`
          }
        >
          <BarChart2 className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] tracking-tight leading-none">Analytics</span>
        </NavLink>

        {/* Tab 5: Profile */}
        <NavLink
          to="/profile"
          className={({ isActive }) =>
            `flex-1 flex flex-col items-center justify-center py-1 text-center transition-colors ${
              isActive ? 'text-indigo-600 font-bold' : 'text-slate-500 hover:text-slate-800'
            }`
          }
        >
          <User className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] tracking-tight leading-none">Profile</span>
        </NavLink>

      </div>
    </nav>
  );
};
