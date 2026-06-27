import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../lib/api';
import Layout from '../components/Layout';

const PRIORITY_COLORS = {
  urgent: 'bg-red-100 text-red-700',
  high:   'bg-orange-100 text-orange-700',
  medium: 'bg-yellow-100 text-yellow-700',
  low:    'bg-gray-100 text-gray-600',
};
const STATUS_COLORS = {
  open:     'bg-blue-100 text-blue-700',
  pending:  'bg-yellow-100 text-yellow-700',
  resolved: 'bg-green-100 text-green-700',
  closed:   'bg-gray-100 text-gray-600',
};

export default function TicketList() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ status: '', priority: '', search: '' });

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const params = Object.fromEntries(Object.entries(filters).filter(([,v]) => v));
      const { data } = await api.get('/tickets', { params });
      setTickets(data.data || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchTickets(); }, [filters]);

  return (
    <Layout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-900">Tickets</h1>
        <Link to="/tickets/new"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700">
          + New Ticket
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white border rounded-xl p-4 mb-4 flex gap-3 flex-wrap">
        <input placeholder="Search tickets..."
          className="border rounded-lg px-3 py-1.5 text-sm flex-1 min-w-48 focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={filters.search} onChange={e => setFilters({...filters, search: e.target.value})} />
        <select className="border rounded-lg px-3 py-1.5 text-sm focus:outline-none"
          value={filters.status} onChange={e => setFilters({...filters, status: e.target.value})}>
          <option value="">All Status</option>
          {['open','pending','resolved','closed'].map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select className="border rounded-lg px-3 py-1.5 text-sm focus:outline-none"
          value={filters.priority} onChange={e => setFilters({...filters, priority: e.target.value})}>
          <option value="">All Priority</option>
          {['urgent','high','medium','low'].map(p => <option key={p} value={p}>{p}</option>)}
        </select>
        <button onClick={() => setFilters({status:'',priority:'',search:''})}
          className="text-sm text-gray-500 hover:text-gray-700 px-2">Clear</button>
      </div>

      {/* Ticket Table */}
      <div className="bg-white border rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-400">Loading...</div>
        ) : tickets.length === 0 ? (
          <div className="p-8 text-center text-gray-400">No tickets found.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                {['ID','Subject','Status','Priority','Assignee','Created'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {tickets.map(t => (
                <tr key={t.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-400">#{t.id}</td>
                  <td className="px-4 py-3">
                    <Link to={`/tickets/${t.id}`} className="font-medium text-gray-900 hover:text-blue-600">
                      {t.subject}
                    </Link>
                    {t.sla_breached && <span className="ml-2 text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded">SLA Breached</span>}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${STATUS_COLORS[t.status]}`}>{t.status}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${PRIORITY_COLORS[t.priority]}`}>{t.priority}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{t.assignee?.name || <span className="text-gray-300">Unassigned</span>}</td>
                  <td className="px-4 py-3 text-gray-400">{new Date(t.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </Layout>
  );
}
