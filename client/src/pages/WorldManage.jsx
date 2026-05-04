import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api';

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
        api.get(`/events/world/${id}/proposed`)
      ]);
      setPendingMembers(membersRes.data);
      setPendingPosts(postsRes.data);
      setProposedEvents(eventsRes.data);
    } catch { }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [id]);

  const handleMember = async (memberId, status) => {
    try {
      await api.patch(`/worlds/${id}/members/${memberId}`, { status });
      setPendingMembers(pendingMembers.filter(m => m.id !== memberId));
    } catch { }
  };

  const handlePost = async (postId, action) => {
    try {
      if (action === 'approve') {
        await api.patch(`/posts/${postId}/approve`);
      }
      setPendingPosts(pendingPosts.filter(p => p.id !== postId));
    } catch { }
  };

  const handleEvent = async (eventId, status) => {
    try {
      await api.patch(`/events/${eventId}`, { status });
      setProposedEvents(proposedEvents.filter(e => e.id !== eventId));
    } catch { }
  };

  if (loading) return <div className="text-center text-dark-400 py-12">Loading...</div>;

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <Link to={`/worlds/${id}`} className="text-dark-400 hover:text-dark-200 transition">← Back to World</Link>
        <h1 className="text-2xl font-bold text-dark-100">World Management</h1>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-dark-900 rounded-xl p-1 border border-dark-700">
        {[
          { key: 'members', label: `Members (${pendingMembers.length})` },
          { key: 'posts', label: `Posts (${pendingPosts.length})` },
          { key: 'events', label: `Events (${proposedEvents.length})` }
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition ${tab === t.key ? 'bg-primary-600 text-white' : 'text-dark-400 hover:text-dark-200'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Pending Members */}
      {tab === 'members' && (
        <div>
          <h2 className="text-lg font-semibold text-dark-100 mb-4">Pending Member Requests</h2>
          {pendingMembers.length === 0 ? (
            <p className="text-dark-400 text-center py-8">No pending requests</p>
          ) : (
            <div className="space-y-3">
              {pendingMembers.map(member => (
                <div key={member.id} className="bg-dark-900 border border-dark-700 rounded-xl p-4 flex items-center justify-between">
                  <div>
                    <span className="font-medium text-dark-200">{member.display_name}</span>
                    <span className="text-dark-500 text-sm ml-2">@{member.username}</span>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleMember(member.id, 'approved')}
                      className="bg-green-700 hover:bg-green-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition">
                      Approve
                    </button>
                    <button onClick={() => handleMember(member.id, 'rejected')}
                      className="bg-red-800 hover:bg-red-700 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition">
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Pending Posts */}
      {tab === 'posts' && (
        <div>
          <h2 className="text-lg font-semibold text-dark-100 mb-4">Pending Posts</h2>
          {pendingPosts.length === 0 ? (
            <p className="text-dark-400 text-center py-8">No pending posts</p>
          ) : (
            <div className="space-y-3">
              {pendingPosts.map(post => (
                <div key={post.id} className="bg-dark-900 border border-dark-700 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-medium text-dark-200">{post.display_name}</span>
                    <span className="text-dark-500 text-sm">@{post.username}</span>
                  </div>
                  <p className="text-dark-300 text-sm mb-3">{post.content}</p>
                  <div className="flex gap-2">
                    <button onClick={() => handlePost(post.id, 'approve')}
                      className="bg-green-700 hover:bg-green-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition">
                      Approve
                    </button>
                    <button onClick={() => handlePost(post.id, 'reject')}
                      className="bg-red-800 hover:bg-red-700 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition">
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Proposed Events */}
      {tab === 'events' && (
        <div>
          <h2 className="text-lg font-semibold text-dark-100 mb-4">Proposed Small Events</h2>
          {proposedEvents.length === 0 ? (
            <p className="text-dark-400 text-center py-8">No event proposals</p>
          ) : (
            <div className="space-y-3">
              {proposedEvents.map(event => (
                <div key={event.id} className="bg-dark-900 border border-dark-700 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs bg-dark-700 text-dark-300 px-2 py-0.5 rounded-full">SMALL EVENT PROPOSAL</span>
                  </div>
                  <h3 className="font-semibold text-dark-100 mb-1">{event.title}</h3>
                  <p className="text-dark-400 text-sm mb-1">{event.description}</p>
                  <p className="text-dark-500 text-xs mb-3">Proposed by {event.creator_display_name}</p>
                  <div className="flex gap-2">
                    <button onClick={() => handleEvent(event.id, 'open')}
                      className="bg-green-700 hover:bg-green-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition">
                      Approve & Open
                    </button>
                    <button onClick={() => handleEvent(event.id, 'rejected')}
                      className="bg-red-800 hover:bg-red-700 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition">
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
