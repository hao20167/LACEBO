import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api.js';

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
    <div>
      {/* ── Page header ──────────────────────────────── */}
      <div className="mb-8 pb-5 border-b border-slate-200">
        <h1 className="text-3xl font-bold text-slate-900">Create a New World</h1>
        <p className="text-slate-500 text-sm mt-1">
          Build your own collaborative roleplay universe
        </p>
      </div>

      <div className="lg:grid lg:grid-cols-5 lg:gap-10">
        {/* ── Form ─────────────────────────────────────── */}
        <div className="lg:col-span-3">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-3 mb-5">
                {error}
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label
                  htmlFor="title"
                  className="block text-sm font-medium text-slate-700 mb-1.5"
                >
                  World Title{' '}
                  <span className="text-red-400 ml-0.5">*</span>
                </label>
                <input
                  id="title"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  placeholder="e.g., A world where Vietnam wins WW3"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition"
                />
              </div>
              <div>
                <label
                  htmlFor="description"
                  className="block text-sm font-medium text-slate-700 mb-1.5"
                >
                  Description
                </label>
                <textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={6}
                  placeholder="Describe the premise and background of your world..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition resize-none"
                />
              </div>
              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-2.5 rounded-lg font-semibold transition-colors disabled:opacity-50 shadow-sm"
                >
                  {loading ? 'Creating...' : 'Create World →'}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* ── Sidebar tips ─────────────────────────────── */}
        <div className="lg:col-span-2 mt-6 lg:mt-0 space-y-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
              <span className="w-6 h-6 bg-indigo-100 rounded-md flex items-center justify-center text-sm">
                💡
              </span>{' '}
              Tips for a great world
            </h3>
            <ul className="space-y-2.5">
              {[
                'Give your world a clear, compelling title',
                'Write a description that sets the tone and premise',
                'Think about what makes your world unique',
                'Plan the events and lore you want to create',
              ].map((tip) => (
                <li key={tip} className="flex items-start gap-2.5 text-sm text-slate-600">
                  <span className="text-indigo-400 mt-0.5 flex-shrink-0">→</span>
                  {tip}
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-gradient-to-br from-indigo-50 to-violet-50 border border-indigo-100 rounded-2xl p-5">
            <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
              <span className="w-6 h-6 bg-indigo-100 rounded-md flex items-center justify-center text-sm">
                🚀
              </span>{' '}
              After creating...
            </h3>
            <ul className="space-y-2 text-sm text-slate-600">
              {[
                "You'll become the Dev of this world",
                'Approve members who request to join',
                'Create big events for the community',
                'Post announcements and manage lore',
              ].map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <span className="text-emerald-500 mt-0.5 flex-shrink-0">✓</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
