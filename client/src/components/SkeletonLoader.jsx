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

// ─── WorldList skeleton (ranked list rows) ────────────────────────────────────
export function WorldListSkeleton({ count = 6 }) {
  return (
    <div data-testid="skeleton-loader" className="space-y-3">
      {/* Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 flex items-center justify-between">
        <div className="space-y-1.5">
          <Skeleton className="h-5 w-36" />
          <Skeleton className="h-3 w-52" />
        </div>
        <Skeleton className="h-9 w-28 rounded-full" />
      </div>
      {/* Search */}
      <div className="bg-white rounded-xl border border-slate-200 p-3">
        <div className="flex gap-2">
          <Skeleton className="flex-1 h-9 rounded-full" />
          <Skeleton className="w-20 h-9 rounded-full" />
        </div>
      </div>
      {/* List rows */}
      <div className="space-y-2">
        {Array.from({ length: count }, (_, i) => `wl-${i}`).map((id) => (
          <div key={id} className="bg-white border border-slate-200 rounded-xl p-4 flex items-center gap-3">
            <Skeleton className="h-4 w-4 flex-shrink-0" />
            <Skeleton className="w-10 h-10 rounded-full flex-shrink-0" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-48" />
            </div>
            <Skeleton className="h-8 w-16 rounded-full flex-shrink-0" />
          </div>
        ))}
      </div>
    </div>
  );
}

WorldListSkeleton.propTypes = { count: PropTypes.number };

// ─── WorldDetail skeleton (banner + right sidebar) ───────────────────────────
export function WorldDetailSkeleton() {
  return (
    <div data-testid="skeleton-loader" className="space-y-3">
      {/* Banner */}
      <Skeleton className="h-20 sm:h-28 rounded-xl" />
      {/* Community header */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center gap-3">
        <Skeleton className="w-14 h-14 rounded-full -mt-8 flex-shrink-0" />
        <div className="flex-1 space-y-1.5">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-3 w-28" />
        </div>
        <Skeleton className="h-8 w-20 rounded-full flex-shrink-0" />
      </div>
      {/* Tabs */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="flex border-b border-slate-200 px-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-10 w-20 mx-1 my-1.5 rounded" />
          ))}
        </div>
        {/* Feed area */}
        <div className="p-4 lg:grid lg:grid-cols-3 lg:gap-4">
          <div className="lg:col-span-2 space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="border border-slate-100 rounded-xl overflow-hidden flex">
                <div className="w-10 bg-slate-100 flex-shrink-0" />
                <div className="flex-1 p-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <Skeleton className="w-5 h-5 rounded-full" />
                    <Skeleton className="h-3 w-24" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-5/6" />
                </div>
              </div>
            ))}
          </div>
          <div className="hidden lg:block lg:col-span-1">
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <Skeleton className="h-14 w-full" />
              <div className="p-3 space-y-2">
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-4/5" />
                <Skeleton className="h-8 w-full rounded-full mt-2" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── EventDetail skeleton (Reddit post style) ────────────────────────────────
