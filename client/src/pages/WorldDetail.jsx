import { useCallback, useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api.js';

const timelineStatusClasses = {
  open: 'bg-green-900/50 text-green-300 border-green-800',
  closed: 'bg-dark-800 text-dark-300 border-dark-700',
  approved: 'bg-blue-900/50 text-blue-300 border-blue-800',
  proposed: 'bg-yellow-900/40 text-yellow-300 border-yellow-800',
};

const formatTimelineDate = (value) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString();
};

const getTimelineDateLabel = (event) => {
  const startDate = formatTimelineDate(event.start_date);
  const endDate = formatTimelineDate(event.end_date);

  if (startDate && endDate) return `${startDate} -> ${endDate}`;
  if (startDate) return startDate;
  if (endDate) return `Until ${endDate}`;
  return 'Undated';
};

const getTimelineNodeClasses = (event) => {
  if (event.status === 'open') {
    return 'bg-green-500 border-green-300 shadow-lg shadow-green-900/40 ring-4 ring-green-500/15';
  }

  if (event.event_type === 'big') {
    return 'bg-primary-500 border-primary-300 shadow-lg shadow-primary-900/40';
  }

  return 'bg-dark-600 border-dark-400';
};

const getTimelineCardBorder = (event) => {
  if (event.status === 'open') return 'border-green-800 hover:border-green-600';
  if (event.event_type === 'big')
    return 'border-primary-800 hover:border-primary-600';
  return 'border-dark-700 hover:border-dark-500';
};

const getTimelineTypeClasses = (event) => {
  if (event.event_type === 'big') {
    return 'bg-primary-900/50 text-primary-300 border-primary-800';
  }

  return 'bg-dark-800 text-dark-300 border-dark-700';
};

