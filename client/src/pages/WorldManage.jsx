import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api.js';
import { WorldManageSkeleton } from '../components/SkeletonLoader';

export default function WorldManage() {
  const { id } = useParams();
  const [pendingMembers, setPendingMembers] = useState([]);
  const [pendingPosts, setPendingPosts] = useState([]);
  const [proposedEvents, setProposedEvents] = useState([]);
  const [tab, setTab] = useState('members');
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const [membersRes, postsRes, eventsRes] = await Promise.all([
        api.get(`/worlds/${id}/members/pending`),
        api.get(`/posts/world/${id}/pending`),
        api.get(`/events/world/${id}/proposed`),
      ]);
      setPendingMembers(membersRes.data);
      setPendingPosts(postsRes.data);
      setProposedEvents(eventsRes.data);
    } catch {}
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  const handleMember = async (memberId, status) => {
    try {
      await api.patch(`/worlds/${id}/members/${memberId}`, { status });
      setPendingMembers(pendingMembers.filter((m) => m.id !== memberId));
    } catch {}
  };

  const handlePost = async (postId, action) => {
    try {
      if (action === 'approve') {
        await api.patch(`/posts/${postId}/approve`);
      } else if (action === 'reject') {
        await api.patch(`/posts/${postId}/reject`);
      }
      setPendingPosts(pendingPosts.filter((p) => p.id !== postId));
    } catch {}
  };

  const handleEvent = async (eventId, status) => {
    try {
      await api.patch(`/events/${eventId}`, { status });
      setProposedEvents(proposedEvents.filter((e) => e.id !== eventId));
    } catch {}
  };

  if (loading) return <WorldManageSkeleton />;

  const tabs = [
    {
      key: 'members',
      label: 'Members',
      count: pendingMembers.length,
      icon: '👥',
    },
    { key: 'posts', label: 'Posts', count: pendingPosts.length, icon: '📝' },
    {
      key: 'events',
      label: 'Events',
      count: proposedEvents.length,
      icon: '⚡',
    },
  ];

  return (
    <div className="space-y-6">
      {/* ── Page header ──────────────────────────────── */}
      <div className="flex items-center gap-4 pb-5 border-b border-slate-200">
        <Link
          to={`/worlds/${id}`}
          className="flex items-center gap-1.5 text-slate-500 hover:text-slate-900 transition-colors text-sm font-medium"
        >
          ← Back
        </Link>
        <div className="h-5 w-px bg-slate-200" />
        <h1 className="text-2xl font-bold text-slate-900">World Management</h1>
      </div>

      {/* ── Stats row ────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-4">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`bg-white rounded-xl p-4 border text-left transition-all ${
              tab === t.key
                ? 'border-indigo-300 shadow-md ring-1 ring-indigo-200'
                : 'border-slate-200 shadow-sm hover:border-indigo-200'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xl">{t.icon}</span>
              {t.count > 0 && (
                <span className="bg-indigo-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                  {t.count}
                </span>
              )}
            </div>
            <p
              className={`text-sm font-semibold ${tab === t.key ? 'text-indigo-700' : 'text-slate-700'}`}
            >
              {t.label}
            </p>
            <p className="text-xs text-slate-400 mt-0.5">
              {t.count === 0 ? 'All clear' : `${t.count} pending`}
            </p>
          </button>
        ))}
      </div>

      {/* ── Pending Members ───────────────────────────── */}
      {tab === 'members' && (
        <section>
          <h2 className="text-base font-bold text-slate-900 mb-4">
            Pending Member Requests
          </h2>
          {pendingMembers.length === 0 ? (
            <EmptyState message="No pending member requests" />
          ) : (
            <div className="space-y-3">
              {pendingMembers.map((member) => (
                <div
                  key={member.id}
                  className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-slate-200 flex items-center justify-center text-sm font-bold text-slate-600 flex-shrink-0">
                      {member.display_name?.[0]?.toUpperCase()}
                    </div>
                    <div>
                      <span className="font-semibold text-slate-900 text-sm">
                        {member.display_name}
                      </span>
                      <span className="text-slate-400 text-xs ml-1.5">
                        @{member.username}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleMember(member.id, 'approved')}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-1.5 rounded-lg text-xs font-semibold transition-colors"
                    >
                      ✓ Approve
                    </button>
                    <button
                      onClick={() => handleMember(member.id, 'rejected')}
                      className="bg-white border border-red-200 hover:bg-red-50 text-red-600 px-4 py-1.5 rounded-lg text-xs font-semibold transition-colors"
                    >
                      ✕ Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* ── Pending Posts ─────────────────────────────── */}
      {tab === 'posts' && (
        <section>
          <h2 className="text-base font-bold text-slate-900 mb-4">
            Posts Awaiting Approval
          </h2>
          {pendingPosts.length === 0 ? (
            <EmptyState message="No posts awaiting approval" />
          ) : (
            <div className="space-y-3">
              {pendingPosts.map((post) => (
                <div
                  key={post.id}
                  className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden"
                >
                  <div className="px-4 py-3 bg-slate-50 border-b border-slate-100 flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-600 flex-shrink-0">
                      {post.display_name?.[0]?.toUpperCase()}
                    </div>
                    <span className="font-semibold text-slate-900 text-sm">
                      {post.display_name}
                    </span>
                    <span className="text-slate-400 text-xs">
                      @{post.username}
                    </span>
                  </div>
                  <div className="px-4 py-3">
                    <p className="text-slate-700 text-sm leading-relaxed mb-3 line-clamp-4">
                      {post.content}
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handlePost(post.id, 'approve')}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-1.5 rounded-lg text-xs font-semibold transition-colors"
                      >
                        ✓ Approve
                      </button>
                      <button
                        onClick={() => handlePost(post.id, 'reject')}
                        className="bg-white border border-red-200 hover:bg-red-50 text-red-600 px-4 py-1.5 rounded-lg text-xs font-semibold transition-colors"
                      >
                        ✕ Reject
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* ── Proposed Events ───────────────────────────── */}
      {tab === 'events' && (
        <section>
          <h2 className="text-base font-bold text-slate-900 mb-4">
            Proposed Small Events
          </h2>
          {proposedEvents.length === 0 ? (
            <EmptyState message="No event proposals pending" />
          ) : (
            <div className="space-y-3">
              {proposedEvents.map((event) => (
                <div
                  key={event.id}
                  className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden"
                >
                  <div className="px-4 py-3 bg-slate-50 border-b border-slate-100 flex items-center gap-2">
                    <span className="text-xs bg-amber-100 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full font-medium">
                      PROPOSAL
                    </span>
                    <span className="text-xs text-slate-500">
                      by {event.creator_display_name}
                    </span>
                  </div>
                  <div className="px-4 py-3">
                    <h3 className="font-bold text-slate-900 mb-1">
                      {event.title}
                    </h3>
                    <p className="text-slate-600 text-sm leading-relaxed mb-3">
                      {event.description}
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEvent(event.id, 'open')}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-1.5 rounded-lg text-xs font-semibold transition-colors"
                      >
                        ✓ Approve & Open
                      </button>
                      <button
                        onClick={() => handleEvent(event.id, 'rejected')}
                        className="bg-white border border-red-200 hover:bg-red-50 text-red-600 px-4 py-1.5 rounded-lg text-xs font-semibold transition-colors"
                      >
                        ✕ Reject
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}

function EmptyState({ message }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl py-14 text-center shadow-sm">
      <div className="text-3xl mb-3">✅</div>
      <p className="text-slate-500 text-sm">{message}</p>
    </div>
  );
}
