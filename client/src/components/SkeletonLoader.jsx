/**
 * SkeletonLoader.jsx
 * Reusable skeleton screen components for loading states across all pages.
 */
import PropTypes from 'prop-types';

function Skeleton({ className = '' }) {
  return (
    <div
      className={`relative overflow-hidden rounded bg-slate-200 before:absolute before:inset-0 before:-translate-x-full before:animate-shimmer before:bg-gradient-to-r before:from-transparent before:via-white/60 before:to-transparent ${className}`}
    />
  );
}

Skeleton.propTypes = { className: PropTypes.string };

export function PageLoader() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <div className="relative w-14 h-14">
        <div className="absolute inset-0 rounded-full border-4 border-slate-200" />
        <div className="absolute inset-0 rounded-full border-4 border-t-indigo-500 animate-spin" />
      </div>
      <p className="text-slate-400 text-sm animate-pulse">Loading...</p>
    </div>
  );
}

// ─── WorldList skeleton ────────────────────────────────────────────────────────
export function WorldListSkeleton({ count = 6 }) {
  return (
    <div data-testid="skeleton-loader" className="space-y-6">
      {/* Search card skeleton */}
      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <div className="flex gap-3">
          <Skeleton className="flex-1 h-10" />
          <Skeleton className="w-20 h-10" />
        </div>
      </div>
      {/* Grid skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: count }, (_, i) => `wl-${i}`).map((id) => (
          <div
            key={id}
            className="bg-white border border-slate-200 rounded-xl overflow-hidden"
          >
            <div className="h-1.5 bg-slate-100" />
            <div className="p-5 space-y-3">
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-5/6" />
              <div className="flex justify-between pt-2 border-t border-slate-100">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

WorldListSkeleton.propTypes = { count: PropTypes.number };

// ─── WorldDetail skeleton (sidebar layout) ────────────────────────────────────
export function WorldDetailSkeleton() {
  return (
    <div data-testid="skeleton-loader" className="lg:grid lg:grid-cols-3 lg:gap-8">
      {/* Sidebar */}
      <div className="lg:col-span-1 mb-6 lg:mb-0">
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
          <div className="h-2 bg-slate-200" />
          <div className="p-6 space-y-4">
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-4/5" />
            <div className="space-y-2.5 py-2">
              <div className="flex justify-between">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-3 w-8" />
              </div>
              <div className="flex justify-between">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-3 w-12" />
              </div>
            </div>
            <Skeleton className="h-10 w-full rounded-lg" />
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:col-span-2">
        {/* Tabs */}
        <div className="grid grid-cols-2 sm:flex gap-1 mb-6 bg-slate-100 rounded-xl p-1 border border-slate-200">
          {['lore', 'events', 'announcements', 'leaderboard'].map((t) => (
            <Skeleton key={t} className="flex-1 h-9 rounded-lg" />
          ))}
        </div>
        {/* Timeline items */}
        <div className="space-y-5">
          {[1, 2, 3].map((i) => (
            <div key={i} className="relative pl-14 pb-2">
              <div className="absolute left-[14px] w-5 h-5 rounded-full bg-slate-200 animate-pulse" />
              <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-2 shadow-sm">
                <div className="flex gap-2">
                  <Skeleton className="h-4 w-20 rounded-full" />
                  <Skeleton className="h-4 w-16 rounded-full" />
                </div>
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-5/6" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── EventDetail skeleton ─────────────────────────────────────────────────────
export function EventDetailSkeleton() {
  return (
    <div className="max-w-3xl mx-auto space-y-5" data-testid="skeleton-loader">
      {/* Event header */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="h-1.5 bg-slate-200" />
        <div className="p-6 space-y-3">
          <div className="flex gap-2">
            <Skeleton className="h-5 w-20 rounded-full" />
            <Skeleton className="h-5 w-16 rounded-full" />
          </div>
          <Skeleton className="h-7 w-2/3" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-4/5" />
          <div className="flex gap-4 pt-2 border-t border-slate-100">
            <Skeleton className="h-3 w-28" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
      </div>
      {/* Post compose */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
        <div className="flex gap-3">
          <Skeleton className="w-8 h-8 rounded-full flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-20 w-full rounded-lg" />
            <div className="flex justify-end">
              <Skeleton className="h-9 w-16 rounded-lg" />
            </div>
          </div>
        </div>
      </div>
      {/* Posts */}
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-3"
        >
          <div className="flex items-center gap-3">
            <Skeleton className="w-9 h-9 rounded-full" />
            <div className="space-y-1 flex-1">
              <Skeleton className="h-3 w-28" />
              <Skeleton className="h-3 w-20" />
            </div>
          </div>
          <Skeleton className="h-4 w-full ml-12" />
          <Skeleton className="h-4 w-5/6 ml-12" />
          <div className="flex gap-5 ml-12">
            <Skeleton className="h-4 w-10" />
            <Skeleton className="h-4 w-10" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── UserProfile skeleton (banner layout) ────────────────────────────────────
export function UserProfileSkeleton() {
  return (
    <div className="space-y-8" data-testid="skeleton-loader">
      {/* Banner */}
      <div>
        <Skeleton className="h-36 rounded-2xl" />
        <div className="bg-white border border-slate-200 rounded-2xl px-6 pb-6 -mt-12 mx-2 shadow-sm">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end mb-6">
            <Skeleton className="h-20 w-20 rounded-xl -mt-6 flex-shrink-0 border-4 border-white" />
            <div className="flex-1 space-y-2 py-1">
              <Skeleton className="h-7 w-40" />
              <Skeleton className="h-4 w-28" />
            </div>
            <Skeleton className="h-9 w-28 rounded-lg" />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-4 border-y border-slate-100">
            <Skeleton className="h-10 rounded" />
            <Skeleton className="h-10 rounded" />
            <Skeleton className="h-10 rounded" />
            <Skeleton className="h-10 rounded" />
          </div>
        </div>
      </div>
      {/* Worlds section */}
      <section>
        <div className="flex items-center justify-between mb-5">
          <Skeleton className="h-7 w-44" />
          <Skeleton className="h-4 w-28" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="bg-white border border-slate-200 rounded-xl overflow-hidden"
            >
              <div className="h-1 bg-slate-100" />
              <div className="p-5 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-5 w-16 rounded-full" />
                </div>
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-4/5" />
                <div className="grid grid-cols-3 gap-3 pt-2 border-t border-slate-100">
                  <Skeleton className="h-8 rounded" />
                  <Skeleton className="h-8 rounded" />
                  <Skeleton className="h-8 rounded" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

// ─── MyWorlds skeleton ─────────────────────────────────────────────────────────
export function MyWorldsSkeleton({ count = 4 }) {
  return (
    <div data-testid="skeleton-loader" className="space-y-8">
      <div className="flex items-center justify-between pb-5 border-b border-slate-200">
        <div className="space-y-2">
          <Skeleton className="h-8 w-36" />
          <Skeleton className="h-3 w-48" />
        </div>
        <Skeleton className="h-9 w-32 rounded-lg" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Array.from({ length: count }, (_, i) => `mw-${i}`).map((id) => (
          <div
            key={id}
            className="bg-white border border-slate-200 rounded-xl overflow-hidden"
          >
            <div className="h-1.5 bg-slate-100" />
            <div className="p-5 space-y-3">
              <div className="flex items-center justify-between">
                <Skeleton className="h-5 w-3/5" />
                <Skeleton className="h-5 w-16 rounded-full" />
              </div>
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-4/5" />
              <div className="flex justify-between pt-2 border-t border-slate-100">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

MyWorldsSkeleton.propTypes = { count: PropTypes.number };

// ─── WorldManage skeleton ─────────────────────────────────────────────────────
export function WorldManageSkeleton() {
  return (
    <div data-testid="skeleton-loader" className="space-y-6">
      {/* Back + title */}
      <div className="flex items-center gap-4 pb-5 border-b border-slate-200">
        <Skeleton className="h-4 w-16" />
        <div className="h-5 w-px bg-slate-200" />
        <Skeleton className="h-7 w-48" />
      </div>
      {/* Stat cards */}
      <div className="grid grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white border border-slate-200 rounded-xl p-4 space-y-2">
            <Skeleton className="h-6 w-6 rounded" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-3 w-16" />
          </div>
        ))}
      </div>
      {/* List items */}
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="bg-white border border-slate-200 rounded-xl p-4 flex items-center justify-between shadow-sm"
          >
            <div className="flex items-center gap-3">
              <Skeleton className="w-9 h-9 rounded-full" />
              <div className="space-y-1">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
            <div className="flex gap-2">
              <Skeleton className="h-7 w-20 rounded-lg" />
              <Skeleton className="h-7 w-16 rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── ProtectedRoute loading skeleton ─────────────────────────────────────────
export function AuthCheckSkeleton() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-6">
      <div className="relative w-16 h-16">
        <div className="absolute inset-0 rounded-full border-4 border-slate-200" />
        <div className="absolute inset-0 rounded-full border-4 border-t-indigo-500 border-r-indigo-400 animate-spin" />
      </div>
      <div className="space-y-2 text-center">
        <Skeleton className="h-4 w-32 mx-auto" />
        <Skeleton className="h-3 w-20 mx-auto" />
      </div>
    </div>
  );
}

export default Skeleton;
