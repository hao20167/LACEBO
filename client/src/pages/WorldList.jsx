import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import EmptyState from '../components/EmptyState.jsx';
import Pagination from '../components/Pagination.jsx';
import { WorldListSkeleton } from '../components/SkeletonLoader.jsx';
import api, { getApiAssetUrl, getApiCollection } from '../services/api.js';

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
        setPagination({
          totalPages: 1,
          hasNextPage: false,
          hasPrevPage: false,
        });
      }
    } catch {}
    setLoading(false);
  };

  useEffect(() => {
    fetchWorlds(1, '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    <div className="space-y-6">
      {/* ── Page header ────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Explore Worlds</h1>
          <p className="text-slate-500 mt-1 text-sm">
            Discover and join collaborative roleplay universes
          </p>
        </div>
        <Link
          to="/worlds/create"
          className="shrink-0 self-start sm:self-auto bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm"
        >
          + New World
        </Link>
      </div>

      {/* ── Search ─────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
        <form onSubmit={handleSearch} className="flex gap-3">
          <div className="relative flex-1">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm pointer-events-none">
              🔍
            </span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search worlds by title..."
              className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition text-sm"
            />
          </div>
          <button
            type="submit"
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-lg font-medium transition-colors shadow-sm text-sm"
          >
            Search
          </button>
        </form>
      </div>

      {/* ── Results ────────────────────────────────── */}
      {loading ? (
        <WorldListSkeleton count={6} />
      ) : worlds.length === 0 ? (
        <EmptyState
          title="No worlds found"
          description={
            search
              ? 'Try a different search term or clear the search to browse every world.'
              : 'Start the first shared setting for this community.'
          }
          action={
            <Link
              to="/worlds/create"
              className="text-primary-400 hover:underline"
            >
              Create a world
            </Link>
          }
        />
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {worlds.map((world) => (
              <Link
                key={world.id}
                to={`/worlds/${world.id}`}
                className="bg-white border border-slate-200 rounded-xl overflow-hidden hover:border-indigo-300 hover:shadow-md transition-all group flex flex-col"
              >
                {getApiAssetUrl(world.cover_image) ? (
                  <img
                    src={getApiAssetUrl(world.cover_image)}
                    alt={world.title}
                    className="w-full h-32 object-cover group-hover:opacity-95 transition-opacity"
                  />
                ) : (
                  <div className="h-1.5 bg-gradient-to-r from-indigo-500 to-violet-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                )}
                <div className="p-5 flex flex-col flex-1">
                  <h3 className="text-base font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors mb-2 line-clamp-1">
                    {world.title}
                  </h3>
                  <p className="text-slate-500 text-sm mb-4 line-clamp-2 flex-1">
                    {world.description || 'No description provided.'}
                  </p>
                  <div className="flex items-center justify-between text-xs text-slate-400 pt-3 border-t border-slate-100">
                    <span className="flex items-center gap-1">
                      👥 <span>{world.member_count} members</span>
                    </span>
                    <span>
                      {new Date(world.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </Link>
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
