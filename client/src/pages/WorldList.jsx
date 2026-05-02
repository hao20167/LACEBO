import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';

export default function WorldList() {
  const [worlds, setWorlds] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchWorlds = async (q = '') => {
    setLoading(true);
    try {
      const res = await api.get('/worlds', { params: q ? { search: q } : {} });
      setWorlds(res.data);
    } catch { }
    setLoading(false);
  };

  useEffect(() => { fetchWorlds(); }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchWorlds(search);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-dark-100">Explore Worlds</h1>
      </div>

      <form onSubmit={handleSearch} className="mb-8 flex gap-3">
        <input
          type="text" value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search worlds by title..."
          className="flex-1 bg-dark-800 border border-dark-600 rounded-lg px-4 py-2.5 text-dark-100 focus:outline-none focus:border-primary-500 transition"
        />
        <button type="submit" className="bg-primary-600 hover:bg-primary-500 text-white px-6 py-2.5 rounded-lg font-medium transition">
          Search
        </button>
      </form>

      {loading ? (
        <div className="text-center text-dark-400 py-12">Loading worlds...</div>
      ) : worlds.length === 0 ? (
        <div className="text-center text-dark-400 py-12">
          <p className="text-lg mb-2">No worlds found</p>
          <p className="text-sm">Be the first to <Link to="/worlds/create" className="text-primary-400 hover:underline">create a world</Link>!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {worlds.map(world => (
            <Link key={world.id} to={`/worlds/${world.id}`}
              className="bg-dark-900 border border-dark-700 rounded-xl p-5 hover:border-primary-600 transition group">
              <h3 className="text-lg font-semibold text-dark-100 group-hover:text-primary-400 transition mb-2">{world.title}</h3>
              <p className="text-dark-400 text-sm mb-3 line-clamp-2">{world.description || 'No description'}</p>
              <div className="flex items-center gap-4 text-xs text-dark-500">
                <span>👥 {world.member_count} members</span>
                <span>📅 {new Date(world.created_at).toLocaleDateString()}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