const getTimelineTitleClasses = (event) => {
  if (event.event_type === 'big') return 'text-lg text-dark-100';
  return 'text-base text-dark-200';
};

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
  const [eventForm, setEventForm] = useState({
    title: '',
    description: '',
    event_type: 'big',
    start_date: '',
    end_date: '',
  });

  // Small event proposal
  const [showProposalForm, setShowProposalForm] = useState(false);
  const [proposalForm, setProposalForm] = useState({
    title: '',
    description: '',
  });

  const fetchData = useCallback(async () => {
    try {
      const [worldRes, eventsRes, annRes, lbRes] = await Promise.all([
        api.get(`/worlds/${id}`),
        api.get(`/events/world/${id}`),
        api.get(`/posts/world/${id}/announcements`),
        api.get(`/worlds/${id}/leaderboard`),
      ]);
      setWorld(worldRes.data);
      setEvents(eventsRes.data);
      setAnnouncements(annRes.data);
      setLeaderboard(lbRes.data);
    } catch {}
    setLoading(false);
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const isDev =
    world?.membership?.role === 'dev' &&
    world?.membership?.status === 'approved';
  const isMember = world?.membership?.status === 'approved';
  const isPending = world?.membership?.status === 'pending';

  const handleJoin = async () => {
    setJoining(true);
    try {
      await api.post(`/worlds/${id}/join`);
      fetchData();
    } catch {}
    setJoining(false);
  };

  const handleAnnouncement = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/posts/world/${id}/announcements`, {
        title: annTitle,
        content: annContent,
      });
      setShowAnnForm(false);
      setAnnTitle('');
      setAnnContent('');
      fetchData();
    } catch {}
  };

  const handleCreateEvent = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/events/world/${id}`, eventForm);
      setShowEventForm(false);
      setEventForm({
        title: '',
        description: '',
        event_type: 'big',
        start_date: '',
        end_date: '',
      });
      fetchData();
    } catch {}
  };

  const handleProposal = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/events/world/${id}`, {
        ...proposalForm,
        event_type: 'small',
      });
      setShowProposalForm(false);
      setProposalForm({ title: '', description: '' });
      alert('Small event proposed! Waiting for Dev approval.');
    } catch {}
  };

  if (loading)
    return (
      <div className="text-center text-dark-400 py-12">Loading world...</div>
    );
  if (!world)
    return (
      <div className="text-center text-dark-400 py-12">World not found</div>
    );

  const openEvents = events.filter((e) => e.status === 'open');
  const closedEvents = events.filter((e) => e.status === 'closed');
  return (
    <div>
      {/* Header */}
      <div className="bg-dark-900 border border-dark-700 rounded-2xl p-6 mb-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-dark-100 mb-2">
              {world.title}
            </h1>
            <p className="text-dark-400 mb-4">{world.description}</p>
            <div className="flex items-center gap-4 text-sm text-dark-500">
              <span>👥 {world.member_count} members</span>
              {isMember && <span>⭐ {world.membership.credits} credits</span>}
              {isMember && (
                <span
                  className={`px-2 py-0.5 rounded-full text-xs font-medium ${isDev ? 'bg-purple-900/50 text-purple-300' : 'bg-blue-900/50 text-blue-300'}`}
                >
                  {world.membership.role.toUpperCase()}
                </span>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            {!user ? (
              <Link
                to="/login"
                className="bg-primary-600 hover:bg-primary-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
              >
                Login to Join
              </Link>
            ) : isPending ? (
              <span className="bg-yellow-900/30 text-yellow-300 px-4 py-2 rounded-lg text-sm">
                Pending Approval
              </span>
            ) : !isMember ? (
              <button
                onClick={handleJoin}
                disabled={joining}
                className="bg-primary-600 hover:bg-primary-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition disabled:opacity-50"
              >
                {joining ? 'Joining...' : 'Join World'}
              </button>
            ) : null}
            {isDev && (
              <Link
                to={`/worlds/${id}/manage`}
                className="bg-dark-700 hover:bg-dark-600 text-dark-200 px-4 py-2 rounded-lg text-sm font-medium transition"
              >
                Manage
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-dark-900 rounded-xl p-1 border border-dark-700">
        {['lore', 'events', 'announcements', 'leaderboard'].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition capitalize ${tab === t ? 'bg-primary-600 text-white' : 'text-dark-400 hover:text-dark-200'}`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Lore Tab - Timeline */}
      {tab === 'lore' && (
        <div className="space-y-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-xl font-bold text-dark-100">
                World Lore Timeline
              </h2>
              <p className="text-sm text-dark-500">
                Follow the approved lore events that shape this world.
              </p>
            </div>
            <div className="flex flex-wrap gap-2 text-xs">
              <span className="inline-flex items-center gap-1.5 text-dark-400">
                <span className="h-2.5 w-2.5 rounded-full bg-primary-500"></span>
                Big event
              </span>
              <span className="inline-flex items-center gap-1.5 text-dark-400">
                <span className="h-2.5 w-2.5 rounded-full bg-dark-600 border border-dark-400"></span>
                Small event
              </span>
              <span className="inline-flex items-center gap-1.5 text-dark-400">
                <span className="h-2.5 w-2.5 rounded-full bg-green-500"></span>
                Open
              </span>
            </div>
          </div>
          {events.length === 0 ? (
            <div className="text-dark-400 text-center bg-dark-900 border border-dark-700 rounded-xl py-10">
              No events in this world&apos;s lore yet.
            </div>
          ) : (
            <div className="relative pl-10 sm:pl-0">
              <div className="absolute left-4 top-3 bottom-3 w-0.5 bg-dark-700 sm:left-1/2 sm:-translate-x-1/2"></div>
              {events.map((event, index) => {
                const alignRight = index % 2 === 0;
                const itemAlignment = alignRight
                  ? 'sm:ml-auto sm:pl-10'
                  : 'sm:mr-auto sm:pr-10';

                return (
                  <div
                    key={event.id}
                    className={`relative pb-8 last:pb-0 sm:w-1/2 ${itemAlignment}`}
                  >
                    <div
                      className={`absolute -left-[1.9rem] top-5 h-5 w-5 rounded-full border-2 sm:left-auto ${
                        alignRight ? 'sm:-left-2.5' : 'sm:-right-2.5'
                      } ${getTimelineNodeClasses(event)}`}
                      aria-hidden="true"
                    />
                    <Link
                      to={`/events/${event.id}`}
                      className={`block bg-dark-900 border rounded-xl p-4 transition ${getTimelineCardBorder(event)}`}
                    >
                      <div className="flex flex-wrap items-center gap-2 mb-3">
                        <span
                          className={`text-xs font-medium px-2 py-0.5 rounded-full border ${getTimelineTypeClasses(event)}`}
                        >
                          {event.event_type === 'big'
                            ? 'BIG EVENT'
                            : 'SMALL EVENT'}
                        </span>
                        <span
                          className={`text-xs font-medium px-2 py-0.5 rounded-full border ${
                            timelineStatusClasses[event.status] ||
                            timelineStatusClasses.closed
                          }`}
                        >
                          {event.status.toUpperCase()}
                        </span>
                        <span className="text-xs text-dark-500">
                          {getTimelineDateLabel(event)}
                        </span>
                      </div>
                      <h3
                        className={`font-semibold mb-1 ${getTimelineTitleClasses(event)}`}
                      >
                        {event.title}
                      </h3>
                      <p className="text-dark-400 text-sm line-clamp-2">
                        {event.description || 'No description'}
                      </p>
                      <div className="flex flex-wrap items-center gap-3 mt-3 text-xs text-dark-500">
                        {event.start_date && (
                          <span>
                            📅 {new Date(event.start_date).toLocaleDateString()}
                          </span>
                        )}
                        {event.end_date && (
                          <span>
                            → {new Date(event.end_date).toLocaleDateString()}
                          </span>
                        )}
                        <span>📝 {event.post_count} posts</span>
                      </div>
                    </Link>
                  </div>
                );
              })}
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
              <h2 className="text-xl font-bold text-dark-100">
                🔴 Ongoing Events
              </h2>
              {isDev && (
                <button
                  onClick={() => setShowEventForm(!showEventForm)}
                  className="bg-primary-600 hover:bg-primary-500 text-white px-4 py-1.5 rounded-lg text-sm font-medium transition"
                >
                  + New Event
                </button>
              )}
            </div>

            {showEventForm && (
              <form
                onSubmit={handleCreateEvent}
                className="bg-dark-900 border border-dark-700 rounded-xl p-4 mb-4 space-y-3"
              >
                <input
                  type="text"
                  placeholder="Event title"
                  value={eventForm.title}
                  onChange={(e) =>
                    setEventForm({ ...eventForm, title: e.target.value })
                  }
                  required
                  className="w-full bg-dark-800 border border-dark-600 rounded-lg px-3 py-2 text-sm text-dark-100 focus:outline-none focus:border-primary-500"
                />
                <textarea
                  placeholder="Event description"
                  value={eventForm.description}
                  onChange={(e) =>
                    setEventForm({ ...eventForm, description: e.target.value })
                  }
                  rows={3}
                  className="w-full bg-dark-800 border border-dark-600 rounded-lg px-3 py-2 text-sm text-dark-100 focus:outline-none focus:border-primary-500 resize-none"
                />
                <div className="flex gap-3">
                  <select
                    value={eventForm.event_type}
                    onChange={(e) =>
                      setEventForm({ ...eventForm, event_type: e.target.value })
                    }
                    className="bg-dark-800 border border-dark-600 rounded-lg px-3 py-2 text-sm text-dark-100"
                  >
                    <option value="big">Big Event</option>
                    <option value="small">Small Event</option>
                  </select>
                  <input
                    type="datetime-local"
                    value={eventForm.start_date}
                    onChange={(e) =>
                      setEventForm({ ...eventForm, start_date: e.target.value })
                    }
                    className="bg-dark-800 border border-dark-600 rounded-lg px-3 py-2 text-sm text-dark-100"
                  />
                  <input
                    type="datetime-local"
                    value={eventForm.end_date}
                    onChange={(e) =>
                      setEventForm({ ...eventForm, end_date: e.target.value })
                    }
                    className="bg-dark-800 border border-dark-600 rounded-lg px-3 py-2 text-sm text-dark-100"
                  />
                </div>
                <button
                  type="submit"
                  className="bg-primary-600 hover:bg-primary-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
                >
                  Create Event
                </button>
              </form>
            )}

            {openEvents.length === 0 ? (
              <p className="text-dark-400 text-sm">No ongoing events</p>
            ) : (
              <div className="space-y-3">
                {openEvents.map((event) => (
                  <Link
                    key={event.id}
                    to={`/events/${event.id}`}
                    className="block bg-dark-900 border border-green-800 rounded-xl p-4 hover:border-green-600 transition"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className={`text-xs font-medium px-2 py-0.5 rounded-full ${event.event_type === 'big' ? 'bg-primary-900/50 text-primary-300' : 'bg-dark-700 text-dark-300'}`}
                      >
                        {event.event_type.toUpperCase()}
                      </span>
                      <span className="text-xs bg-green-900/50 text-green-300 px-2 py-0.5 rounded-full">
                        OPEN
                      </span>
                    </div>
                    <h3 className="text-lg font-semibold text-dark-100">
                      {event.title}
                    </h3>
                    <p className="text-dark-400 text-sm">{event.description}</p>
                    <div className="text-xs text-dark-500 mt-2">
                      {event.start_date && (
                        <span>
                          📅 {new Date(event.start_date).toLocaleDateString()}
                        </span>
                      )}
                      {event.end_date && (
                        <span className="ml-1">
                          → {new Date(event.end_date).toLocaleDateString()}
                        </span>
                      )}
                      <span>{' '}📝 {event.post_count} posts</span>
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
                <h2 className="text-xl font-bold text-dark-100">
                  💡 Propose Small Event
                </h2>
                <button
                  onClick={() => setShowProposalForm(!showProposalForm)}
                  className="bg-dark-700 hover:bg-dark-600 text-dark-200 px-4 py-1.5 rounded-lg text-sm font-medium transition"
                >
                  + Propose
                </button>
              </div>
              {showProposalForm && (
                <form
                  onSubmit={handleProposal}
                  className="bg-dark-900 border border-dark-700 rounded-xl p-4 space-y-3"
                >
                  <input
                    type="text"
                    placeholder="Event title"
                    value={proposalForm.title}
                    onChange={(e) =>
                      setProposalForm({
                        ...proposalForm,
                        title: e.target.value,
                      })
                    }
                    required
                    className="w-full bg-dark-800 border border-dark-600 rounded-lg px-3 py-2 text-sm text-dark-100 focus:outline-none focus:border-primary-500"
                  />
                  <textarea
                    placeholder="Describe the event..."
                    value={proposalForm.description}
                    onChange={(e) =>
                      setProposalForm({
                        ...proposalForm,
                        description: e.target.value,
                      })
                    }
                    rows={3}
                    className="w-full bg-dark-800 border border-dark-600 rounded-lg px-3 py-2 text-sm text-dark-100 focus:outline-none focus:border-primary-500 resize-none"
                  />
                  <button
                    type="submit"
                    className="bg-primary-600 hover:bg-primary-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
                  >
                    Submit Proposal
                  </button>
                </form>
              )}
            </div>
          )}

          {/* Past Events */}
          {closedEvents.length > 0 && (
            <div>
              <h2 className="text-xl font-bold text-dark-100 mb-3">
                📜 Past Events
              </h2>
              <div className="space-y-3">
                {closedEvents.map((event) => (
                  <Link
                    key={event.id}
                    to={`/events/${event.id}`}
                    className="block bg-dark-900 border border-dark-700 rounded-xl p-4 hover:border-dark-500 transition opacity-75"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className={`text-xs font-medium px-2 py-0.5 rounded-full ${event.event_type === 'big' ? 'bg-primary-900/50 text-primary-300' : 'bg-dark-700 text-dark-300'}`}
                      >
                        {event.event_type.toUpperCase()}
                      </span>
                      <span className="text-xs bg-dark-700 text-dark-400 px-2 py-0.5 rounded-full">
                        CLOSED
                      </span>
                    </div>
                    <h3 className="font-semibold text-dark-200">
                      {event.title}
                    </h3>
                    <span className="text-xs text-dark-500">
                      📝 {event.post_count} posts
                    </span>
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
            <h2 className="text-xl font-bold text-dark-100">
              📢 Announcements
            </h2>
            {isDev && (
              <button
                onClick={() => setShowAnnForm(!showAnnForm)}
                className="bg-primary-600 hover:bg-primary-500 text-white px-4 py-1.5 rounded-lg text-sm font-medium transition"
              >
                + New Announcement
              </button>
            )}
          </div>

          {showAnnForm && (
            <form
              onSubmit={handleAnnouncement}
              className="bg-dark-900 border border-dark-700 rounded-xl p-4 mb-4 space-y-3"
            >
              <input
                type="text"
                placeholder="Announcement title"
                value={annTitle}
                onChange={(e) => setAnnTitle(e.target.value)}
                required
                className="w-full bg-dark-800 border border-dark-600 rounded-lg px-3 py-2 text-sm text-dark-100 focus:outline-none focus:border-primary-500"
              />
              <textarea
                placeholder="Announcement content"
                value={annContent}
                onChange={(e) => setAnnContent(e.target.value)}
                rows={3}
                required
                className="w-full bg-dark-800 border border-dark-600 rounded-lg px-3 py-2 text-sm text-dark-100 focus:outline-none focus:border-primary-500 resize-none"
              />
              <button
                type="submit"
                className="bg-primary-600 hover:bg-primary-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
              >
                Post Announcement
              </button>
            </form>
          )}

          {announcements.length === 0 ? (
            <p className="text-dark-400 text-center py-8">
              No announcements yet.
            </p>
          ) : (
            <div className="space-y-3">
              {announcements.map((ann) => (
                <div
                  key={ann.id}
                  className="bg-dark-900 border border-dark-700 rounded-xl p-4"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm font-medium text-dark-200">
                      {ann.display_name}
                    </span>
                    <span className="text-xs text-dark-500">
                      {new Date(ann.created_at).toLocaleString()}
                    </span>
                  </div>
                  <h3 className="font-semibold text-dark-100 mb-1">
                    {ann.title}
                  </h3>
                  <p className="text-dark-300 text-sm whitespace-pre-wrap">
                    {ann.content}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Leaderboard Tab */}
      {tab === 'leaderboard' && (
        <div>
          <h2 className="text-xl font-bold text-dark-100 mb-4">
            🏆 Citizen Leaderboard
          </h2>
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
                    <tr
                      key={m.id}
                      className="border-b border-dark-800 hover:bg-dark-800/50 transition"
                    >
                      <td className="px-4 py-3 text-dark-400 font-medium">
                        {i === 0
                          ? '🥇'
                          : i === 1
                            ? '🥈'
                            : i === 2
                              ? '🥉'
                              : i + 1}
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-dark-100 font-medium">
                          {m.display_name}
                        </span>
                        {' '}
                        <span className="text-dark-500 text-sm ml-2">
                          @{m.username}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full ${m.role === 'dev' ? 'bg-purple-900/50 text-purple-300' : 'bg-blue-900/50 text-blue-300'}`}
                        >
                          {m.role.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-primary-400 font-semibold">
                        {m.credits}
                      </td>
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
