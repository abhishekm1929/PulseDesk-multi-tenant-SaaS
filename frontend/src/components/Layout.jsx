import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';

export default function Layout({ children, onNewTicketClick }) {
  const navigate = useNavigate();
  const location = useLocation();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const org = user.organization || {};

  const logout = () => {
    localStorage.clear();
    navigate('/login');
  };

  const navItems = [
    {
      to: '/dashboard',
      label: 'Dashboard',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
        </svg>
      ),
    },
    {
      to: '/tickets',
      label: 'Tickets',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
        </svg>
      ),
    },
  ];

  const roleBadgeStyles = {
    admin: 'bg-purple-100 text-purple-700 border-purple-200',
    agent: 'bg-blue-100 text-blue-700 border-blue-200',
    customer: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  }[user.role] || 'bg-slate-100 text-slate-700 border-slate-200';

  return (
    <div className="min-h-screen bg-slate-50/70 text-slate-800 flex flex-col font-sans">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Brand & Org Identifier */}
          <div className="flex items-center gap-6">
            <Link to="/dashboard" className="flex items-center gap-2.5 group">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-500 flex items-center justify-center text-white shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div>
                <span className="text-lg font-black tracking-tight bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                  Pulse<span className="text-blue-600">Desk</span>
                </span>
              </div>
            </Link>

            {/* Tenant Capsule */}
            {org.name && (
              <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-slate-100 rounded-full border border-slate-200/80 text-xs">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="font-semibold text-slate-700">{org.name}</span>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-white px-1.5 py-0.5 rounded text-blue-600 border border-slate-200">
                  {org.plan || 'Starter'}
                </span>
              </div>
            )}

            {/* Nav Links */}
            <nav className="hidden md:flex items-center gap-1.5 ml-2">
              {navItems.map((item) => {
                const active = location.pathname.startsWith(item.to);
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold tracking-wide transition-all ${
                      active
                        ? 'bg-blue-50 text-blue-700 shadow-xs border border-blue-100'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <span>{item.icon}</span>
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Right Action & Profile Area */}
          <div className="flex items-center gap-3">
            {onNewTicketClick ? (
              <button
                onClick={onNewTicketClick}
                className="hidden sm:flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm shadow-blue-500/20 hover:shadow-md transition-all"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
                </svg>
                <span>New Ticket</span>
              </button>
            ) : (
              <Link
                to="/tickets/new"
                className="hidden sm:flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm shadow-blue-500/20 hover:shadow-md transition-all"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
                </svg>
                <span>New Ticket</span>
              </Link>
            )}

            {/* User Profile */}
            <div className="flex items-center gap-2.5 pl-3 border-l border-slate-200">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-slate-700 to-slate-900 text-white font-bold text-xs flex items-center justify-center ring-2 ring-blue-500/20">
                {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </div>
              <div className="hidden lg:block text-left">
                <div className="text-xs font-semibold text-slate-800 leading-tight">{user.name || 'User'}</div>
                <div className="text-[10px] text-slate-400 leading-tight">{user.email}</div>
              </div>
              <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${roleBadgeStyles}`}>
                {user.role || 'Member'}
              </span>

              <button
                onClick={logout}
                title="Sign out"
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Page Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
