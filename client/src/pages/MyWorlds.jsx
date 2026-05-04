import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';

export default function MyWorlds() {
  const [worlds, setWorlds] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/worlds/mine').then(res => setWorlds(res.data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-center text-dark-400 py-12">Loading...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-dark-100">My Worlds</h1>
        <Link to="/worlds/create" className="bg-primary-600 hover:bg-primary-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition">
          + New World
        </Link>
      </div>
      {worlds.length === 0 ? (
        <div className="text-center text-dark-400 py-12">
          <p>You haven't joined any worlds yet.</p>
          <Link to="/worlds" className="text-primary-400 hover:underline text-sm mt-2 inline-block">Explore worlds</Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {worlds.map(world => (
            <Link key={world.id} to={`/worlds/${world.id}`}
              className="bg-dark-900 border border-dark-700 rounded-xl p-5 hover:border-primary-600 transition group">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-semibold text-dark-100 group-hover:text-primary-400 transition">{world.title}</h3>
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${world.role === 'dev' ? 'bg-purple-900/50 text-purple-300' : 'bg-blue-900/50 text-blue-300'}`}>
                  {world.role.toUpperCase()}
                </span>
              </div>
              <p className="text-dark-400 text-sm mb-3 line-clamp-2">{world.description || 'No description'}</p>
              <div className="flex items-center gap-4 text-xs text-dark-500">
                <span>👥 {world.member_count} members</span>
                <span>⭐ {world.credits} credits</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
