import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function Home() {
  const { user } = useAuth();

  return (
    <div className="space-y-20 py-4">
      {/* ── Hero ───────────────────────────────────────── */}
      <div className="relative text-center py-20 px-6 overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-50 via-white to-violet-50 border border-indigo-100">
        {/* Decorative blobs */}
        <div className="pointer-events-none absolute -top-16 -left-16 w-72 h-72 bg-indigo-200/30 rounded-full blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 -right-16 w-72 h-72 bg-violet-200/30 rounded-full blur-3xl" />

        <div className="relative">
          <span className="inline-flex items-center gap-1.5 bg-white text-indigo-700 text-xs font-semibold px-3 py-1.5 rounded-full border border-indigo-200 shadow-sm mb-8">
            ✨ Collaborative World-Building
          </span>
          <h1 className="text-5xl sm:text-6xl font-extrabold text-slate-900 leading-tight mb-5">
            Where Stories
            <br />
            <span className="text-indigo-600">Come Alive</span>
          </h1>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto mb-3">
            Create, join, and experience collaborative roleplay worlds together.
          </p>
          <p className="text-slate-400 max-w-xl mx-auto mb-10">
            Build immersive worlds with lore timelines, events, and communities.
            No coding needed — just pure collaborative storytelling.
          </p>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <Link
              to="/worlds"
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3.5 rounded-xl font-semibold text-base transition-colors shadow-lg shadow-indigo-200/60"
            >
              Explore Worlds →
            </Link>
            {!user && (
              <Link
                to="/register"
                className="bg-white hover:bg-slate-50 text-slate-700 px-8 py-3.5 rounded-xl font-semibold text-base transition-colors border border-slate-300 shadow-sm"
              >
                Create Account
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* ── Features ───────────────────────────────────── */}
      <div>
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-slate-900 mb-2">
            Everything you need to tell your story
          </h2>
          <p className="text-slate-500">
            Powerful tools for world-builders and storytellers.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-2xl p-7 border border-slate-200 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all group">
            <div className="w-13 h-13 w-14 h-14 bg-indigo-100 rounded-2xl flex items-center justify-center text-2xl mb-5 group-hover:scale-110 transition-transform">
              🌍
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">
              Create Worlds
            </h3>
            <p className="text-slate-500 text-sm leading-relaxed">
              Build roleplay worlds with rich lore, timelines, and events for
              others to explore and contribute to.
            </p>
          </div>

          <div className="bg-white rounded-2xl p-7 border border-slate-200 shadow-sm hover:shadow-md hover:border-violet-200 transition-all group">
            <div className="w-14 h-14 bg-violet-100 rounded-2xl flex items-center justify-center text-2xl mb-5 group-hover:scale-110 transition-transform">
              ⚡
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">
              Join Events
            </h3>
            <p className="text-slate-500 text-sm leading-relaxed">
              Participate in big and small events, create posts, comment, and
              interact with the community.
            </p>
          </div>

          <div className="bg-white rounded-2xl p-7 border border-slate-200 shadow-sm hover:shadow-md hover:border-amber-200 transition-all group">
            <div className="w-14 h-14 bg-amber-100 rounded-2xl flex items-center justify-center text-2xl mb-5 group-hover:scale-110 transition-transform">
              🏆
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">
              Earn Credits
            </h3>
            <p className="text-slate-500 text-sm leading-relaxed">
              Gain citizen credits through interactions and climb your world&apos;s
              leaderboard.
            </p>
          </div>
        </div>
      </div>

      {/* ── CTA (non-auth only) ─────────────────────────── */}
      {!user && (
        <div className="bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-700 rounded-3xl p-12 text-center text-white relative overflow-hidden">
          <div className="pointer-events-none absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/3 translate-x-1/3" />
          <div className="pointer-events-none absolute bottom-0 left-0 w-64 h-64 bg-white/5 rounded-full translate-y-1/3 -translate-x-1/3" />
          <div className="relative">
            <h2 className="text-3xl font-extrabold mb-3">
              Ready to build your world?
            </h2>
            <p className="text-indigo-200 mb-8 text-lg max-w-lg mx-auto">
              Join a community of storytellers and start crafting your universe
              today.
            </p>
            <div className="flex items-center justify-center gap-4 flex-wrap">
              <Link
                to="/register"
                className="bg-white text-indigo-700 hover:bg-indigo-50 px-8 py-3.5 rounded-xl font-bold text-base transition-colors shadow-md"
              >
                Get Started Free
              </Link>
              <Link
                to="/worlds"
                className="text-indigo-200 hover:text-white px-4 py-3.5 font-medium text-base transition-colors"
              >
                Browse Worlds →
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
