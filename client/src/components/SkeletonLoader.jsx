/**
 * SkeletonLoader.jsx
 * Reusable skeleton screen components for loading states across all pages.
 * Uses Tailwind CSS animate-pulse with shimmer effects.
 */
import PropTypes from 'prop-types';

// ─── Base skeleton block ──────────────────────────────────────────────────────
function Skeleton({ className = '' }) {
  return (
    <div
      className={`relative overflow-hidden rounded bg-dark-800 before:absolute before:inset-0 before:-translate-x-full before:animate-shimmer before:bg-gradient-to-r before:from-transparent before:via-dark-700/60 before:to-transparent ${className}`}
    />
  );
}

Skeleton.propTypes = { className: PropTypes.string };

// ─── Full-page centered spinner / pulse ───────────────────────────────────────
export function PageLoader() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <div className="relative w-14 h-14">
        <div className="absolute inset-0 rounded-full border-4 border-dark-700" />
        <div className="absolute inset-0 rounded-full border-4 border-t-primary-500 animate-spin" />
      </div>
      <p className="text-dark-400 text-sm animate-pulse">Loading...</p>
    </div>
  );
}

// ─── WorldList skeleton ────────────────────────────────────────────────────────
export function WorldListSkeleton({ count = 6 }) {
  return (
    <div data-testid="skeleton-loader">
      {/* Search bar skeleton */}
      <div className="mb-8 flex gap-3">
        <Skeleton className="flex-1 h-10" />
        <Skeleton className="w-24 h-10" />
      </div>
      {/* Grid skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: count }, (_, i) => `wl-${i}`).map((id) => (
          <div
            key={id}
            className="bg-dark-900 border border-dark-700 rounded-xl p-5 space-y-3"
          >
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-5/6" />
            <div className="flex gap-4 pt-1">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

WorldListSkeleton.propTypes = { count: PropTypes.number };

// ─── WorldDetail skeleton ─────────────────────────────────────────────────────
export function WorldDetailSkeleton() {
  return (
    <div data-testid="skeleton-loader">
      {/* Header card */}
      <div className="bg-dark-900 border border-dark-700 rounded-2xl p-6 mb-6 space-y-4">
        <div className="flex items-start justify-between">
          <div className="flex-1 space-y-3">
            <Skeleton className="h-8 w-2/3" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-4/5" />
            <div className="flex gap-4 pt-1">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
          </div>
          <Skeleton className="h-9 w-28 ml-4 rounded-lg" />
        </div>
      </div>
      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-dark-900 rounded-xl p-1 border border-dark-700">
        {['lore', 'events', 'announcements', 'leaderboard'].map((t) => (
          <Skeleton key={t} className="flex-1 h-9 rounded-lg" />
        ))}
      </div>
      {/* Timeline items */}
      <div className="space-y-5">
        {[1, 2, 3].map((i) => (
          <div key={i} className="relative pl-14 pb-2">
            <div className="absolute left-4 w-5 h-5 rounded-full bg-dark-700 animate-pulse" />
            <div className="bg-dark-900 border border-dark-700 rounded-xl p-4 space-y-2">
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
  );
}

// ─── EventDetail skeleton ─────────────────────────────────────────────────────
export function EventDetailSkeleton() {
  return (
    <div className="max-w-3xl mx-auto" data-testid="skeleton-loader">
      {/* Event header */}
      <div className="bg-dark-900 border border-dark-700 rounded-2xl p-6 mb-6 space-y-3">
        <div className="flex gap-2">
          <Skeleton className="h-5 w-20 rounded-full" />
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>
        <Skeleton className="h-7 w-2/3" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-4/5" />
        <div className="flex gap-4 pt-1">
          <Skeleton className="h-3 w-28" />
          <Skeleton className="h-3 w-24" />
        </div>
      </div>
      {/* Post input area */}
      <div className="bg-dark-900 border border-dark-700 rounded-xl p-4 mb-6 space-y-3">
        <Skeleton className="h-20 w-full rounded-lg" />
        <div className="flex justify-end">
          <Skeleton className="h-9 w-20 rounded-lg" />
        </div>
      </div>
      {/* Posts */}
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="bg-dark-900 border border-dark-700 rounded-xl p-4 mb-4 space-y-3"
        >
          <div className="flex items-center gap-2">
            <Skeleton className="w-8 h-8 rounded-full" />
            <div className="space-y-1 flex-1">
              <Skeleton className="h-3 w-28" />
              <Skeleton className="h-3 w-20" />
            </div>
            <Skeleton className="h-3 w-24" />
          </div>
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <div className="flex gap-4">
            <Skeleton className="h-5 w-12" />
            <Skeleton className="h-5 w-12" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── UserProfile skeleton ─────────────────────────────────────────────────────
export function UserProfileSkeleton() {
  return (
    <div className="space-y-8" data-testid="skeleton-loader">
      {/* Profile card */}
      <section className="bg-dark-900 border border-dark-700 rounded-xl p-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-5">
          <Skeleton className="h-24 w-24 rounded-xl flex-shrink-0" />
          <div className="flex-1 space-y-3">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-8 w-48" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2 mt-2">
              <Skeleton className="h-3 w-36" />
              <Skeleton className="h-3 w-44" />
              <Skeleton className="h-3 w-32" />
              <Skeleton className="h-3 w-20" />
            </div>
          </div>
          <Skeleton className="h-9 w-28 rounded-lg self-start" />
        </div>
      </section>
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
              className="bg-dark-900 border border-dark-700 rounded-xl p-5 space-y-3"
            >
              <div className="flex items-start justify-between gap-3">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-5 w-16 rounded-full" />
              </div>
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-4/5" />
              <div className="grid grid-cols-3 gap-3">
                <Skeleton className="h-8 rounded" />
                <Skeleton className="h-8 rounded" />
                <Skeleton className="h-8 rounded" />
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
    <div data-testid="skeleton-loader">
      <div className="flex items-center justify-between mb-6">
        <Skeleton className="h-9 w-36" />
        <Skeleton className="h-9 w-32 rounded-lg" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Array.from({ length: count }, (_, i) => `mw-${i}`).map((id) => (
          <div
            key={id}
            className="bg-dark-900 border border-dark-700 rounded-xl p-5 space-y-3"
          >
            <div className="flex items-center justify-between">
              <Skeleton className="h-5 w-3/5" />
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-4/5" />
            <div className="flex gap-4">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-3 w-20" />
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
    <div data-testid="skeleton-loader">
      {/* Back + title */}
      <div className="flex items-center gap-4 mb-6">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-7 w-48" />
      </div>
      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-dark-900 rounded-xl p-1 border border-dark-700">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="flex-1 h-9 rounded-lg" />
        ))}
      </div>
      {/* List items */}
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="bg-dark-900 border border-dark-700 rounded-xl p-4 flex items-center justify-between"
          >
            <div className="space-y-1">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-24" />
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
        <div className="absolute inset-0 rounded-full border-4 border-dark-800" />
        <div className="absolute inset-0 rounded-full border-4 border-t-primary-500 border-r-primary-600 animate-spin" />
      </div>
      <div className="space-y-2 text-center">
        <Skeleton className="h-4 w-32 mx-auto" />
        <Skeleton className="h-3 w-20 mx-auto" />
      </div>
    </div>
  );
}

export default Skeleton;
