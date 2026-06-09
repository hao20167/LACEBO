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
    <div className="max-w-2xl mx-auto space-y-3">
      {/* ── Header card ── */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
        <h1 className="text-lg font-extrabold text-slate-900">Create a Community</h1>
        <p className="text-slate-500 text-xs mt-0.5">Build your own collaborative roleplay universe</p>
      </div>

      <div className="lg:grid lg:grid-cols-5 lg:gap-3">
        {/* ── Form ── */}
        <div className="lg:col-span-3">
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            <div className="h-1.5 bg-gradient-to-r from-indigo-500 to-violet-500" />
            <div className="p-5">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-3 mb-4">{error}</div>
              )}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="world_title" className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
                    World Name <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400 pointer-events-none">w/</span>
                    <input
                      id="world_title"
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      required
                      placeholder="your_world_name"
                      className="w-full pl-8 pr-3 bg-slate-50 border border-slate-200 rounded-md py-2 text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition text-sm"
                    />
                  </div>
                  <p className="mt-1 text-xs text-slate-400">Community names cannot be changed after creation.</p>
                </div>
                <div>
                  <label htmlFor="world_description" className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
                    Description
                  </label>
                  <textarea
                    id="world_description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={5}
                    placeholder="Describe the premise and background of your world..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-md px-3 py-2 text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition resize-none text-sm"
                  />
                </div>
                <div className="flex gap-3 justify-end pt-1">
                  <button
                    type="button"
                    onClick={() => navigate(-1)}
                    className="border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-full text-sm font-bold transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading || !title.trim()}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-full text-sm font-bold transition-colors disabled:opacity-50 shadow-sm"
                  >
                    {loading ? 'Creating...' : 'Create Community'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>

        {/* ── Sidebar tips ── */}
        <div className="lg:col-span-2 mt-3 lg:mt-0 space-y-3">
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            <div className="bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-3">
              <h3 className="text-sm font-bold text-white">💡 Tips for a great world</h3>
            </div>
            <ul className="p-4 space-y-2.5">
              {[
                'Give your world a clear, compelling name',
                'Write a description that sets the tone',
                'Think about what makes your world unique',
                'Plan the events and lore you want to create',
              ].map((tip) => (
                <li key={tip} className="flex items-start gap-2 text-sm text-slate-600">
                  <span className="text-indigo-400 mt-0.5 flex-shrink-0">→</span>
                  {tip}
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-3">
              <h3 className="text-sm font-bold text-white">🚀 After creating...</h3>
            </div>
            <ul className="p-4 space-y-2">
              {[
                "You'll become the Dev of this world",
                'Approve members who request to join',
                'Create big events for the community',
                'Post announcements and manage lore',
              ].map((item) => (
                <li key={item} className="flex items-start gap-2 text-sm text-slate-600">
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
