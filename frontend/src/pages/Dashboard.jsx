import { useState, useEffect } from 'react';
import api from '../lib/api';
import Layout from '../components/Layout';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/dashboard').then(({ data }) => setStats(data)).finally(() => setLoading(false));
  }, []);

  if (loading) return <Layout><div className="p-8 text-center text-gray-400">Loading...</div></Layout>;

  const statusCards = [
    { label: 'Open',     value: stats?.by_status?.open     || 0, color: 'text-blue-600',   bg: 'bg-blue-50' },
    { label: 'Pending',  value: stats?.by_status?.pending  || 0, color: 'text-yellow-600', bg: 'bg-yellow-50' },
    { label: 'Resolved', value: stats?.by_status?.resolved || 0, color: 'text-green-600',  bg: 'bg-green-50' },
    { label: 'Closed',   value: stats?.by_status?.closed   || 0, color: 'text-gray-600',   bg: 'bg-gray-50' },
  ];

  return (
    <Layout>
      <h1 className="text-xl font-bold text-gray-900 mb-6">Dashboard</h1>

      {/* Status cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {statusCards.map(c => (
          <div key={c.label} className={`${c.bg} rounded-xl p-4 border`}>
            <p className="text-sm text-gray-500 mb-1">{c.label}</p>
            <p className={`text-3xl font-bold ${c.color}`}>{c.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Priority breakdown */}
        <div className="bg-white border rounded-xl p-4">
          <h2 className="font-semibold text-gray-900 mb-4">By Priority</h2>
          <div className="space-y-3">
            {['urgent','high','medium','low'].map(p => (
              <div key={p} className="flex items-center gap-3">
                <span className="text-sm capitalize w-16 text-gray-600">{p}</span>
                <div className="flex-1 bg-gray-100 rounded-full h-2">
                  <div className="bg-blue-500 h-2 rounded-full"
                    style={{ width: `${Math.min(100, ((stats?.by_priority?.[p] || 0) / 12) * 100)}%` }} />
                </div>
                <span className="text-sm font-medium text-gray-700 w-6">{stats?.by_priority?.[p] || 0}</span>
              </div>
            ))}
          </div>
        </div>

        {/* SLA + metrics */}
        <div className="bg-white border rounded-xl p-4">
          <h2 className="font-semibold text-gray-900 mb-4">SLA Metrics</h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">SLA Breached</span>
              <span className="text-lg font-bold text-red-600">{stats?.sla_breached_count || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Avg First Response</span>
              <span className="text-lg font-bold text-gray-900">{stats?.avg_first_response_mins || 0} min</span>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
