import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api.js';
import { MyWorldsSkeleton } from '../components/SkeletonLoader';

export default function MyWorlds() {
  const [worlds, setWorlds] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get('/worlds/mine')
      .then((res) => setWorlds(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <MyWorldsSkeleton count={4} />;

  const devWorlds = worlds.filter((w) => w.role === 'dev');
  const memberWorlds = worlds.filter((w) => w.role !== 'dev');

  return (
    <div className="space-y-8">
      {/* ── Page header ──────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 pb-5 border-b border-slate-200">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">My Worlds</h1>
          <p className="text-slate-500 text-sm mt-1">
            Worlds you've created or joined
          </p>
        </div>
        <Link
          to="/worlds/create"
          className="shrink-0 self-start sm:self-auto bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm"
        >
          + New World
        </Link>
      </div>

      {worlds.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl py-20 text-center shadow-sm">
          <div className="text-5xl mb-4">🌍</div>
          <p className="text-lg font-semibold text-slate-700 mb-1">
            No worlds yet
          </p>
          <p className="text-slate-500 text-sm mb-6">
            You haven&apos;t joined any worlds yet.
          </p>
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <Link
              to="/worlds"
              className="bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 px-5 py-2.5 rounded-lg text-sm font-medium transition-colors"
            >
              Explore Worlds
            </Link>
            <Link
              to="/worlds/create"
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-colors shadow-sm"
            >
              Create a World
            </Link>
          </div>
        </div>
      ) : (
        <>
          {/* Dev worlds */}
          {devWorlds.length > 0 && (
            <section>
              <h2 className="text-base font-bold text-slate-700 mb-4 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-violet-500 inline-block" />
                Worlds I Created
                <span className="text-xs font-normal text-slate-400">
                  ({devWorlds.length})
                </span>
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {devWorlds.map((world) => (
                  <WorldCard key={world.id} world={world} />
                ))}
              </div>
            </section>
          )}

          {/* Member worlds */}
          {memberWorlds.length > 0 && (
            <section>
              <h2 className="text-base font-bold text-slate-700 mb-4 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-400 inline-block" />
                Worlds I Joined
                <span className="text-xs font-normal text-slate-400">
                  ({memberWorlds.length})
                </span>
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {memberWorlds.map((world) => (
                  <WorldCard key={world.id} world={world} />
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}

function WorldCard({ world }) {
  return (
    <Link
      to={`/worlds/${world.id}`}
      className="bg-white border border-slate-200 rounded-xl overflow-hidden hover:border-indigo-300 hover:shadow-md transition-all group flex flex-col"
    >
      <div className="h-1.5 bg-gradient-to-r from-indigo-400 to-violet-400 opacity-0 group-hover:opacity-100 transition-opacity" />
      <div className="p-5 flex flex-col flex-1">
        <div className="flex items-start justify-between gap-3 mb-3">
          <h3 className="text-base font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-1">
            {world.title}
          </h3>
          <span
            className={`shrink-0 text-xs px-2.5 py-1 rounded-full border font-medium ${
              world.role === 'dev'
                ? 'bg-violet-100 text-violet-700 border-violet-200'
                : 'bg-blue-100 text-blue-700 border-blue-200'
            }`}
          >
            {world.role.toUpperCase()}
          </span>
        </div>
        <p className="text-slate-500 text-sm mb-4 line-clamp-2 flex-1">
          {world.description || 'No description'}
        </p>
        <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs">
          <span className="text-slate-400">👥 {world.member_count} members</span>
          <span className="text-indigo-600 font-semibold">⭐ {world.credits} credits</span>
        </div>
      </div>
    </Link>
  );
}
