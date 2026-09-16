import React, { useEffect, useState, useCallback } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import api from "../api";
import Layout from "../components/Layout";
import Toast from "../components/Toast";

export default function TicketDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [ticket, setTicket] = useState(null);
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({ message: '', type: 'success' });

  // Comment reply state
  const [replyText, setReplyText] = useState("");
  const [replyType, setReplyType] = useState("public"); // 'public' or 'internal'
  const [submittingReply, setSubmittingReply] = useState(false);

  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  const isAgentOrAdmin = currentUser.role === 'admin' || currentUser.role === 'agent';

  const fetchTicket = useCallback(async () => {
    try {
      const { data } = await api.get(`/tickets/${id}`);
      setTicket(data);
    } catch (err) {
      console.error(err);
      setToast({ message: "Failed to load ticket details.", type: "error" });
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchTicket();
    api.get('/agents')
      .then(({ data }) => setAgents(data))
      .catch(() => setAgents([]));
  }, [fetchTicket]);

  // Quick single-field update
  const handleQuickFieldUpdate = async (field, value) => {
    try {
      const { data } = await api.patch(`/tickets/${id}/quick-update`, { [field]: value });
      setTicket(prev => ({
        ...prev,
        [field]: value,
        assignee: field === 'assignee_id' ? data.assignee : prev.assignee,
      }));
      setToast({ message: `Updated ${field.replace('_', ' ')} successfully!`, type: "success" });
      fetchTicket();
    } catch (err) {
      setToast({ message: err.response?.data?.message || "Update failed", type: "error" });
    }
  };

  // Submit comment reply
  const handleReplySubmit = async (e) => {
    e.preventDefault();
    if (!replyText.trim()) return;

    setSubmittingReply(true);
    try {
      await api.post(`/tickets/${id}/comments`, {
        body: replyText,
        type: isAgentOrAdmin ? replyType : 'public',
      });
      setReplyText("");
      setToast({ message: "Response posted to conversation!", type: "success" });
      fetchTicket();
    } catch (err) {
      setToast({ message: err.response?.data?.message || "Failed to post comment", type: "error" });
    } finally {
      setSubmittingReply(false);
    }
  };

  const cannedResponses = [
    "We have received your issue and our engineering team is actively investigating.",
    "Could you provide additional details, browser version, or screenshots to reproduce this?",
    "A fix has been deployed and verified. Please confirm if this resolves your issue.",
    "We will close this ticket for now. Feel free to reply if you need further assistance!",
  ];

  const statusColors = {
    open: 'bg-blue-100 text-blue-800 border-blue-200',
    pending: 'bg-amber-100 text-amber-800 border-amber-200',
    resolved: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    closed: 'bg-slate-100 text-slate-700 border-slate-200',
  };

  const priorityColors = {
    urgent: 'bg-rose-100 text-rose-700 border-rose-200',
    high: 'bg-orange-100 text-orange-700 border-orange-200',
    medium: 'bg-amber-100 text-amber-700 border-amber-200',
    low: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  };

  if (loading) {
    return (
      <Layout>
        <div className="p-16 text-center text-slate-400 text-xs flex flex-col items-center justify-center gap-2">
          <svg className="w-6 h-6 animate-spin text-blue-600" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
          <span>Loading ticket details...</span>
        </div>
      </Layout>
    );
  }

  if (!ticket) {
    return (
      <Layout>
        <div className="p-12 text-center">
          <h2 className="text-lg font-bold text-slate-800">Ticket not found</h2>
          <p className="text-xs text-slate-500 mt-1">The requested ticket does not exist or belongs to another tenant.</p>
          <Link to="/tickets" className="mt-4 inline-block px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold">
            Back to Queue
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <Toast
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ message: '', type: 'success' })}
      />

      {/* Breadcrumb & Navigation */}
      <div className="flex items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
          <Link to="/tickets" className="hover:text-blue-600 transition-colors">
            Tickets
          </Link>
          <span>/</span>
          <span className="text-slate-900 font-mono">#{ticket.id}</span>
        </div>

        <div className="flex items-center gap-2">
          {ticket.status !== 'resolved' && (
            <button
              onClick={() => handleQuickFieldUpdate('status', 'resolved')}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-all flex items-center gap-1.5"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
              <span>Mark Resolved</span>
            </button>
          )}

          {ticket.status !== 'closed' && (
            <button
              onClick={() => handleQuickFieldUpdate('status', 'closed')}
              className="px-3 py-1.5 bg-slate-700 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl shadow-xs transition-all"
            >
              Close Ticket
            </button>
          )}
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left Column: Conversation & Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Header Ticket Card */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
              <div className="flex items-center gap-2">
                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${statusColors[ticket.status] || 'bg-slate-100'}`}>
                  {ticket.status}
                </span>
                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${priorityColors[ticket.priority] || 'bg-slate-100'}`}>
                  {ticket.priority} priority
                </span>
                {ticket.sla_breached && (
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-rose-100 text-rose-700 border border-rose-200 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span>
                    SLA Breached
                  </span>
                )}
              </div>
              <span className="text-xs text-slate-400 font-medium">
                Opened {new Date(ticket.created_at).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
              </span>
            </div>

            <h1 className="text-xl font-black text-slate-900 leading-snug">
              {ticket.subject}
            </h1>

            {/* Description Body */}
            <div className="mt-4 pt-4 border-t border-slate-100">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center">
                  {ticket.requester?.name ? ticket.requester.name.charAt(0) : 'R'}
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900">{ticket.requester?.name || 'Requester'}</div>
                  <div className="text-[10px] text-slate-400">{ticket.requester?.email}</div>
                </div>
              </div>

              <div className="text-xs text-slate-700 leading-relaxed bg-slate-50/70 p-4 rounded-xl border border-slate-100 whitespace-pre-wrap">
                {ticket.description}
              </div>
            </div>
          </div>

          {/* Conversation Thread */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <span>Discussion Thread</span>
                <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full text-xs font-semibold">
                  {ticket.comments?.length || 0}
                </span>
              </h2>
            </div>

            {ticket.comments?.length === 0 ? (
              <div className="p-8 bg-white border border-slate-200/90 rounded-2xl text-center text-xs text-slate-400">
                No replies on this ticket yet. Be the first to leave a response.
              </div>
            ) : (
              ticket.comments?.map((comment) => {
                const isInternal = comment.type === 'internal';
                return (
                  <div
                    key={comment.id}
                    className={`rounded-2xl p-5 border transition-all ${
                      isInternal
                        ? 'bg-amber-50/60 border-amber-200 shadow-xs'
                        : 'bg-white border-slate-200/90 shadow-xs'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-7 h-7 rounded-full font-bold text-xs flex items-center justify-center ${
                          isInternal ? 'bg-amber-200 text-amber-900' : 'bg-blue-100 text-blue-800'
                        }`}>
                          {comment.user?.name ? comment.user.name.charAt(0) : 'U'}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-900">{comment.user?.name || 'Staff'}</span>
                            <span className="text-[10px] font-bold uppercase px-1.5 py-0.2 bg-slate-100 text-slate-600 rounded">
                              {comment.user?.role || 'user'}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {isInternal && (
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-amber-200 text-amber-800 border border-amber-300 flex items-center gap-1">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                            Internal Note
                          </span>
                        )}
                        <span className="text-[10px] text-slate-400">
                          {new Date(comment.created_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                        </span>
                      </div>
                    </div>

                    <div className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap pl-9">
                      {comment.body}
                    </div>
                  </div>
                );
              })
            )}

            {/* Reply Box */}
            <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">Leave a Reply</span>

                {/* Reply Mode Switcher (Public vs Internal) for Agent/Admin */}
                {isAgentOrAdmin && (
                  <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200 text-xs">
                    <button
                      type="button"
                      onClick={() => setReplyType('public')}
                      className={`px-3 py-1 rounded-lg font-semibold transition-all ${
                        replyType === 'public'
                          ? 'bg-white text-blue-700 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      💬 Public Response
                    </button>
                    <button
                      type="button"
                      onClick={() => setReplyType('internal')}
                      className={`px-3 py-1 rounded-lg font-semibold transition-all ${
                        replyType === 'internal'
                          ? 'bg-amber-100 text-amber-900 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      🔒 Internal Note
                    </button>
                  </div>
                )}
              </div>

              {/* Canned responses helper for support */}
              {isAgentOrAdmin && (
                <div className="mb-3">
                  <span className="text-[11px] font-semibold text-slate-500 mb-1.5 block">⚡ Quick Templates:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {cannedResponses.map((cr, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setReplyText(cr)}
                        className="text-[10px] bg-slate-50 hover:bg-slate-100 text-slate-600 px-2.5 py-1 rounded-lg border border-slate-200 text-left transition-colors truncate max-w-xs"
                        title={cr}
                      >
                        {cr}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <form onSubmit={handleReplySubmit}>
                <textarea
                  rows={4}
                  required
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder={
                    replyType === 'internal'
                      ? "Add an internal note only visible to support staff..."
                      : "Write your reply to the customer..."
                  }
                  className={`w-full p-3.5 border rounded-xl text-xs focus:outline-none focus:ring-2 transition-all resize-none ${
                    replyType === 'internal'
                      ? 'bg-amber-50/40 border-amber-200 focus:ring-amber-500 placeholder-amber-700/50'
                      : 'bg-slate-50 border-slate-200 focus:ring-blue-500 focus:bg-white'
                  }`}
                />

                <div className="flex items-center justify-between mt-3">
                  <span className="text-[11px] text-slate-400">
                    {replyType === 'internal' ? '⚠️ Customer will NOT see this note' : 'Customer will be notified'}
                  </span>

                  <button
                    type="submit"
                    disabled={submittingReply || !replyText.trim()}
                    className={`px-5 py-2 text-xs font-semibold text-white rounded-xl shadow-xs transition-all disabled:opacity-50 flex items-center gap-2 ${
                      replyType === 'internal'
                        ? 'bg-amber-600 hover:bg-amber-700'
                        : 'bg-blue-600 hover:bg-blue-700'
                    }`}
                  >
                    {submittingReply ? (
                      <>
                        <svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                        </svg>
                        <span>Posting...</span>
                      </>
                    ) : (
                      <span>{replyType === 'internal' ? 'Add Private Note' : 'Send Reply'}</span>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>

        {/* Right Column: Ticket Controls & Metadata Sidebar */}
        <div className="space-y-6">
          {/* Metadata Controls */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">Properties</h2>

            {/* Status Selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Status</label>
              <select
                value={ticket.status}
                onChange={(e) => handleQuickFieldUpdate('status', e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
              >
                <option value="open">Open</option>
                <option value="pending">Pending</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
              </select>
            </div>

            {/* Priority Selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Priority</label>
              <select
                value={ticket.priority}
                onChange={(e) => handleQuickFieldUpdate('priority', e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
              >
                <option value="low">🟢 Low (48h SLA)</option>
                <option value="medium">🟡 Medium (24h SLA)</option>
                <option value="high">🟠 High (8h SLA)</option>
                <option value="urgent">🔴 Urgent (2h SLA)</option>
              </select>
            </div>

            {/* Assignee Selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Assignee</label>
              <select
                value={ticket.assignee?.id || ''}
                onChange={(e) => handleQuickFieldUpdate('assignee_id', e.target.value ? Number(e.target.value) : null)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
              >
                <option value="">Unassigned</option>
                {agents.map((ag) => (
                  <option key={ag.id} value={ag.id}>
                    {ag.name} ({ag.role})
                  </option>
                ))}
              </select>
            </div>

            {/* SLA Benchmark */}
            <div className="pt-3 border-t border-slate-100">
              <span className="block text-xs font-semibold text-slate-600 mb-1">First Response Status</span>
              {ticket.first_response_at ? (
                <div className="p-2.5 bg-emerald-50 text-emerald-800 rounded-xl text-[11px] font-semibold border border-emerald-200">
                  ✅ Responded on {new Date(ticket.first_response_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              ) : (
                <div className="p-2.5 bg-amber-50 text-amber-800 rounded-xl text-[11px] font-semibold border border-amber-200 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                  <span>Awaiting First Response</span>
                </div>
              )}
            </div>
          </div>

          {/* Activity Timeline Card */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Audit Timeline</h2>

            <div className="space-y-3">
              {ticket.activity_logs?.length === 0 ? (
                <div className="text-xs text-slate-400">No activity logged yet.</div>
              ) : (
                ticket.activity_logs?.map((act) => (
                  <div key={act.id} className="flex items-start gap-2.5 text-xs">
                    <span className="w-2 h-2 rounded-full bg-blue-500 mt-1 shrink-0"></span>
                    <div>
                      <div className="text-slate-800">
                        <span className="font-semibold">{act.user?.name || 'System'}</span>{' '}
                        <span className="text-slate-500">{act.action.replace('_', ' ')}</span>
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {new Date(act.created_at).toLocaleDateString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
