import React, { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Navbar } from './Navbar';
import { BottomNav } from './BottomNav';
import { ChatWidget } from '../ChatWidget';

interface AppLayoutProps {
  children: ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen flex flex-col bg-[#F5F0EB]/30 text-slate-900 w-full max-w-full overflow-x-hidden font-sans">
      <Navbar />
      <main className={`flex-1 ${user ? 'pb-20 md:pb-10' : 'pb-10'} w-full max-w-full overflow-x-hidden`}>
        {children}
      </main>
      
      {/* Citizen AI Assistant Chat Widget (Authenticated Routes Only) */}
      {user && <ChatWidget />}

      {/* Bento Grid Civic Systems Footer */}
      <footer className="hidden md:flex h-12 bg-white border-t border-slate-200 px-6 sm:px-8 items-center justify-between text-[10px] font-bold text-slate-400 shrink-0 uppercase tracking-[0.2em]">
        <div>© 2026 FIXMYAREA CIVIC SYSTEMS</div>
        <div className="flex gap-8 items-center">
          <span className="text-teal-800 flex items-center gap-1.5 cursor-pointer hover:underline">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            Civic Systems: Active
          </span>
          {user ? (
            <Link to="/admin" className="cursor-pointer text-slate-700 hover:text-teal-800 transition-colors">
              Municipal Portal
            </Link>
          ) : (
            <Link to="/login" className="cursor-pointer text-slate-700 hover:text-teal-800 transition-colors">
              Citizen Sign In
            </Link>
          )}
        </div>
      </footer>

      {/* Mobile Bottom Navigation (Authenticated Only) */}
      {user && <BottomNav />}
    </div>
  );
};
