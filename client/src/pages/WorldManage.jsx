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
    { key: 'members', label: 'Members', count: pendingMembers.length, icon: '👥' },
    { key: 'posts', label: 'Posts', count: pendingPosts.length, icon: '📝' },
    { key: 'events', label: 'Events', count: proposedEvents.length, icon: '⚡' },
  ];

  return (
    <div className="max-w-2xl mx-auto space-y-3">
      {/* ── Header ── */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex items-center gap-3">
        <Link
          to={`/worlds/${id}`}
          className="text-slate-500 hover:text-slate-900 transition-colors text-sm font-bold"
        >
          ← Back
        </Link>
        <div className="h-4 w-px bg-slate-200" />
        <h1 className="text-lg font-extrabold text-slate-900">Mod Tools</h1>
      </div>

      {/* ── Tabs ── */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="flex border-b border-slate-200">
          {tabs.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={`flex-1 flex items-center justify-center gap-1.5 px-4 py-3 text-sm font-bold transition-colors relative ${
                tab === t.key
                  ? 'text-indigo-600 border-b-2 border-indigo-600 -mb-px'
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
              }`}
            >
              <span>{t.icon}</span>
              <span>{t.label}</span>
              {t.count > 0 && (
                <span className="bg-indigo-600 text-white text-xs font-bold px-1.5 py-0.5 rounded-full leading-none">
                  {t.count}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="p-4">
          {/* ── Pending Members ── */}
          {tab === 'members' && (
            <div className="space-y-2">
              {pendingMembers.length === 0 ? (
                <EmptyState message="No pending member requests" />
              ) : (
                pendingMembers.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between gap-3 p-3 bg-[#f8f9fa] rounded-lg border border-slate-100"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-violet-500 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                        {member.display_name?.[0]?.toUpperCase()}
                      </div>
                      <div>
                        <span className="font-bold text-slate-900 text-sm">{member.display_name}</span>
                        <span className="text-slate-400 text-xs ml-1.5">u/{member.username}</span>
                      </div>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <button
                        type="button"
                        onClick={() => handleMember(member.id, 'approved')}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-full text-xs font-bold transition-colors"
                      >
                        ✓ Approve
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMember(member.id, 'rejected')}
                        className="border border-red-200 bg-white hover:bg-red-50 text-red-600 px-3 py-1.5 rounded-full text-xs font-bold transition-colors"
                      >
                        ✕ Reject
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* ── Pending Posts ── */}
          {tab === 'posts' && (
            <div className="space-y-3">
              {pendingPosts.length === 0 ? (
                <EmptyState message="No posts awaiting approval" />
              ) : (
                pendingPosts.map((post) => (
                  <div key={post.id} className="border border-slate-200 rounded-xl overflow-hidden">
                    <div className="flex items-center gap-2 px-3 py-2.5 bg-[#f8f9fa] border-b border-slate-100">
                      <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center text-xs font-bold text-indigo-600 flex-shrink-0">
                        {post.display_name?.[0]?.toUpperCase()}
                      </div>
                      <span className="font-bold text-slate-900 text-xs">u/{post.username}</span>
                      <span className="text-slate-400 text-xs ml-auto">PENDING</span>
                    </div>
                    <div className="p-3">
                      <p className="text-slate-700 text-sm leading-relaxed mb-3 line-clamp-4">{post.content}</p>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => handlePost(post.id, 'approve')}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-full text-xs font-bold transition-colors"
                        >
                          ✓ Approve
                        </button>
                        <button
                          type="button"
                          onClick={() => handlePost(post.id, 'reject')}
                          className="border border-red-200 bg-white hover:bg-red-50 text-red-600 px-3 py-1.5 rounded-full text-xs font-bold transition-colors"
                        >
                          ✕ Reject
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* ── Proposed Events ── */}
          {tab === 'events' && (
            <div className="space-y-3">
              {proposedEvents.length === 0 ? (
                <EmptyState message="No event proposals pending" />
              ) : (
                proposedEvents.map((event) => (
                  <div key={event.id} className="border border-slate-200 rounded-xl overflow-hidden">
                    <div className="flex items-center gap-2 px-3 py-2.5 bg-[#f8f9fa] border-b border-slate-100">
                      <span className="text-xs bg-amber-100 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full font-bold">PROPOSAL</span>
                      <span className="text-xs text-slate-500">by {event.creator_display_name}</span>
                    </div>
                    <div className="p-3">
                      <h3 className="font-bold text-slate-900 mb-1 text-sm">{event.title}</h3>
                      <p className="text-slate-600 text-sm leading-relaxed mb-3">{event.description}</p>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => handleEvent(event.id, 'open')}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-full text-xs font-bold transition-colors"
                        >
                          ✓ Approve & Open
                        </button>
                        <button
                          type="button"
                          onClick={() => handleEvent(event.id, 'rejected')}
                          className="border border-red-200 bg-white hover:bg-red-50 text-red-600 px-3 py-1.5 rounded-full text-xs font-bold transition-colors"
                        >
                          ✕ Reject
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function EmptyState({ message }) {
  return (
    <div className="py-12 text-center">
      <div className="text-3xl mb-3">✅</div>
      <p className="text-slate-500 text-sm">{message}</p>
    </div>
  );
}
