import React, { useState } from "react";
import api from "../api";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("admin@acme.com");
  const [password, setPassword] = useState("password");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const demoAccounts = [
    { label: "Admin (Acme)", email: "admin@acme.com", role: "admin", desc: "Full team & SLA access" },
    { label: "Agent (Acme)", email: "agent1@acme.com", role: "agent", desc: "Ticket queue & internal notes" },
    { label: "Customer (Acme)", email: "customer1@acme.com", role: "customer", desc: "Client ticket portal" },
    { label: "Beta Org (Tenant B)", email: "admin@beta.com", role: "tenant-b", desc: "Isolated org proof" },
  ];

  async function handleLogin(e, customEmail = null, customPass = null) {
    if (e) e.preventDefault();

    setLoading(true);
    setError("");

    const loginEmail = customEmail || email;
    const loginPass = customPass || password;

    try {
      const response = await api.post("/login", {
        email: loginEmail,
        password: loginPass,
      });

      localStorage.setItem("token", response.data.token);
      localStorage.setItem("user", JSON.stringify(response.data.user));

      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Invalid email or password");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 flex items-center justify-center p-4 sm:p-6 text-slate-100 font-sans relative overflow-hidden">
      {/* Background visual accents */}
      <div className="absolute top-1/4 -left-20 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-md relative z-10">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-500 to-cyan-400 text-white shadow-xl shadow-blue-500/25 mb-4 ring-4 ring-white/10">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white sm:text-3xl">
            Pulse<span className="text-blue-400">Desk</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">Next-Generation Multi-Tenant Help Desk</p>
        </div>

        {/* Login Card */}
        <div className="bg-white/10 backdrop-blur-xl border border-white/15 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-black/40">
          <h2 className="text-lg font-bold text-white mb-1">Sign In</h2>
          <p className="text-xs text-slate-400 mb-6">Enter your credentials to access your support workspace</p>

          {error && (
            <div className="mb-4 p-3.5 bg-rose-500/20 border border-rose-500/30 text-rose-300 rounded-xl text-xs flex items-center gap-2">
              <svg className="w-4 h-4 text-rose-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Work Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                className="w-full px-4 py-2.5 bg-slate-900/60 border border-white/10 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                  Password
                </label>
                <span className="text-[11px] text-blue-400">Default: password</span>
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-2.5 bg-slate-900/60 border border-white/10 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold text-sm rounded-xl shadow-lg shadow-blue-500/25 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  <span>Authenticating...</span>
                </>
              ) : (
                'Sign In to Desk'
              )}
            </button>
          </form>

          {/* Quick Demo Logins */}
          <div className="mt-8 pt-6 border-t border-white/10">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">⚡ 1-Click Demo Accounts</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {demoAccounts.map((acc) => (
                <button
                  key={acc.email}
                  type="button"
                  onClick={() => {
                    setEmail(acc.email);
                    setPassword("password");
                    handleLogin(null, acc.email, "password");
                  }}
                  className="p-2.5 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-blue-400/50 rounded-xl text-left transition-all group"
                >
                  <div className="text-xs font-bold text-white group-hover:text-blue-400 transition-colors">
                    {acc.label}
                  </div>
                  <div className="text-[10px] text-slate-400 truncate">{acc.desc}</div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer info */}
        <p className="text-center text-xs text-slate-500 mt-6">
          Multi-tenant tenant isolation with Laravel Sanctum & React
        </p>
      </div>
    </div>
  );
}
