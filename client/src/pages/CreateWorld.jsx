import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

export default function CreateWorld() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await api.post('/worlds', { title, description });
      navigate(`/worlds/${res.data.id}`);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create world');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold text-dark-100 mb-6">Create a New World</h1>
      {error && <div className="bg-red-900/30 border border-red-700 text-red-300 text-sm rounded-lg p-3 mb-4">{error}</div>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm text-dark-400 mb-1">World Title</label>
          <input type="text" value={title} onChange={e => setTitle(e.target.value)} required
            placeholder="e.g., A world where Vietnam wins WW3"
            className="w-full bg-dark-800 border border-dark-600 rounded-lg px-4 py-2.5 text-dark-100 focus:outline-none focus:border-primary-500 transition" />
        </div>
        <div>
          <label className="block text-sm text-dark-400 mb-1">Description</label>
          <textarea value={description} onChange={e => setDescription(e.target.value)} rows={5}
            placeholder="Describe the premise and background of your world..."
            className="w-full bg-dark-800 border border-dark-600 rounded-lg px-4 py-2.5 text-dark-100 focus:outline-none focus:border-primary-500 transition resize-none" />
        </div>
        <button type="submit" disabled={loading}
          className="bg-primary-600 hover:bg-primary-500 text-white px-8 py-2.5 rounded-lg font-medium transition disabled:opacity-50">
          {loading ? 'Creating...' : 'Create World'}
        </button>
      </form>
    </div>
  );
}
