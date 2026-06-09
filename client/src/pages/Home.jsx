import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function Home() {
  const { user } = useAuth();

  return (
    <div className="max-w-2xl mx-auto space-y-3 py-2">
      {/* ── Welcome banner (guests only) ── */}
      {!user && (
        <div className="bg-gradient-to-r from-indigo-600 to-violet-700 rounded-xl p-5 text-white shadow-sm">
          <h1 className="text-xl font-extrabold mb-1 tracking-tight">
            Welcome to LACEBO
          </h1>
          <p className="text-indigo-200 text-sm mb-4 leading-relaxed">
            The front page of collaborative storytelling. Create worlds, join communities, and shape stories together.
          </p>
          <div className="flex gap-2">
            <Link
              to="/register"
              className="bg-white text-indigo-700 hover:bg-indigo-50 px-4 py-1.5 rounded-full font-bold text-sm transition-colors shadow-sm"
            >
              Sign Up
            </Link>
            <Link
              to="/login"
              className="border border-white/50 text-white hover:bg-white/10 px-4 py-1.5 rounded-full font-bold text-sm transition-colors"
            >
              Log In
            </Link>
          </div>
        </div>
      )}

      {/* ── Post-style feature cards ── */}
      {[
        {
          icon: '🌍',
          color: 'text-indigo-600',
          bg: 'bg-indigo-50',
          community: 'w/WorldBuilding',
          title: 'Create immersive roleplay worlds',
          body: 'Build your own universe with rich lore timelines, events, and announcements. Approve members and grow your community.',
          count: 42,
        },
        {
          icon: '⚡',
          color: 'text-violet-600',
          bg: 'bg-violet-50',
          community: 'w/Events',
          title: 'Participate in community events',
          body: 'Join big and small events, share posts, leave comments, and earn credits for your contributions.',
          count: 128,
        },
        {
          icon: '🏆',
          color: 'text-amber-600',
          bg: 'bg-amber-50',
          community: 'w/Leaderboard',
          title: 'Climb the citizen leaderboard',
          body: 'Earn credits through activity and see how you rank among members in your world.',
          count: 77,
        },
      ].map((card) => (
        <div
          key={card.title}
          className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm hover:border-indigo-200 transition-all"
        >
          <div className="flex">
            {/* Vote-style column */}
            <div className="w-10 bg-[#f8f9fa] flex flex-col items-center py-3 gap-1 border-r border-slate-100 flex-shrink-0">
              <span className={`text-base ${card.color}`}>{card.icon}</span>
              <span className="text-xs font-bold text-slate-400">{card.count}</span>
            </div>
            {/* Content */}
            <div className="flex-1 p-3.5">
              <div className="flex items-center gap-1.5 mb-1.5">
                <div className={`w-4 h-4 rounded-full ${card.bg} flex items-center justify-center text-[9px]`}>
                  {card.icon}
                </div>
                <span className="text-xs font-bold text-slate-800 hover:underline cursor-pointer">{card.community}</span>
                <span className="text-xs text-slate-400">• Posted by u/lacebo</span>
              </div>
              <h3 className="font-semibold text-slate-900 text-sm mb-1.5">{card.title}</h3>
              <p className="text-slate-500 text-sm leading-relaxed mb-2.5">{card.body}</p>
              <div className="flex items-center gap-1 text-xs text-slate-400">
                <Link
                  to="/worlds"
                  className="flex items-center gap-1 hover:text-indigo-600 hover:bg-[#f0f2f5] px-2 py-1 rounded transition-colors font-semibold"
                >
                  💬 {card.count} Comments
                </Link>
                <span className="hover:bg-[#f0f2f5] px-2 py-1 rounded cursor-pointer transition-colors font-semibold">
                  🔗 Share
                </span>
              </div>
            </div>
          </div>
        </div>
      ))}

      {/* ── CTA ── */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 text-center shadow-sm">
        <p className="text-slate-700 text-sm mb-3 font-semibold">Ready to build your own world?</p>
        <Link
          to="/worlds/create"
          className="inline-flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-full font-bold text-sm transition-colors shadow-sm"
        >
          + Create a World
        </Link>
      </div>
    </div>
  );
}
