import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';
import Layout from '../components/Layout';

export default function NewTicket() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ subject:'', description:'', priority:'medium' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submit = async e => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const { data } = await api.post('/tickets', form);
      navigate(`/tickets/${data.id}`);
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to create ticket.');
    } finally { setLoading(false); }
  };

  return (
    <Layout>
      <div className="max-w-2xl">
        <h1 className="text-xl font-bold text-gray-900 mb-6">New Ticket</h1>
        {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm">{error}</div>}
        <div className="bg-white border rounded-xl p-6">
          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
              <input required className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={form.subject} onChange={e => setForm({...form, subject: e.target.value})}
                placeholder="Brief summary of the issue" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea rows={5} required
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={form.description} onChange={e => setForm({...form, description: e.target.value})}
                placeholder="Describe the issue in detail..." />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
              <select className="border rounded-lg px-3 py-2 text-sm w-full focus:outline-none"
                value={form.priority} onChange={e => setForm({...form, priority: e.target.value})}>
                {['low','medium','high','urgent'].map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div className="flex gap-3 pt-2">
              <button type="submit" disabled={loading}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
                {loading ? 'Creating...' : 'Create Ticket'}
              </button>
              <button type="button" onClick={() => navigate('/tickets')}
                className="px-6 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100">
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
}
