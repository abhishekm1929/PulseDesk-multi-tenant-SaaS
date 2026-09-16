import React, { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../api';
import Layout from '../components/Layout';
import Toast from '../components/Toast';
import QuickTicketModal from '../components/QuickTicketModal';

export default function TicketList() {
  const [searchParams, setSearchParams] = useSearchParams();

  const [tickets, setTickets] = useState([]);
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toast, setToast] = useState({ message: '', type: 'success' });

  // Filters state initialized from search params if any
  const [filters, setFilters] = useState({
    status: searchParams.get('status') || '',
    priority: searchParams.get('priority') || '',
    assignee_id: searchParams.get('assignee_id') || '',
    sla_breached: searchParams.get('sla_breached') === 'true',
    search: '',
  });

  const fetchAgents = async () => {
    try {
      const { data } = await api.get('/agents');
      setAgents(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchTickets = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (filters.status) params.status = filters.status;
      if (filters.priority) params.priority = filters.priority;
      if (filters.assignee_id) params.assignee_id = filters.assignee_id;
      if (filters.sla_breached) params.sla_breached = true;
      if (filters.search) params.search = filters.search;

      const { data } = await api.get('/tickets', { params });
      setTickets(data.data || []);
    } catch (err) {
      console.error(err);
      setToast({ message: 'Error fetching tickets', type: 'error' });
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchAgents();
  }, []);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  // Quick inline status change
  const handleInlineStatusChange = async (ticketId, newStatus) => {
    try {
      await api.patch(`/tickets/${ticketId}/quick-update`, { status: newStatus });
      setToast({ message: `Ticket #${ticketId} status changed to ${newStatus}`, type: 'success' });
      setTickets(prev =>
        prev.map(t => (t.id === ticketId ? { ...t, status: newStatus } : t))
      );
    } catch (err) {
      setToast({ message: err.response?.data?.message || 'Failed to update status', type: 'error' });
    }
  };

  // Quick inline assignee change
  const handleInlineAssigneeChange = async (ticketId, newAssigneeId) => {
    try {
      const payload = { assignee_id: newAssigneeId ? Number(newAssigneeId) : null };
      const { data } = await api.patch(`/tickets/${ticketId}/quick-update`, payload);
      setToast({ message: `Ticket #${ticketId} reassigned`, type: 'success' });
      setTickets(prev =>
        prev.map(t => (t.id === ticketId ? { ...t, assignee: data.assignee } : t))
      );
    } catch (err) {
      setToast({ message: err.response?.data?.message || 'Failed to reassign', type: 'error' });
    }
  };

  // Export CSV
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
    open: 'bg-blue-50 text-blue-700 border-blue-200',
    pending: 'bg-amber-50 text-amber-700 border-amber-200',
    resolved: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    closed: 'bg-slate-100 text-slate-700 border-slate-200',
  };

  const priorityColors = {
    urgent: 'bg-rose-100 text-rose-700 border-rose-200',
    high: 'bg-orange-100 text-orange-700 border-orange-200',
    medium: 'bg-amber-100 text-amber-700 border-amber-200',
    low: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  };

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
          fetchTickets();
        }}
      />

      {/* Page Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">
            Ticket Management Queue
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Filter, triage, reassign, and track ticket lifecycle across your organization
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchTickets}
            className="p-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl transition-all shadow-xs"
            title="Refresh queue"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>

          <button
            onClick={handleExportCsv}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white border border-slate-200 hover:border-slate-300 text-slate-700 text-xs font-semibold rounded-xl shadow-xs transition-all"
          >
            <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span>Export CSV</span>
          </button>

          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-sm shadow-blue-500/20 hover:shadow-md transition-all"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
            </svg>
            <span>New Ticket</span>
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-4 mb-6 shadow-xs flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[220px]">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </span>
          <input
            type="text"
            placeholder="Search tickets by subject or details..."
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
          />
        </div>

        {/* Status Filter */}
        <select
          value={filters.status}
          onChange={(e) => setFilters({ ...filters, status: e.target.value })}
          className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Statuses</option>
          <option value="open">Open</option>
          <option value="pending">Pending</option>
          <option value="resolved">Resolved</option>
          <option value="closed">Closed</option>
        </select>

        {/* Priority Filter */}
        <select
          value={filters.priority}
          onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
          className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Priorities</option>
          <option value="urgent">Urgent (2h SLA)</option>
          <option value="high">High (8h SLA)</option>
          <option value="medium">Medium (24h SLA)</option>
          <option value="low">Low (48h SLA)</option>
        </select>

        {/* Assignee Filter */}
        <select
          value={filters.assignee_id}
          onChange={(e) => setFilters({ ...filters, assignee_id: e.target.value })}
          className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Assignees</option>
          {agents.map((ag) => (
            <option key={ag.id} value={ag.id}>
              {ag.name} ({ag.role})
            </option>
          ))}
        </select>

        {/* SLA Breached Toggle */}
        <button
          onClick={() => setFilters({ ...filters, sla_breached: !filters.sla_breached })}
          className={`px-3 py-2 rounded-xl text-xs font-semibold border flex items-center gap-1.5 transition-all ${
            filters.sla_breached
              ? 'bg-rose-50 text-rose-700 border-rose-300 shadow-xs'
              : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
          }`}
        >
          <span className={`w-2 h-2 rounded-full ${filters.sla_breached ? 'bg-rose-500 animate-pulse' : 'bg-slate-400'}`}></span>
          <span>SLA Breached Only</span>
        </button>

        {/* Reset */}
        {(filters.status || filters.priority || filters.assignee_id || filters.sla_breached || filters.search) && (
          <button
            onClick={() => setFilters({ status: '', priority: '', assignee_id: '', sla_breached: false, search: '' })}
            className="px-2.5 py-2 text-xs font-semibold text-slate-400 hover:text-slate-700 transition-colors"
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Tickets Table */}
      <div className="bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-xs flex flex-col items-center justify-center gap-2">
            <svg className="w-6 h-6 animate-spin text-blue-600" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
            <span>Loading support tickets...</span>
          </div>
        ) : tickets.length === 0 ? (
          <div className="p-16 text-center">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 mx-auto flex items-center justify-center mb-3">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-sm font-bold text-slate-800">No tickets found</h3>
            <p className="text-xs text-slate-500 mt-1">Try adjusting your active filters or create a new ticket.</p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold hover:bg-blue-700 transition-colors"
            >
              + Create Ticket
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 border-b border-slate-100 text-slate-500 uppercase tracking-wider text-[10px] font-bold">
                <tr>
                  <th className="py-3 px-4">Ticket</th>
                  <th className="py-3 px-3">Priority</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3">Assignee</th>
                  <th className="py-3 px-3">Requester</th>
                  <th className="py-3 px-3">Created</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {tickets.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50/70 transition-colors group">
                    <td className="py-3.5 px-4 max-w-sm">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-slate-400 font-semibold text-[11px]">#{t.id}</span>
                        <Link
                          to={`/tickets/${t.id}`}
                          className="font-bold text-slate-900 hover:text-blue-600 transition-colors line-clamp-1"
                        >
                          {t.subject}
                        </Link>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        {t.sla_breached && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-rose-100 text-rose-700 border border-rose-200">
                            SLA Breached
                          </span>
                        )}
                        {Array.isArray(t.tags) && t.tags.map((tag, i) => (
                          <span key={i} className="text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.2 rounded">
                            #{tag}
                          </span>
                        ))}
                      </div>
                    </td>

                    <td className="py-3.5 px-3">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${priorityColors[t.priority] || 'bg-slate-100'}`}>
                        {t.priority}
                      </span>
                    </td>

                    {/* Interactive Inline Status Dropdown */}
                    <td className="py-3.5 px-3">
                      <select
                        value={t.status}
                        onChange={(e) => handleInlineStatusChange(t.id, e.target.value)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold uppercase tracking-wider border focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer transition-all ${
                          statusColors[t.status] || 'bg-slate-100'
                        }`}
                      >
                        <option value="open">Open</option>
                        <option value="pending">Pending</option>
                        <option value="resolved">Resolved</option>
                        <option value="closed">Closed</option>
                      </select>
                    </td>

                    {/* Interactive Inline Assignee Dropdown */}
                    <td className="py-3.5 px-3">
                      <select
                        value={t.assignee?.id || ''}
                        onChange={(e) => handleInlineAssigneeChange(t.id, e.target.value)}
                        className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                      >
                        <option value="">Unassigned</option>
                        {agents.map((ag) => (
                          <option key={ag.id} value={ag.id}>
                            {ag.name}
                          </option>
                        ))}
                      </select>
                    </td>

                    <td className="py-3.5 px-3 text-slate-600">
                      <div className="font-semibold text-slate-800">{t.requester?.name || 'Customer'}</div>
                      <div className="text-[10px] text-slate-400">{t.requester?.email}</div>
                    </td>

                    <td className="py-3.5 px-3 text-slate-400 font-medium">
                      {new Date(t.created_at).toLocaleDateString()}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <Link
                        to={`/tickets/${t.id}`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-600 text-xs font-semibold rounded-lg transition-colors"
                      >
                        <span>View</span>
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                        </svg>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Layout>
  );
}