export function EventDetailSkeleton() {
  return (
    <div className="max-w-2xl mx-auto space-y-3" data-testid="skeleton-loader">
      {/* Event "OP post" card */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="flex">
          <div className="w-10 bg-slate-100 flex-shrink-0" />
          <div className="flex-1 p-4 space-y-2.5">
            <div className="flex gap-2">
              <Skeleton className="h-5 w-20 rounded-full" />
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
            <Skeleton className="h-6 w-2/3" />
            <Skeleton className="h-3 w-44" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-5/6" />
            <div className="flex gap-3 pt-2 border-t border-slate-100">
              <Skeleton className="h-6 w-28 rounded" />
              <Skeleton className="h-6 w-16 rounded" />
            </div>
          </div>
        </div>
      </div>
      {/* Compose box */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
        <Skeleton className="h-3 w-32" />
        <Skeleton className="h-24 w-full rounded-md" />
        <div className="flex justify-end">
          <Skeleton className="h-9 w-24 rounded-full" />
        </div>
      </div>
      {/* Post cards */}
      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="flex">
            <div className="w-10 bg-slate-100 flex-shrink-0" />
            <div className="flex-1 p-3 space-y-2">
              <div className="flex items-center gap-2">
                <Skeleton className="w-5 h-5 rounded-full" />
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-3 w-20" />
              </div>
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-4/5" />
              <div className="flex gap-3 pt-1">
                <Skeleton className="h-5 w-24 rounded" />
                <Skeleton className="h-5 w-16 rounded" />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── UserProfile skeleton (Reddit profile) ───────────────────────────────────
export function UserProfileSkeleton() {
  return (
    <div className="space-y-4" data-testid="skeleton-loader">
      {/* Profile card */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <Skeleton className="h-24 rounded-none" />
        <div className="px-5 pb-5">
          <div className="flex items-end gap-4 -mt-8 mb-4">
            <Skeleton className="h-16 w-16 rounded-full flex-shrink-0 border-4 border-white" />
            <div className="flex-1 space-y-1.5 pb-1">
              <Skeleton className="h-5 w-36" />
              <Skeleton className="h-3 w-24" />
            </div>
            <Skeleton className="h-8 w-24 rounded-full flex-shrink-0" />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-3 border-y border-slate-100">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="space-y-1">
                <Skeleton className="h-2.5 w-16" />
                <Skeleton className="h-4 w-24" />
              </div>
            ))}
          </div>
        </div>
      </div>
      {/* World rows */}
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white border border-slate-200 rounded-xl p-4 flex items-center gap-3">
            <Skeleton className="w-9 h-9 rounded-full flex-shrink-0" />
            <div className="flex-1 space-y-1.5">
              <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-4 w-14 rounded-full" />
              </div>
              <Skeleton className="h-3 w-36" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── MyWorlds skeleton (list rows) ────────────────────────────────────────────
export function MyWorldsSkeleton({ count = 4 }) {
  return (
    <div data-testid="skeleton-loader" className="space-y-4">
      {/* Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 flex items-center justify-between">
        <div className="space-y-1.5">
          <Skeleton className="h-5 w-28" />
          <Skeleton className="h-3 w-44" />
        </div>
        <Skeleton className="h-9 w-32 rounded-full" />
      </div>
      {/* List rows */}
      <div className="space-y-2">
        {Array.from({ length: count }, (_, i) => `mw-${i}`).map((id) => (
          <div key={id} className="bg-white border border-slate-200 rounded-xl p-4 flex items-center gap-3">
            <Skeleton className="w-9 h-9 rounded-full flex-shrink-0" />
            <div className="flex-1 space-y-1.5">
              <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-14 rounded-full" />
              </div>
              <Skeleton className="h-3 w-40" />
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <Skeleton className="h-8 w-16 rounded-full" />
              <Skeleton className="h-8 w-12 rounded-full" />
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
    <div data-testid="skeleton-loader" className="max-w-2xl mx-auto space-y-3">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center gap-3">
        <Skeleton className="h-4 w-12" />
        <div className="h-4 w-px bg-slate-200" />
        <Skeleton className="h-5 w-24" />
      </div>
      {/* Card with tabs */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="flex border-b border-slate-200">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="flex-1 h-12 rounded-none" style={{ opacity: i === 1 ? 1 : 0.5 }} />
          ))}
        </div>
        <div className="p-4 space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center justify-between gap-3 p-3 bg-slate-50 rounded-lg">
              <div className="flex items-center gap-2.5">
                <Skeleton className="w-8 h-8 rounded-full flex-shrink-0" />
                <div className="space-y-1">
                  <Skeleton className="h-3.5 w-28" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </div>
              <div className="flex gap-2">
                <Skeleton className="h-7 w-20 rounded-full" />
                <Skeleton className="h-7 w-16 rounded-full" />
              </div>
            </div>
          ))}
        </div>
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
