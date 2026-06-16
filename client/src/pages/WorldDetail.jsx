import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import EmptyState from '../components/EmptyState';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import { WorldDetailSkeleton } from '../components/SkeletonLoader';
import { useToastContext } from '../components/Toast';

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
  const toast = useToastContext();

  const [showAnnForm, setShowAnnForm] = useState(false);
  const [annTitle, setAnnTitle] = useState('');
  const [annContent, setAnnContent] = useState('');

  const [showEventForm, setShowEventForm] = useState(false);
  const [eventForm, setEventForm] = useState({
    title: '',
    description: '',
    event_type: 'big',
    start_date: '',
    end_date: '',
  });

  const [showProposalForm, setShowProposalForm] = useState(false);
  const [proposalForm, setProposalForm] = useState({
    title: '',
    description: '',
  });

  const fetchData = async () => {
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
  };

  useEffect(() => {
    fetchData();
  }, [id]);

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
      toast.success('Small event proposed! Waiting for Dev approval.');
    } catch {
      toast.error('Failed to submit proposal. Please try again.');
    }
  };

  if (loading) return <WorldDetailSkeleton />;
  if (!world)
    return (
      <div className="text-center text-slate-500 py-12">World not found</div>
    );

  const openEvents = events.filter((e) => e.status === 'open');
  const closedEvents = events.filter((e) => e.status === 'closed');

  // ── Sidebar action buttons (full-width) ──────────────
  const renderActionButtons = () => {
    if (!user) {
      return (
        <Link
          to="/login"
          className="block w-full text-center bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors shadow-sm"
        >
          Login to Join
        </Link>
      );
    }
    if (isPending) {
      return (
        <div className="w-full text-center bg-amber-100 text-amber-700 border border-amber-200 px-4 py-2.5 rounded-lg text-sm font-medium">
          ⏳ Pending Approval
        </div>
      );
    }
    if (!isMember) {
      return (
        <button
          onClick={handleJoin}
          disabled={joining}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50 shadow-sm"
        >
          {joining ? 'Joining...' : 'Join World'}
        </button>
      );
    }
    return null;
  };

  const getRankDisplay = (index) => {
    if (index === 0) return '🥇';
    if (index === 1) return '🥈';
    if (index === 2) return '🥉';
    return index + 1;
  };

  const actionBtn = renderActionButtons();

  return (
    <div className="lg:grid lg:grid-cols-3 lg:gap-8">
      {/* ── Sidebar ──────────────────────────────────── */}
      <aside className="lg:col-span-1 mb-6 lg:mb-0">
        <div className="sticky top-24 space-y-4">
          {/* World info card */}
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
            {/* Colored header strip */}
            <div className="h-2 bg-gradient-to-r from-indigo-500 to-violet-500" />
            <div className="p-6">
              <h1 className="text-xl font-bold text-slate-900 mb-2 leading-tight">
                {world.title}
              </h1>
              <p className="text-slate-500 text-sm leading-relaxed mb-5">
                {world.description}
              </p>

      {/* Lore Tab - Timeline */}
      {tab === 'lore' && (
        <div>
          <h2 className="text-xl font-bold text-dark-100 mb-4">
            World Lore Timeline
          </h2>
          {events.length === 0 ? (
            <EmptyState
              title="No events in this world's lore yet."
              description={
                isDev
                  ? 'Create the first event to start this world timeline.'
                  : 'Once events are opened, they will appear here as the world timeline.'
              }
            />
          ) : (
            <div className="relative">
              <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-dark-700"></div>
              {events.map((event) => (
                <div key={event.id} className="relative pl-14 pb-8">
                  <div
                    className={`absolute left-4 w-5 h-5 rounded-full border-2 ${
                      event.event_type === 'big'
                        ? 'bg-primary-500 border-primary-400'
                        : 'bg-dark-600 border-dark-500'
                    } ${event.status === 'open' ? 'ring-2 ring-green-400 ring-offset-2 ring-offset-dark-950' : ''}`}
                  ></div>
                  <Link
                    to={`/events/${event.id}`}
                    className={`block bg-dark-900 border rounded-xl p-4 transition hover:border-primary-600 ${
                      event.event_type === 'big'
                        ? 'border-primary-800'
                        : 'border-dark-700'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                          event.event_type === 'big'
                            ? 'bg-primary-900/50 text-primary-300'
                            : 'bg-dark-700 text-dark-300'
                        }`}
                      >
                        {event.event_type === 'big'
                          ? 'BIG EVENT'
                          : 'SMALL EVENT'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-500">Your Role</span>
                      <span
                        className={`text-xs px-2.5 py-0.5 rounded-full font-medium border ${isDev ? 'bg-violet-100 text-violet-700 border-violet-200' : 'bg-blue-100 text-blue-700 border-blue-200'}`}
                      >
                        {world.membership.role.toUpperCase()}
                      </span>
                    </div>
                  </>
                )}
              </div>

              {/* Actions */}
              <div className="space-y-2">
                {actionBtn}
                {isDev && (
                  <Link
                    to={`/worlds/${id}/manage`}
                    className="block w-full text-center bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors"
                  >
                    ⚙️ Manage World
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* ── Main content ──────────────────────────────── */}
      <div className="lg:col-span-2">
        {/* Tabs */}
        <div className="grid grid-cols-2 sm:flex gap-1 mb-6 bg-slate-100 rounded-xl p-1 border border-slate-200">
          {['lore', 'events', 'announcements', 'leaderboard'].map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`py-2 px-3 rounded-lg text-sm font-medium transition capitalize ${
                tab === t
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

            {openEvents.length === 0 ? (
              <EmptyState
                title="No ongoing events"
                description={
                  isDev
                    ? 'Open a new event when this world is ready for activity.'
                    : 'Check back later for open events you can join.'
                }
                compact
              />
            ) : (
              <div className="relative">
                <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-slate-200" />
                {events.map((event) => (
                  <div key={event.id} className="relative pl-14 pb-6">
                    <div
                      className={`absolute left-[14px] w-5 h-5 rounded-full border-2 ${
                        event.event_type === 'big'
                          ? 'bg-indigo-500 border-indigo-400'
                          : 'bg-slate-300 border-slate-200'
                      } ${event.status === 'open' ? 'ring-2 ring-emerald-400 ring-offset-2 ring-offset-slate-50' : ''}`}
                    />
                    <Link
                      to={`/events/${event.id}`}
                      className={`block bg-white border rounded-xl p-4 hover:shadow-md transition-all ${
                        event.event_type === 'big'
                          ? 'border-l-4 border-l-indigo-400 border-y border-r border-slate-200'
                          : 'border border-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <span
                          className={`text-xs font-medium px-2 py-0.5 rounded-full border ${
                            event.event_type === 'big'
                              ? 'bg-indigo-100 text-indigo-700 border-indigo-200'
                              : 'bg-slate-100 text-slate-600 border-slate-200'
                          }`}
                        >
                          {event.event_type === 'big'
                            ? 'BIG EVENT'
                            : 'SMALL EVENT'}
                        </span>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full border ${
                            event.status === 'open'
                              ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
                              : 'bg-slate-100 text-slate-500 border-slate-200'
                          }`}
                        >
                          {event.status.toUpperCase()}
                        </span>
                      </div>
                      <h3
                        className={`font-semibold mb-1 ${event.event_type === 'big' ? 'text-base text-slate-900' : 'text-sm text-slate-800'}`}
                      >
                        {event.title}
                      </h3>
                      <p className="text-slate-500 text-sm line-clamp-2">
                        {event.description}
                      </p>
                      <div className="flex items-center gap-3 mt-2 text-xs text-slate-400">
                        {event.start_date && (
                          <span>
                            📅{' '}
                            {new Date(event.start_date).toLocaleDateString()}
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
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Events Tab ── */}
        {tab === 'events' && (
          <div className="space-y-8">
            {/* Ongoing */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
                  Ongoing Events
                </h2>
                {isDev && (
                  <button
                    onClick={() => setShowEventForm(!showEventForm)}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-colors shadow-sm"
                  >
                    + New Event
                  </button>
                )}
              </div>

              {showEventForm && (
                <form
                  onSubmit={handleCreateEvent}
                  className="bg-white border border-slate-200 rounded-xl p-5 mb-4 space-y-3 shadow-sm"
                >
                  <input
                    type="text"
                    placeholder="Event title"
                    value={eventForm.title}
                    onChange={(e) =>
                      setEventForm({ ...eventForm, title: e.target.value })
                    }
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                  />
                  <textarea
                    placeholder="Event description"
                    value={eventForm.description}
                    onChange={(e) =>
                      setEventForm({
                        ...eventForm,
                        description: e.target.value,
                      })
                    }
                    rows={3}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 resize-none"
                  />
                  <div className="flex flex-col sm:flex-row gap-3">
                    <select
                      value={eventForm.event_type}
                      onChange={(e) =>
                        setEventForm({
                          ...eventForm,
                          event_type: e.target.value,
                        })
                      }
                      className="bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900"
                    >
                      <option value="big">Big Event</option>
                      <option value="small">Small Event</option>
                    </select>
                    <input
                      type="datetime-local"
                      value={eventForm.start_date}
                      onChange={(e) =>
                        setEventForm({
                          ...eventForm,
                          start_date: e.target.value,
                        })
                      }
                      className="flex-1 bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900"
                    />
                    <input
                      type="datetime-local"
                      value={eventForm.end_date}
                      onChange={(e) =>
                        setEventForm({
                          ...eventForm,
                          end_date: e.target.value,
                        })
                      }
                      className="flex-1 bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900"
                    />
                  </div>
                  <button
                    type="submit"
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm"
                  >
                    Create Event
                  </button>
                </form>
              )}

              {openEvents.length === 0 ? (
                <p className="text-slate-400 text-sm py-4">
                  No ongoing events right now.
                </p>
              ) : (
                <div className="space-y-3">
                  {openEvents.map((event) => (
                    <Link
                      key={event.id}
                      to={`/events/${event.id}`}
                      className="block bg-white border-l-4 border-l-emerald-400 border-y border-r border-slate-200 rounded-xl p-4 hover:shadow-md transition-all"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className={`text-xs font-medium px-2 py-0.5 rounded-full border ${event.event_type === 'big' ? 'bg-indigo-100 text-indigo-700 border-indigo-200' : 'bg-slate-100 text-slate-600 border-slate-200'}`}
                        >
                          {event.event_type.toUpperCase()}
                        </span>
                        <span className="text-xs bg-emerald-100 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full">
                          OPEN
                        </span>
                      </div>
                      <h3 className="font-semibold text-slate-900">
                        {event.title}
                      </h3>
                      <p className="text-slate-500 text-sm mt-1 line-clamp-2">
                        {event.description}
                      </p>
                      <div className="text-xs text-slate-400 mt-2 flex gap-3">
                        {event.start_date && (
                          <span>
                            📅{' '}
                            {new Date(event.start_date).toLocaleDateString()}
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
                  ))}
                </div>
              )}
            </div>

          {/* Past Events */}
          <div>
            <h2 className="text-xl font-bold text-dark-100 mb-3">📜 Past Events</h2>
            {closedEvents.length === 0 ? (
              <EmptyState
                title="No past events"
                description="Closed events will be archived here."
                compact
              />
            ) : (
              <div className="space-y-3">
                {announcements.map((ann) => (
                  <div
                    key={ann.id}
                    className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-semibold text-slate-900">
                        {ann.display_name}
                      </span>
                      <span className="text-xs text-slate-400">
                        {new Date(ann.created_at).toLocaleString()}
                      </span>
                    </div>
                    <h3 className="font-bold text-slate-900 mb-1.5">
                      {ann.title}
                    </h3>
                    <p className="text-slate-600 text-sm whitespace-pre-wrap leading-relaxed">
                      {ann.content}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
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
        )}

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
            <EmptyState
              title="No announcements yet."
              description={
                isDev
                  ? 'Post an announcement to keep members updated.'
                  : 'Updates from the world devs will appear here.'
              }
            />
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
            <EmptyState
              title="No members yet."
              description="Approved members and their credits will appear here."
            />
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
                        {getRankDisplay(i)}
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-dark-100 font-medium">
                          {m.display_name}
                        </span>
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
                  </thead>
                  <tbody>
                    {leaderboard.map((m, i) => (
                      <tr
                        key={m.id}
                        className="border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors"
                      >
                        <td className="px-4 py-3.5 text-slate-500 font-medium text-sm">
                          {getRankDisplay(i)}
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="text-slate-900 font-medium text-sm">
                            {m.display_name}
                          </span>
                          <span className="text-slate-400 text-xs ml-2">
                            @{m.username}
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full border font-medium ${m.role === 'dev' ? 'bg-violet-100 text-violet-700 border-violet-200' : 'bg-blue-100 text-blue-700 border-blue-200'}`}
                          >
                            {m.role.toUpperCase()}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-right text-indigo-600 font-bold text-sm">
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
    </div>
  );
}
