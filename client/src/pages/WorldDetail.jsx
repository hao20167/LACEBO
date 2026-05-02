import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api';

export default function WorldDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [world, setWorld] = useState(null);
  const [events, setEvents] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [tab, setTab] = useState('lore');
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);

  // Announcement form
  const [showAnnForm, setShowAnnForm] = useState(false);
  const [annTitle, setAnnTitle] = useState('');
  const [annContent, setAnnContent] = useState('');

  // Event form
  const [showEventForm, setShowEventForm] = useState(false);
  const [eventForm, setEventForm] = useState({ title: '', description: '', event_type: 'big', start_date: '', end_date: '' });

  // Small event proposal
  const [showProposalForm, setShowProposalForm] = useState(false);
  const [proposalForm, setProposalForm] = useState({ title: '', description: '' });

  const fetchData = async () => {
    try {
      const [worldRes, eventsRes, annRes, lbRes] = await Promise.all([
        api.get(`/worlds/${id}`),
        api.get(`/events/world/${id}`),
        api.get(`/posts/world/${id}/announcements`),
        api.get(`/worlds/${id}/leaderboard`)
      ]);
      setWorld(worldRes.data);
      setEvents(eventsRes.data);
      setAnnouncements(annRes.data);
      setLeaderboard(lbRes.data);
    } catch { }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [id]);

  const isDev = world?.membership?.role === 'dev' && world?.membership?.status === 'approved';
  const isMember = world?.membership?.status === 'approved';
  const isPending = world?.membership?.status === 'pending';

  const handleJoin = async () => {
    setJoining(true);
    try {
      await api.post(`/worlds/${id}/join`);
      fetchData();
    } catch { }
    setJoining(false);
  };

  const handleAnnouncement = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/posts/world/${id}/announcements`, { title: annTitle, content: annContent });
      setShowAnnForm(false);
      setAnnTitle('');
      setAnnContent('');
      fetchData();
    } catch { }
  };

  const handleCreateEvent = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/events/world/${id}`, eventForm);
      setShowEventForm(false);
      setEventForm({ title: '', description: '', event_type: 'big', start_date: '', end_date: '' });
      fetchData();
    } catch { }
  };

  const handleProposal = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/events/world/${id}`, { ...proposalForm, event_type: 'small' });
      setShowProposalForm(false);
      setProposalForm({ title: '', description: '' });
      alert('Small event proposed! Waiting for Dev approval.');
    } catch { }
  };

  if (loading) return <div className="text-center text-dark-400 py-12">Loading world...</div>;
  if (!world) return <div className="text-center text-dark-400 py-12">World not found</div>;

  const openEvents = events.filter(e => e.status === 'open');
  const closedEvents = events.filter(e => e.status === 'closed');
  const approvedSmall = events.filter(e => e.event_type === 'small' && e.status === 'approved');

  return (
    <div>
      {/* Header */}
      <div className="bg-dark-900 border border-dark-700 rounded-2xl p-6 mb-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-dark-100 mb-2">{world.title}</h1>
            <p className="text-dark-400 mb-4">{world.description}</p>
            <div className="flex items-center gap-4 text-sm text-dark-500">
              <span>👥 {world.member_count} members</span>
              {isMember && <span>⭐ {world.membership.credits} credits</span>}
              {isMember && <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${isDev ? 'bg-purple-900/50 text-purple-300' : 'bg-blue-900/50 text-blue-300'}`}>
                {world.membership.role.toUpperCase()}
              </span>}
            </div>
          </div>
          <div className="flex gap-2">
            {!user ? (
              <Link to="/login" className="bg-primary-600 hover:bg-primary-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition">Login to Join</Link>
            ) : isPending ? (
              <span className="bg-yellow-900/30 text-yellow-300 px-4 py-2 rounded-lg text-sm">Pending Approval</span>
            ) : !isMember ? (
              <button onClick={handleJoin} disabled={joining} className="bg-primary-600 hover:bg-primary-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition disabled:opacity-50">
                {joining ? 'Joining...' : 'Join World'}
              </button>
            ) : null}
            {isDev && (
              <Link to={`/worlds/${id}/manage`} className="bg-dark-700 hover:bg-dark-600 text-dark-200 px-4 py-2 rounded-lg text-sm font-medium transition">
                Manage
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-dark-900 rounded-xl p-1 border border-dark-700">
        {['lore', 'events', 'announcements', 'leaderboard'].map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition capitalize ${tab === t ? 'bg-primary-600 text-white' : 'text-dark-400 hover:text-dark-200'}`}>
            {t}
          </button>
        ))}
      </div>

      {/* Lore Tab - Timeline */}
      {tab === 'lore' && (
        <div>
          <h2 className="text-xl font-bold text-dark-100 mb-4">World Lore Timeline</h2>
          {events.length === 0 ? (
            <p className="text-dark-400 text-center py-8">No events in this world's lore yet.</p>
          ) : (
            <div className="relative">
              <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-dark-700"></div>
              {events.map((event, i) => (
                <div key={event.id} className="relative pl-14 pb-8">
                  <div className={`absolute left-4 w-5 h-5 rounded-full border-2 ${
                    event.event_type === 'big' 
                      ? 'bg-primary-500 border-primary-400' 
                      : 'bg-dark-600 border-dark-500'
                  } ${event.status === 'open' ? 'ring-2 ring-green-400 ring-offset-2 ring-offset-dark-950' : ''}`}></div>
                  <Link to={`/events/${event.id}`}
                    className={`block bg-dark-900 border rounded-xl p-4 transition hover:border-primary-600 ${
                      event.event_type === 'big' ? 'border-primary-800' : 'border-dark-700'
                    }`}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        event.event_type === 'big' ? 'bg-primary-900/50 text-primary-300' : 'bg-dark-700 text-dark-300'
                      }`}>
                        {event.event_type === 'big' ? 'BIG EVENT' : 'SMALL EVENT'}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        event.status === 'open' ? 'bg-green-900/50 text-green-300' : 'bg-dark-700 text-dark-400'
                      }`}>
                        {event.status.toUpperCase()}
                      </span>
                    </div>
                    <h3 className={`font-semibold mb-1 ${event.event_type === 'big' ? 'text-lg text-dark-100' : 'text-base text-dark-200'}`}>
                      {event.title}
                    </h3>
                    <p className="text-dark-400 text-sm line-clamp-2">{event.description}</p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-dark-500">
                      {event.start_date && <span>📅 {new Date(event.start_date).toLocaleDateString()}</span>}
                      {event.end_date && <span>→ {new Date(event.end_date).toLocaleDateString()}</span>}
                      <span>📝 {event.post_count} posts</span>
                    </div>
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Events Tab */}
      {tab === 'events' && (
        <div className="space-y-6">
          {/* Ongoing Events */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xl font-bold text-dark-100">🔴 Ongoing Events</h2>
              {isDev && (
                <button onClick={() => setShowEventForm(!showEventForm)}
                  className="bg-primary-600 hover:bg-primary-500 text-white px-4 py-1.5 rounded-lg text-sm font-medium transition">
                  + New Event
                </button>
              )}
            </div>

            {showEventForm && (
              <form onSubmit={handleCreateEvent} className="bg-dark-900 border border-dark-700 rounded-xl p-4 mb-4 space-y-3">
                <input type="text" placeholder="Event title" value={eventForm.title}
                  onChange={e => setEventForm({ ...eventForm, title: e.target.value })} required
                  className="w-full bg-dark-800 border border-dark-600 rounded-lg px-3 py-2 text-sm text-dark-100 focus:outline-none focus:border-primary-500" />
                <textarea placeholder="Event description" value={eventForm.description}
                  onChange={e => setEventForm({ ...eventForm, description: e.target.value })} rows={3}
                  className="w-full bg-dark-800 border border-dark-600 rounded-lg px-3 py-2 text-sm text-dark-100 focus:outline-none focus:border-primary-500 resize-none" />
                <div className="flex gap-3">
                  <select value={eventForm.event_type} onChange={e => setEventForm({ ...eventForm, event_type: e.target.value })}
                    className="bg-dark-800 border border-dark-600 rounded-lg px-3 py-2 text-sm text-dark-100">
                    <option value="big">Big Event</option>
                    <option value="small">Small Event</option>
                  </select>
                  <input type="datetime-local" value={eventForm.start_date}
                    onChange={e => setEventForm({ ...eventForm, start_date: e.target.value })}
                    className="bg-dark-800 border border-dark-600 rounded-lg px-3 py-2 text-sm text-dark-100" />
                  <input type="datetime-local" value={eventForm.end_date}
                    onChange={e => setEventForm({ ...eventForm, end_date: e.target.value })}
                    className="bg-dark-800 border border-dark-600 rounded-lg px-3 py-2 text-sm text-dark-100" />
                </div>
                <button type="submit" className="bg-primary-600 hover:bg-primary-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition">Create Event</button>
              </form>
            )}

            {openEvents.length === 0 ? (
              <p className="text-dark-400 text-sm">No ongoing events</p>
            ) : (
              <div className="space-y-3">
                {openEvents.map(event => (
                  <Link key={event.id} to={`/events/${event.id}`}
                    className="block bg-dark-900 border border-green-800 rounded-xl p-4 hover:border-green-600 transition">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${event.event_type === 'big' ? 'bg-primary-900/50 text-primary-300' : 'bg-dark-700 text-dark-300'}`}>
                        {event.event_type.toUpperCase()}
                      </span>
                      <span className="text-xs bg-green-900/50 text-green-300 px-2 py-0.5 rounded-full">OPEN</span>
                    </div>
                    <h3 className="text-lg font-semibold text-dark-100">{event.title}</h3>
                    <p className="text-dark-400 text-sm">{event.description}</p>
                    <div className="text-xs text-dark-500 mt-2">
                      {event.start_date && <span>📅 {new Date(event.start_date).toLocaleDateString()}</span>}
                      {event.end_date && <span> → {new Date(event.end_date).toLocaleDateString()}</span>}
                      <span className="ml-3">📝 {event.post_count} posts</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Small Event Proposals */}
          {isMember && !isDev && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-xl font-bold text-dark-100">💡 Propose Small Event</h2>
                <button onClick={() => setShowProposalForm(!showProposalForm)}
                  className="bg-dark-700 hover:bg-dark-600 text-dark-200 px-4 py-1.5 rounded-lg text-sm font-medium transition">
                  + Propose
                </button>
              </div>
              {showProposalForm && (
                <form onSubmit={handleProposal} className="bg-dark-900 border border-dark-700 rounded-xl p-4 space-y-3">
                  <input type="text" placeholder="Event title" value={proposalForm.title}
                    onChange={e => setProposalForm({ ...proposalForm, title: e.target.value })} required
                    className="w-full bg-dark-800 border border-dark-600 rounded-lg px-3 py-2 text-sm text-dark-100 focus:outline-none focus:border-primary-500" />
                  <textarea placeholder="Describe the event..." value={proposalForm.description}
                    onChange={e => setProposalForm({ ...proposalForm, description: e.target.value })} rows={3}
                    className="w-full bg-dark-800 border border-dark-600 rounded-lg px-3 py-2 text-sm text-dark-100 focus:outline-none focus:border-primary-500 resize-none" />
                  <button type="submit" className="bg-primary-600 hover:bg-primary-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition">Submit Proposal</button>
                </form>
              )}
            </div>
          )}

          {/* Past Events */}
          {closedEvents.length > 0 && (
            <div>
              <h2 className="text-xl font-bold text-dark-100 mb-3">📜 Past Events</h2>
              <div className="space-y-3">
                {closedEvents.map(event => (
                  <Link key={event.id} to={`/events/${event.id}`}
                    className="block bg-dark-900 border border-dark-700 rounded-xl p-4 hover:border-dark-500 transition opacity-75">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${event.event_type === 'big' ? 'bg-primary-900/50 text-primary-300' : 'bg-dark-700 text-dark-300'}`}>
                        {event.event_type.toUpperCase()}
                      </span>
                      <span className="text-xs bg-dark-700 text-dark-400 px-2 py-0.5 rounded-full">CLOSED</span>
                    </div>
                    <h3 className="font-semibold text-dark-200">{event.title}</h3>
                    <span className="text-xs text-dark-500">📝 {event.post_count} posts</span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Announcements Tab */}
      {tab === 'announcements' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-dark-100">📢 Announcements</h2>
            {isDev && (
              <button onClick={() => setShowAnnForm(!showAnnForm)}
                className="bg-primary-600 hover:bg-primary-500 text-white px-4 py-1.5 rounded-lg text-sm font-medium transition">
                + New Announcement
              </button>
            )}
          </div>

          {showAnnForm && (
            <form onSubmit={handleAnnouncement} className="bg-dark-900 border border-dark-700 rounded-xl p-4 mb-4 space-y-3">
              <input type="text" placeholder="Announcement title" value={annTitle} onChange={e => setAnnTitle(e.target.value)} required
                className="w-full bg-dark-800 border border-dark-600 rounded-lg px-3 py-2 text-sm text-dark-100 focus:outline-none focus:border-primary-500" />
              <textarea placeholder="Announcement content" value={annContent} onChange={e => setAnnContent(e.target.value)} rows={3} required
                className="w-full bg-dark-800 border border-dark-600 rounded-lg px-3 py-2 text-sm text-dark-100 focus:outline-none focus:border-primary-500 resize-none" />
              <button type="submit" className="bg-primary-600 hover:bg-primary-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition">Post Announcement</button>
            </form>
          )}

          {announcements.length === 0 ? (
            <p className="text-dark-400 text-center py-8">No announcements yet.</p>
          ) : (
            <div className="space-y-3">
              {announcements.map(ann => (
                <div key={ann.id} className="bg-dark-900 border border-dark-700 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm font-medium text-dark-200">{ann.display_name}</span>
                    <span className="text-xs text-dark-500">{new Date(ann.created_at).toLocaleString()}</span>
                  </div>
                  <h3 className="font-semibold text-dark-100 mb-1">{ann.title}</h3>
                  <p className="text-dark-300 text-sm whitespace-pre-wrap">{ann.content}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Leaderboard Tab */}
      {tab === 'leaderboard' && (
        <div>
          <h2 className="text-xl font-bold text-dark-100 mb-4">🏆 Citizen Leaderboard</h2>
          {leaderboard.length === 0 ? (
            <p className="text-dark-400 text-center py-8">No members yet.</p>
          ) : (
            <div className="bg-dark-900 border border-dark-700 rounded-xl overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-dark-700 text-dark-400 text-sm">
                    <th className="text-left px-4 py-3 w-16">#</th>
                    <th className="text-left px-4 py-3">Citizen</th>
                    <th className="text-left px-4 py-3 w-24">Role</th>
                    <th className="text-right px-4 py-3 w-32">Credits</th>
                  </tr>
                </thead>
                <tbody>
                  {leaderboard.map((m, i) => (
                    <tr key={m.id} className="border-b border-dark-800 hover:bg-dark-800/50 transition">
                      <td className="px-4 py-3 text-dark-400 font-medium">
                        {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-dark-100 font-medium">{m.display_name}</span>
                        <span className="text-dark-500 text-sm ml-2">@{m.username}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${m.role === 'dev' ? 'bg-purple-900/50 text-purple-300' : 'bg-blue-900/50 text-blue-300'}`}>
                          {m.role.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-primary-400 font-semibold">{m.credits}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
