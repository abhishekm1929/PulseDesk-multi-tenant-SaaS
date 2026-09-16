import React, { useState, useEffect } from 'react';
import api from '../api';

export default function QuickTicketModal({ isOpen, onClose, onCreated }) {
  const [form, setForm] = useState({
    subject: '',
    description: '',
    priority: 'medium',
    assignee_id: '',
  });
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      api.get('/agents')
        .then(({ data }) => setAgents(data))
        .catch(() => setAgents([]));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const payload = {
        subject: form.subject,
        description: form.description,
        priority: form.priority,
        ...(form.assignee_id ? { assignee_id: Number(form.assignee_id) } : {}),
      };

      const { data } = await api.post('/tickets', payload);
      setForm({ subject: '', description: '', priority: 'medium', assignee_id: '' });
      onCreated(data);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create ticket.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 max-w-lg w-full overflow-hidden transition-all">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 flex items-center justify-between text-white">
          <div className="flex items-center gap-2.5">
            <span className="p-2 bg-white/10 rounded-lg">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
              </svg>
            </span>
            <div>
              <h2 className="text-base font-bold leading-none">Create New Ticket</h2>
              <p className="text-xs text-blue-100 mt-0.5">Submit a priority issue to the support queue</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-blue-100 hover:text-white hover:bg-white/10 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
              <svg className="w-4 h-4 text-red-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
              Subject <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={form.subject}
              onChange={(e) => setForm({ ...form, subject: e.target.value })}
              placeholder="e.g. Broken SSO login on staging environment"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                Priority
              </label>
              <select
                value={form.priority}
                onChange={(e) => setForm({ ...form, priority: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white capitalize transition-all"
              >
                <option value="low">🟢 Low (48h SLA)</option>
                <option value="medium">🟡 Medium (24h SLA)</option>
                <option value="high">🟠 High (8h SLA)</option>
                <option value="urgent">🔴 Urgent (2h SLA)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                Assignee
              </label>
              <select
                value={form.assignee_id}
                onChange={(e) => setForm({ ...form, assignee_id: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
              >
                <option value="">Unassigned</option>
                {agents.map((agent) => (
                  <option key={agent.id} value={agent.id}>
                    {agent.name} ({agent.role})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              required
              rows={4}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Provide steps to reproduce, user context, or expected outcome..."
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all resize-none"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm rounded-xl shadow-md shadow-blue-500/20 disabled:opacity-50 flex items-center gap-2 transition-all"
            >
              {loading ? (
                <>
                  <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  <span>Submitting...</span>
                </>
              ) : (
                'Create Ticket'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
