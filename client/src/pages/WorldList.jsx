import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api, { getApiCollection } from '../services/api.js';
import { WorldListSkeleton } from '../components/SkeletonLoader';
import Pagination from '../components/Pagination';

export default function WorldList() {
  const [worlds, setWorlds] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: false,
  });

  const fetchWorlds = async (pageNumber = 1, q = search) => {
    setLoading(true);
    try {
      const res = await api.get('/worlds', {
        params: {
          page: pageNumber,
          limit: 12,
          ...(q ? { search: q } : {}),
        },
      });
      setWorlds(getApiCollection(res.data));
      if (res.data?.pagination) {
        setPagination(res.data.pagination);
      } else {
        setPagination({ totalPages: 1, hasNextPage: false, hasPrevPage: false });
      }
    } catch {}
    setLoading(false);
  };

  useEffect(() => {
    fetchWorlds(1, '');
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchWorlds(1, search);
  };

  const handlePageChange = (nextPage) => {
    setPage(nextPage);
    fetchWorlds(nextPage, search);
  };

  return (
    <div className="space-y-3">
      {/* ── Header ── */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-extrabold text-slate-900">Explore Worlds</h1>
          <p className="text-slate-500 text-xs mt-0.5">
            Discover and join collaborative roleplay universes
          </p>
        </div>
        <Link
          to="/worlds/create"
          className="shrink-0 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-full text-sm font-bold transition-colors shadow-sm"
        >
          + Create World
        </Link>
      </div>

      {/* ── Search ── */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-3">
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm pointer-events-none">🔍</span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search communities..."
              className="w-full pl-8 pr-3 py-2 bg-[#f6f7f8] border border-slate-200 rounded-full text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition text-sm"
            />
          </div>
          <button
            type="submit"
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-full font-bold transition-colors text-sm"
          >
            Search
          </button>
        </form>
      </div>

      {/* ── Results ── */}
      {loading ? (
        <WorldListSkeleton count={6} />
      ) : worlds.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl py-16 text-center shadow-sm">
          <div className="text-4xl mb-3">🌍</div>
          <p className="font-bold text-slate-700 mb-1">No communities found</p>
          <p className="text-sm text-slate-500 mb-4">Try a different search or start a new world.</p>
          <Link
            to="/worlds/create"
            className="inline-flex bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-full text-sm font-bold transition-colors shadow-sm"
          >
            Create a World
          </Link>
        </div>
      ) : (
        <>
          <div className="space-y-2">
            {worlds.map((world, index) => (
              <div
                key={world.id}
                className="bg-white border border-slate-200 rounded-xl shadow-sm hover:border-indigo-200 hover:shadow-md transition-all flex items-center gap-3 p-4"
              >
                {/* Rank */}
                <span className="text-slate-400 font-bold text-sm w-6 text-center flex-shrink-0">
                  {index + 1 + (page - 1) * 12}
                </span>

                {/* Community icon */}
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-400 to-violet-500 flex items-center justify-center text-white font-black text-sm flex-shrink-0 shadow-sm">
                  {world.title[0]?.toUpperCase()}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <Link
                      to={`/worlds/${world.id}`}
                      className="font-bold text-slate-900 text-sm hover:text-indigo-600 transition-colors"
                    >
                      w/{world.title}
                    </Link>
                  </div>
                  <p className="text-xs text-slate-400">
                    👥 {world.member_count} members
                    {world.description && (
                      <span className="hidden sm:inline"> · {world.description.slice(0, 60)}{world.description.length > 60 ? '…' : ''}</span>
                    )}
                  </p>
                </div>

                {/* View button */}
                <Link
                  to={`/worlds/${world.id}`}
                  className="flex-shrink-0 border-2 border-indigo-600 text-indigo-600 hover:bg-indigo-600 hover:text-white px-4 py-1.5 rounded-full text-xs font-bold transition-all"
                >
                  View
                </Link>
              </div>
            ))}
          </div>

          <Pagination
            page={page}
            totalPages={pagination.totalPages}
            onPageChange={handlePageChange}
            hasNextPage={pagination.hasNextPage}
            hasPrevPage={pagination.hasPrevPage}
          />
        </>
      )}
    </div>
  );
}
