import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api, { getApiCollection } from '../services/api.js';
import { MyWorldsSkeleton } from '../components/SkeletonLoader';

const roleStyles = {
  dev: 'bg-violet-100 text-violet-700 border-violet-200',
  player: 'bg-blue-100 text-blue-700 border-blue-200',
  member: 'bg-blue-100 text-blue-700 border-blue-200',
};

export default function MyWorlds() {
  const [worlds, setWorlds] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get('/worlds/mine')
      .then((res) => setWorlds(getApiCollection(res.data)))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <MyWorldsSkeleton count={4} />;

  const devWorlds = worlds.filter((w) => w.role === 'dev');
  const memberWorlds = worlds.filter((w) => w.role !== 'dev');

  return (
    <div className="space-y-4">
      {/* ── Header ── */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-extrabold text-slate-900">My Worlds</h1>
          <p className="text-slate-500 text-xs mt-0.5">Worlds you've created or joined</p>
        </div>
        <Link
          to="/worlds/create"
          className="shrink-0 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-full text-sm font-bold transition-colors shadow-sm"
        >
          + Create World
        </Link>
      </div>

      {worlds.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl py-14 text-center shadow-sm">
          <div className="text-4xl mb-3">🌍</div>
          <p className="font-bold text-slate-700 mb-1">No worlds yet</p>
          <p className="text-slate-400 text-sm mb-4">Explore and join some worlds to see them here.</p>
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <Link to="/worlds" className="border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-full text-sm font-bold transition-colors">
              Explore Worlds
            </Link>
            <Link to="/worlds/create" className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-full text-sm font-bold transition-colors shadow-sm">
              Create a World
            </Link>
          </div>
        </div>
      ) : (
        <>
          {devWorlds.length > 0 && (
            <section>
              <h2 className="font-bold text-slate-700 text-sm mb-3 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-violet-500 inline-block" />
                Worlds I Created ({devWorlds.length})
              </h2>
              <div className="space-y-2">
                {devWorlds.map((world) => <WorldRow key={world.id} world={world} showManage />)}
              </div>
            </section>
          )}
          {memberWorlds.length > 0 && (
            <section>
              <h2 className="font-bold text-slate-700 text-sm mb-3 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-400 inline-block" />
                Worlds I Joined ({memberWorlds.length})
              </h2>
              <div className="space-y-2">
                {memberWorlds.map((world) => <WorldRow key={world.id} world={world} />)}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}

function WorldRow({ world, showManage = false }) {
  const roleClass = roleStyles[world.role] || 'bg-slate-100 text-slate-600 border-slate-200';
  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm hover:border-indigo-200 hover:shadow-md transition-all overflow-hidden">
      <div className="flex items-center gap-3 p-4">
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-400 to-violet-500 flex items-center justify-center text-white font-black text-sm flex-shrink-0 shadow-sm">
          {world.title[0]?.toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <Link to={`/worlds/${world.id}`} className="font-bold text-slate-900 text-sm hover:text-indigo-600 transition-colors">
              w/{world.title}
            </Link>
            <span className={`text-xs px-2 py-0.5 rounded-full border font-bold ${roleClass}`}>{world.role.toUpperCase()}</span>
          </div>
          <p className="text-xs text-slate-400">👥 {world.member_count} members · ⭐ {world.credits} credits</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {showManage && (
            <Link
              to={`/worlds/${world.id}/manage`}
              className="border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 px-3 py-1.5 rounded-full text-xs font-bold transition-colors"
            >
              Manage
            </Link>
          )}
          <Link
            to={`/worlds/${world.id}`}
            className="border-2 border-indigo-600 text-indigo-600 hover:bg-indigo-600 hover:text-white px-3 py-1.5 rounded-full text-xs font-bold transition-all"
          >
            View
          </Link>
        </div>
      </div>
    </div>
  );
}
