import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import Layout from '../components/Layout';
import Toast from '../components/Toast';
import QuickTicketModal from '../components/QuickTicketModal';

export default function Dashboard() {
  const navigate = useNavigate();

  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('all');
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toast, setToast] = useState({ message: '', type: 'success' });
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [hoveredDonutSlice, setHoveredDonutSlice] = useState(null);

  const fetchDashboard = useCallback(async (range = timeRange, showSpinner = true) => {
    if (showSpinner) setLoading(true);
    setIsRefreshing(true);
    try {
      const { data } = await api.get('/dashboard', {
        params: { time_range: range },
      });
      setStats(data);
    } catch (err) {
      console.error('Failed to load dashboard:', err);
      setToast({ message: 'Error loading dashboard metrics', type: 'error' });
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [timeRange]);

  useEffect(() => {
    fetchDashboard(timeRange, true);
  }, [timeRange, fetchDashboard]);

  // Auto-refresh interval
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      fetchDashboard(timeRange, false);
    }, 25000);
    return () => clearInterval(interval);
  }, [autoRefresh, timeRange, fetchDashboard]);

  // Quick inline status update
  const handleQuickStatusChange = async (ticketId, newStatus) => {
    try {
      await api.patch(`/tickets/${ticketId}/quick-update`, { status: newStatus });
      setToast({ message: `Ticket #${ticketId} status updated to ${newStatus}`, type: 'success' });
      fetchDashboard(timeRange, false);
    } catch (err) {
      setToast({ message: err.response?.data?.message || 'Failed to update status', type: 'error' });
    }
  };

  // Export CSV download
  const handleExportCsv = () => {
    const token = localStorage.getItem('token');
    const url = `http://localhost:8000/api/tickets/export/csv`;
    fetch(url, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.blob())
      .then(blob => {
        const downloadUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = `tickets-export-${new Date().toISOString().slice(0, 10)}.csv`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        setToast({ message: 'Ticket report exported successfully!', type: 'success' });
      })
      .catch(() => setToast({ message: 'Failed to export CSV', type: 'error' }));
  };

  const statusColors = {
    open: { border: 'border-blue-200', bg: 'bg-blue-50/70', text: 'text-blue-700', pill: 'bg-blue-100 text-blue-800', hex: '#3b82f6' },
    pending: { border: 'border-amber-200', bg: 'bg-amber-50/70', text: 'text-amber-700', pill: 'bg-amber-100 text-amber-800', hex: '#f59e0b' },
    resolved: { border: 'border-emerald-200', bg: 'bg-emerald-50/70', text: 'text-emerald-700', pill: 'bg-emerald-100 text-emerald-800', hex: '#10b981' },
    closed: { border: 'border-slate-200', bg: 'bg-slate-50/70', text: 'text-slate-600', pill: 'bg-slate-100 text-slate-700', hex: '#64748b' },
  };

  const priorityColors = {
    urgent: { bg: 'bg-red-500', pill: 'bg-red-100 text-red-700 border-red-200' },
    high: { bg: 'bg-orange-500', pill: 'bg-orange-100 text-orange-700 border-orange-200' },
    medium: { bg: 'bg-amber-500', pill: 'bg-amber-100 text-amber-700 border-amber-200' },
    low: { bg: 'bg-emerald-500', pill: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  };

  // Helper for Donut slices
  const totalStatusCount = stats ? (
    (stats.by_status?.open || 0) +
    (stats.by_status?.pending || 0) +
    (stats.by_status?.resolved || 0) +
    (stats.by_status?.closed || 0)
  ) : 0;

  const donutSlices = [
    { label: 'Open', key: 'open', val: stats?.by_status?.open || 0, color: '#3b82f6' },
    { label: 'Pending', key: 'pending', val: stats?.by_status?.pending || 0, color: '#f59e0b' },
    { label: 'Resolved', key: 'resolved', val: stats?.by_status?.resolved || 0, color: '#10b981' },
    { label: 'Closed', key: 'closed', val: stats?.by_status?.closed || 0, color: '#94a3b8' },
  ];

  let accumulatedPercent = 0;
  const donutSegments = donutSlices.map(slice => {
    const percent = totalStatusCount > 0 ? (slice.val / totalStatusCount) * 100 : 0;
    const strokeDasharray = `${percent} ${100 - percent}`;
    const strokeDashoffset = -accumulatedPercent;
    accumulatedPercent += percent;
    return { ...slice, percent, strokeDasharray, strokeDashoffset };
  });

  return (
    <Layout onNewTicketClick={() => setIsModalOpen(true)}>
      <Toast
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ message: '', type: 'success' })}
      />

      <QuickTicketModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCreated={(newTicket) => {
          setToast({ message: `Ticket #${newTicket.id} created successfully!`, type: 'success' });
          fetchDashboard(timeRange, false);
        }}
      />

      {/* Top Header & Interactive Filter Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
              Support Command Center
            </h1>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-800">
              Live Real-time
            </span>
          </div>
          <p className="text-sm text-slate-500">
            Monitor incoming requests, enforce SLAs, and coordinate resolution workflows
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {/* Time range selector */}
          <div className="flex items-center bg-white border border-slate-200/90 rounded-xl p-1 shadow-xs">
            {[
              { id: 'today', label: 'Today' },
              { id: '7d', label: '7 Days' },
              { id: '30d', label: '30 Days' },
              { id: 'all', label: 'All Time' },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setTimeRange(t.id)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  timeRange === t.id
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Auto Refresh Toggle */}
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all ${
              autoRefresh
                ? 'bg-emerald-50 text-emerald-700 border-emerald-300 shadow-xs'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
            title="Auto-refresh metrics every 25 seconds"
          >
            <span className={`w-2 h-2 rounded-full ${autoRefresh ? 'bg-emerald-500 animate-ping' : 'bg-slate-400'}`}></span>
            <span>Live Stream</span>
          </button>

          {/* Manual Refresh */}
          <button
            onClick={() => fetchDashboard(timeRange, false)}
            disabled={isRefreshing}
            className="p-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl transition-all shadow-xs disabled:opacity-50"
            title="Refresh dashboard data"
          >
            <svg
              className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-blue-600' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>

          {/* Export CSV */}
          <button
            onClick={handleExportCsv}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-white border border-slate-200 hover:border-slate-300 text-slate-700 text-xs font-semibold rounded-xl shadow-xs hover:bg-slate-50 transition-all"
          >
            <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span>Export CSV</span>
          </button>

          {/* New Ticket Trigger */}
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-semibold rounded-xl shadow-sm shadow-blue-500/20 hover:shadow-md transition-all"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
            </svg>
            <span>Create Ticket</span>
          </button>
        </div>
      </div>

      {/* Loading Skeleton if initial */}
      {loading && !stats ? (
        <div className="space-y-6 animate-pulse">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-28 bg-slate-200 rounded-2xl"></div>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="h-72 bg-slate-200 rounded-2xl col-span-2"></div>
            <div className="h-72 bg-slate-200 rounded-2xl"></div>
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Top KPI Cards (Interactive Filter Links) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Open Tickets */}
            <div
              onClick={() => navigate('/tickets?status=open')}
              className="bg-white border border-blue-100 rounded-2xl p-5 shadow-xs hover:shadow-md hover:border-blue-400 hover:-translate-y-0.5 transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-blue-600">Open Tickets</span>
                <span className="p-2 bg-blue-50 text-blue-600 rounded-xl group-hover:scale-110 transition-transform">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </span>
              </div>
              <div className="flex items-baseline justify-between">
                <div className="text-3xl font-black text-slate-900">{stats?.by_status?.open || 0}</div>
                <span className="text-xs text-blue-600 font-semibold group-hover:underline">View queue →</span>
              </div>
              <div className="mt-3 w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-blue-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${totalStatusCount ? ((stats?.by_status?.open || 0) / totalStatusCount) * 100 : 0}%` }}
                ></div>
              </div>
            </div>

            {/* Pending Tickets */}
            <div
              onClick={() => navigate('/tickets?status=pending')}
              className="bg-white border border-amber-100 rounded-2xl p-5 shadow-xs hover:shadow-md hover:border-amber-400 hover:-translate-y-0.5 transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-600">Pending Review</span>
                <span className="p-2 bg-amber-50 text-amber-600 rounded-xl group-hover:scale-110 transition-transform">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </span>
              </div>
              <div className="flex items-baseline justify-between">
                <div className="text-3xl font-black text-slate-900">{stats?.by_status?.pending || 0}</div>
                <span className="text-xs text-amber-600 font-semibold group-hover:underline">Awaiting reply →</span>
              </div>
              <div className="mt-3 w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-amber-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${totalStatusCount ? ((stats?.by_status?.pending || 0) / totalStatusCount) * 100 : 0}%` }}
                ></div>
              </div>
            </div>

            {/* Resolved Tickets */}
            <div
              onClick={() => navigate('/tickets?status=resolved')}
              className="bg-white border border-emerald-100 rounded-2xl p-5 shadow-xs hover:shadow-md hover:border-emerald-400 hover:-translate-y-0.5 transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">Resolved</span>
                <span className="p-2 bg-emerald-50 text-emerald-600 rounded-xl group-hover:scale-110 transition-transform">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                </span>
              </div>
              <div className="flex items-baseline justify-between">
                <div className="text-3xl font-black text-slate-900">{stats?.by_status?.resolved || 0}</div>
                <span className="text-xs text-emerald-600 font-semibold">{stats?.resolution_rate || 0}% closed</span>
              </div>
              <div className="mt-3 w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${totalStatusCount ? ((stats?.by_status?.resolved || 0) / totalStatusCount) * 100 : 0}%` }}
                ></div>
              </div>
            </div>

            {/* SLA Breached Card (Interactive Warning Alert) */}
            <div
              onClick={() => navigate('/tickets?sla_breached=true')}
              className={`rounded-2xl p-5 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer group border ${
                (stats?.sla_breached_count || 0) > 0
                  ? 'bg-gradient-to-br from-rose-50 to-red-50/50 border-rose-200 hover:border-rose-400'
                  : 'bg-white border-slate-200'
              }`}
            >
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-rose-600 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
                  SLA Breached
                </span>
                <span className="p-2 bg-rose-100 text-rose-700 rounded-xl group-hover:scale-110 transition-transform">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </span>
              </div>
              <div className="flex items-baseline justify-between">
                <div className="text-3xl font-black text-rose-600">{stats?.sla_breached_count || 0}</div>
                <span className="text-xs text-rose-600 font-semibold group-hover:underline">Urgent fix →</span>
              </div>
              <div className="mt-3 text-[11px] text-rose-700/80 font-medium">
                {(stats?.sla_breached_count || 0) > 0 ? 'Requires immediate action' : 'All tickets within SLA target'}
              </div>
            </div>

            {/* Total Velocity / Response metric */}
            <div className="bg-white border border-indigo-100 rounded-2xl p-5 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">Avg First Reply</span>
                <span className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </span>
              </div>
              <div className="flex items-baseline justify-between">
                <div className="text-3xl font-black text-slate-900">{stats?.avg_first_response_mins || 0}<span className="text-sm font-semibold text-slate-400 ml-1">min</span></div>
                <span className="text-xs text-indigo-600 font-semibold">Target &lt; 60m</span>
              </div>
              <div className="mt-3 text-[11px] text-slate-500">
                Total scope: <span className="font-semibold text-slate-700">{stats?.total_count || 0}</span> tickets
              </div>
            </div>
          </div>

          {/* Interactive Visual Analytics Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* 7-Day Trend Chart (Area / Bar hybrid) */}
            <div className="lg:col-span-2 bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-base font-bold text-slate-900">7-Day Ticket Volume & Resolution</h2>
                  <p className="text-xs text-slate-500">Compare incoming requests vs resolved tickets</p>
                </div>
                <div className="flex items-center gap-4 text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-sm bg-blue-500"></span>
                    <span className="text-slate-600 font-medium">Created</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-sm bg-emerald-500"></span>
                    <span className="text-slate-600 font-medium">Resolved</span>
                  </div>
                </div>
              </div>

              {/* SVG Trend Bar Chart */}
              <div className="h-60 w-full flex items-end justify-between gap-3 pt-6 pb-2 px-2">
                {stats?.daily_trends?.map((item, idx) => {
                  const maxVal = Math.max(
                    ...stats.daily_trends.map(d => Math.max(d.created, d.resolved, 4))
                  );
                  const createdHeight = Math.max(12, (item.created / maxVal) * 160);
                  const resolvedHeight = Math.max(8, (item.resolved / maxVal) * 160);

                  return (
                    <div key={idx} className="flex-1 flex flex-col items-center gap-2 group relative">
                      {/* Tooltip on hover */}
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-12 z-20 bg-slate-900 text-white text-[10px] rounded-lg px-2.5 py-1 shadow-lg pointer-events-none whitespace-nowrap">
                        <div>{item.date} ({item.day})</div>
                        <div className="font-bold text-blue-400">Created: {item.created}</div>
                        <div className="font-bold text-emerald-400">Resolved: {item.resolved}</div>
                      </div>

                      {/* Bar Group */}
                      <div className="w-full flex items-end justify-center gap-1.5 h-44">
                        {/* Created bar */}
                        <div
                          style={{ height: `${createdHeight}px` }}
                          className="w-1/2 max-w-7 bg-blue-500 rounded-t-md hover:bg-blue-600 transition-all shadow-xs group-hover:brightness-110"
                        ></div>
                        {/* Resolved bar */}
                        <div
                          style={{ height: `${resolvedHeight}px` }}
                          className="w-1/2 max-w-7 bg-emerald-500 rounded-t-md hover:bg-emerald-600 transition-all shadow-xs group-hover:brightness-110"
                        ></div>
                      </div>

                      {/* Day Label */}
                      <span className="text-[11px] font-semibold text-slate-500 group-hover:text-slate-900 transition-colors">
                        {item.day}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Interactive Donut Breakdown Chart */}
            <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs flex flex-col justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900">Status Distribution</h2>
                <p className="text-xs text-slate-500">Live ticket breakdown by lifecycle stage</p>
              </div>

              {/* Donut graphic */}
              <div className="relative my-4 flex items-center justify-center">
                <svg className="w-48 h-48 transform -rotate-90" viewBox="0 0 40 40">
                  <circle
                    cx="20"
                    cy="20"
                    r="15.91549430918954"
                    fill="transparent"
                    stroke="#f1f5f9"
                    strokeWidth="4"
                  />
                  {donutSegments.map((slice) => (
                    <circle
                      key={slice.key}
                      cx="20"
                      cy="20"
                      r="15.91549430918954"
                      fill="transparent"
                      stroke={slice.color}
                      strokeWidth={hoveredDonutSlice === slice.key ? "5.5" : "4"}
                      strokeDasharray={slice.strokeDasharray}
                      strokeDashoffset={slice.strokeDashoffset}
                      onMouseEnter={() => setHoveredDonutSlice(slice.key)}
                      onMouseLeave={() => setHoveredDonutSlice(null)}
                      className="cursor-pointer transition-all duration-300"
                    />
                  ))}
                </svg>

                {/* Center text in donut */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
                  <span className="text-2xl font-black text-slate-900">
                    {hoveredDonutSlice
                      ? donutSlices.find(s => s.key === hoveredDonutSlice)?.val
                      : totalStatusCount}
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    {hoveredDonutSlice
                      ? donutSlices.find(s => s.key === hoveredDonutSlice)?.label
                      : 'Tickets'}
                  </span>
                </div>
              </div>

              {/* Interactive Legend pills */}
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
                {donutSlices.map((slice) => (
                  <button
                    key={slice.key}
                    onClick={() => navigate(`/tickets?status=${slice.key}`)}
                    onMouseEnter={() => setHoveredDonutSlice(slice.key)}
                    onMouseLeave={() => setHoveredDonutSlice(null)}
                    className={`flex items-center justify-between p-2 rounded-xl text-left border transition-all ${
                      hoveredDonutSlice === slice.key
                        ? 'bg-slate-50 border-slate-300 shadow-xs'
                        : 'border-transparent hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: slice.color }}></span>
                      <span className="text-xs font-semibold text-slate-700">{slice.label}</span>
                    </div>
                    <span className="text-xs font-black text-slate-900">{slice.val}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Middle Row: Priority Spectrum & Team Leaderboard */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Priority Distribution Spectrum */}
            <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-bold text-slate-900">Priority Spectrum</h2>
                <span className="text-xs text-slate-400">Severity split</span>
              </div>

              <div className="space-y-4">
                {[
                  { key: 'urgent', label: 'Urgent (2h SLA)', color: 'bg-rose-500', barBg: 'bg-rose-100', text: 'text-rose-600' },
                  { key: 'high', label: 'High (8h SLA)', color: 'bg-orange-500', barBg: 'bg-orange-100', text: 'text-orange-600' },
                  { key: 'medium', label: 'Medium (24h SLA)', color: 'bg-amber-500', barBg: 'bg-amber-100', text: 'text-amber-600' },
                  { key: 'low', label: 'Low (48h SLA)', color: 'bg-emerald-500', barBg: 'bg-emerald-100', text: 'text-emerald-600' },
                ].map((p) => {
                  const count = stats?.by_priority?.[p.key] || 0;
                  const pct = totalStatusCount ? Math.round((count / totalStatusCount) * 100) : 0;
                  return (
                    <div
                      key={p.key}
                      onClick={() => navigate(`/tickets?priority=${p.key}`)}
                      className="cursor-pointer group"
                    >
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <span className="font-semibold text-slate-700 group-hover:text-blue-600 transition-colors">
                          {p.label}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="font-black text-slate-900">{count}</span>
                          <span className="text-[10px] text-slate-400 font-medium">({pct}%)</span>
                        </div>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                        <div
                          className={`h-full ${p.color} rounded-full transition-all duration-500 group-hover:brightness-110`}
                          style={{ width: `${pct}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Agent Workload & Leaderboard */}
            <div className="lg:col-span-2 bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-base font-bold text-slate-900">Support Staff Workload</h2>
                  <p className="text-xs text-slate-500">Assigned volume and active tasks per team member</p>
                </div>
                <button
                  onClick={() => navigate('/tickets')}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-700"
                >
                  View all assignments →
                </button>
              </div>

              <div className="space-y-3">
                {stats?.agent_stats?.map((agent) => (
                  <div
                    key={agent.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 hover:border-slate-200 transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold text-xs flex items-center justify-center shadow-xs">
                        {agent.name.charAt(0)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-900">{agent.name}</span>
                          <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded">
                            {agent.role}
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-400">{agent.email}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-xs font-medium">
                      <div className="text-center sm:text-right">
                        <div className="text-slate-900 font-bold">{agent.assigned_count} assigned</div>
                        <div className="text-[11px] text-slate-500">{agent.open_count} open</div>
                      </div>

                      {agent.urgent_count > 0 && (
                        <span className="px-2 py-0.5 rounded-md bg-rose-100 text-rose-700 text-[10px] font-bold border border-rose-200">
                          {agent.urgent_count} urgent
                        </span>
                      )}

                      <button
                        onClick={() => navigate(`/tickets?assignee_id=${agent.id}`)}
                        className="px-2.5 py-1 text-[11px] font-semibold text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        Queue →
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Bottom Grid: Recent Tickets with Quick Inline Status & Live Activity Feed */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Recent Tickets Table with Quick Inline Actions */}
            <div className="lg:col-span-2 bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-base font-bold text-slate-900">Recent Priority Tickets</h2>
                  <p className="text-xs text-slate-500">Quickly toggle status or inspect ticket details</p>
                </div>
                <button
                  onClick={() => navigate('/tickets')}
                  className="text-xs font-bold text-blue-600 hover:underline"
                >
                  Browse Full Table →
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                      <th className="pb-3 pr-2">ID</th>
                      <th className="pb-3 px-3">Subject</th>
                      <th className="pb-3 px-3">Priority</th>
                      <th className="pb-3 px-3">Status</th>
                      <th className="pb-3 px-3">Assignee</th>
                      <th className="pb-3 pl-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {stats?.recent_tickets?.map((t) => (
                      <tr key={t.id} className="hover:bg-slate-50/80 transition-colors group">
                        <td className="py-3 pr-2 font-mono text-slate-400">#{t.id}</td>
                        <td className="py-3 px-3">
                          <button
                            onClick={() => setSelectedTicket(t)}
                            className="font-bold text-slate-900 hover:text-blue-600 text-left line-clamp-1 group-hover:text-blue-600 transition-colors"
                          >
                            {t.subject}
                          </button>
                          <div className="text-[10px] text-slate-400 mt-0.5">
                            by {t.requester?.name || 'Customer'}
                          </div>
                        </td>
                        <td className="py-3 px-3">
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${priorityColors[t.priority]?.pill || 'bg-slate-100'}`}>
                            {t.priority}
                          </span>
                        </td>
                        {/* Interactive Status Changer directly from row */}
                        <td className="py-3 px-3">
                          <select
                            value={t.status}
                            onChange={(e) => handleQuickStatusChange(t.id, e.target.value)}
                            className={`px-2 py-1 rounded-lg text-[11px] font-bold uppercase tracking-wider border focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all ${
                              statusColors[t.status]?.pill || 'bg-slate-100'
                            }`}
                          >
                            <option value="open">Open</option>
                            <option value="pending">Pending</option>
                            <option value="resolved">Resolved</option>
                            <option value="closed">Closed</option>
                          </select>
                        </td>
                        <td className="py-3 px-3 text-slate-600 font-medium">
                          {t.assignee?.name || <span className="text-slate-400 italic">Unassigned</span>}
                        </td>
                        <td className="py-3 pl-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => setSelectedTicket(t)}
                              className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Quick Drawer View"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => navigate(`/tickets/${t.id}`)}
                              className="p-1.5 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                              title="Open Full Ticket Page"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Live Activity Log Stream */}
            <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse"></span>
                  <h2 className="text-base font-bold text-slate-900">Audit Stream</h2>
                </div>
                <span className="text-[11px] text-slate-400">Live events</span>
              </div>

              <div className="space-y-3 flex-1 overflow-y-auto max-h-96 pr-1">
                {stats?.recent_activity?.length === 0 ? (
                  <div className="text-center text-xs text-slate-400 py-8">
                    No recent activity records.
                  </div>
                ) : (
                  stats?.recent_activity?.map((act) => (
                    <div key={act.id} className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-slate-50 transition-colors">
                      <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                        {act.user?.name ? act.user.name.charAt(0) : 'S'}
                      </div>
                      <div className="text-xs flex-1">
                        <div className="text-slate-800">
                          <span className="font-bold">{act.user?.name || 'User'}</span>{' '}
                          <span className="text-slate-500">{act.action.replace('_', ' ')}</span>{' '}
                          {act.ticket && (
                            <span
                              onClick={() => navigate(`/tickets/${act.ticket.id}`)}
                              className="font-semibold text-blue-600 cursor-pointer hover:underline"
                            >
                              #{act.ticket.id}
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          {new Date(act.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quick View Drawer Modal */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-slate-900/40 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-md bg-white h-full shadow-2xl p-6 flex flex-col justify-between overflow-y-auto border-l border-slate-200">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-slate-400">#{selectedTicket.id}</span>
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${priorityColors[selectedTicket.priority]?.pill}`}>
                    {selectedTicket.priority}
                  </span>
                </div>
                <button
                  onClick={() => setSelectedTicket(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="mt-4">
                <h3 className="text-lg font-bold text-slate-900">{selectedTicket.subject}</h3>
                <p className="text-xs text-slate-600 mt-2 bg-slate-50 p-3 rounded-xl border border-slate-100 whitespace-pre-wrap leading-relaxed">
                  {selectedTicket.description}
                </p>
              </div>

              <div className="mt-6 space-y-3 text-xs">
                <div className="flex justify-between py-2 border-b border-slate-100">
                  <span className="text-slate-500">Status</span>
                  <select
                    value={selectedTicket.status}
                    onChange={(e) => {
                      const newStatus = e.target.value;
                      handleQuickStatusChange(selectedTicket.id, newStatus);
                      setSelectedTicket({ ...selectedTicket, status: newStatus });
                    }}
                    className={`px-2 py-0.5 rounded-md text-xs font-bold uppercase tracking-wider border ${statusColors[selectedTicket.status]?.pill}`}
                  >
                    <option value="open">Open</option>
                    <option value="pending">Pending</option>
                    <option value="resolved">Resolved</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>

                <div className="flex justify-between py-2 border-b border-slate-100">
                  <span className="text-slate-500">Requester</span>
                  <span className="font-semibold text-slate-800">{selectedTicket.requester?.name || 'Customer'}</span>
                </div>

                <div className="flex justify-between py-2 border-b border-slate-100">
                  <span className="text-slate-500">Assignee</span>
                  <span className="font-semibold text-slate-800">{selectedTicket.assignee?.name || 'Unassigned'}</span>
                </div>

                <div className="flex justify-between py-2 border-b border-slate-100">
                  <span className="text-slate-500">SLA Condition</span>
                  <span className={selectedTicket.sla_breached ? 'text-rose-600 font-bold' : 'text-emerald-600 font-semibold'}>
                    {selectedTicket.sla_breached ? '⚠️ Breached' : '✅ Within Target'}
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-slate-100 flex gap-3">
              <button
                onClick={() => navigate(`/tickets/${selectedTicket.id}`)}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-2"
              >
                <span>Open Full Discussion</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
