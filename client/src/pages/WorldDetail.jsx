import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
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
    title: '', description: '', event_type: 'big', start_date: '', end_date: '',
  });

  const [showProposalForm, setShowProposalForm] = useState(false);
  const [proposalForm, setProposalForm] = useState({ title: '', description: '' });

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

  useEffect(() => { fetchData(); }, [id]);

  const isDev = world?.membership?.role === 'dev' && world?.membership?.status === 'approved';
  const isMember = world?.membership?.status === 'approved';
  const isPending = world?.membership?.status === 'pending';

  const handleJoin = async () => {
    setJoining(true);
    try { await api.post(`/worlds/${id}/join`); fetchData(); } catch {}
    setJoining(false);
  };

  const handleAnnouncement = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/posts/world/${id}/announcements`, { title: annTitle, content: annContent });
      setShowAnnForm(false); setAnnTitle(''); setAnnContent(''); fetchData();
    } catch {}
  };

  const handleCreateEvent = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/events/world/${id}`, eventForm);
      setShowEventForm(false);
      setEventForm({ title: '', description: '', event_type: 'big', start_date: '', end_date: '' });
      fetchData();
    } catch {}
  };

  const handleProposal = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/events/world/${id}`, { ...proposalForm, event_type: 'small' });
      setShowProposalForm(false);
      setProposalForm({ title: '', description: '' });
      toast.success('Small event proposed! Waiting for Dev approval.');
    } catch {
      toast.error('Failed to submit proposal. Please try again.');
    }
  };

  if (loading) return <WorldDetailSkeleton />;
  if (!world) return <div className="text-center text-slate-500 py-12">World not found</div>;

  const openEvents = events.filter((e) => e.status === 'open');
  const closedEvents = events.filter((e) => e.status === 'closed');
  const slugify = (s) => s.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');

  const inputClass = 'w-full bg-slate-50 border border-slate-200 rounded-md px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100';

  const renderJoinButton = () => {
    if (!user) return (
      <Link to="/login" className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-1.5 rounded-full text-sm font-bold transition-colors shadow-sm">
        Join
      </Link>
    );
    if (isPending) return (
      <div className="bg-amber-100 text-amber-700 border border-amber-200 px-4 py-1.5 rounded-full text-sm font-bold">⏳ Pending</div>
    );
    if (!isMember) return (
      <button onClick={handleJoin} disabled={joining} className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-1.5 rounded-full text-sm font-bold transition-colors disabled:opacity-50 shadow-sm">
        {joining ? 'Joining...' : 'Join'}
      </button>
    );
    return <div className="border-2 border-indigo-600 text-indigo-600 px-4 py-1 rounded-full text-sm font-bold">✓ Joined</div>;
  };

  const getRankDisplay = (index) => {
    if (index === 0) return '🥇';
    if (index === 1) return '🥈';
    if (index === 2) return '🥉';
    return index + 1;
  };

  return (
    <div>
      {/* ── Community banner ── */}
      <div className="h-20 sm:h-28 rounded-xl bg-gradient-to-r from-indigo-500 via-violet-500 to-indigo-600 mb-0 relative overflow-hidden shadow-sm">
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(ellipse_at_top_right,_white,_transparent)]" />
      </div>

      {/* ── Community header bar ── */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm mb-4 px-4 sm:px-6 pt-0 pb-3">
        <div className="flex items-end gap-3 sm:gap-4">
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-indigo-400 to-violet-500 flex items-center justify-center text-white text-2xl font-black border-4 border-white -mt-6 flex-shrink-0 shadow-md">
            {world.title[0]?.toUpperCase()}
          </div>
          <div className="flex-1 min-w-0 pt-2">
            <h1 className="font-extrabold text-slate-900 text-lg sm:text-xl leading-tight">{world.title}</h1>
            <p className="text-xs text-slate-500">w/{slugify(world.title)} · {world.member_count} members</p>
          </div>
          <div className="flex items-center gap-2 pb-1 flex-shrink-0">
            {renderJoinButton()}
            {isDev && (
              <Link to={`/worlds/${id}/manage`} className="border border-slate-300 hover:bg-slate-50 text-slate-700 px-3 py-1.5 rounded-full text-sm font-bold transition-colors">
                ⚙️ Mod
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* ── Main grid ── */}
      <div className="lg:grid lg:grid-cols-3 lg:gap-4">
        {/* ── Feed (col-span-2) ── */}
        <div className="lg:col-span-2">
          {/* Reddit border-bottom tabs */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm mb-3">
            <div className="flex border-b border-slate-200 px-2">
              {['lore', 'events', 'announcements', 'leaderboard'].map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`px-4 py-3 text-sm font-bold capitalize transition-colors border-b-2 -mb-px ${
                    tab === t ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Lore */}
          {tab === 'lore' && (
            <div className="space-y-2">
              {events.length === 0 ? (
                <div className="bg-white border border-slate-200 rounded-xl py-14 text-center shadow-sm">
                  <div className="text-4xl mb-3">📜</div>
                  <p className="text-slate-500 text-sm">No events in this world&apos;s lore yet.</p>
                </div>
              ) : (
                events.map((event) => (
                  <Link key={event.id} to={`/events/${event.id}`} className="block bg-white border border-slate-200 rounded-xl shadow-sm hover:border-indigo-200 hover:shadow-md transition-all overflow-hidden">
                    <div className="flex">
                      <div className="w-10 bg-[#f8f9fa] flex flex-col items-center py-3 gap-0.5 border-r border-slate-100 flex-shrink-0">
                        <span className="text-slate-400 text-xs font-bold">▲</span>
                        <span className="text-xs font-bold text-slate-500">{event.post_count}</span>
                      </div>
                      <div className="flex-1 p-3.5">
                        <div className="flex items-center gap-1.5 mb-1.5">
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${event.event_type === 'big' ? 'bg-indigo-100 text-indigo-700 border-indigo-200' : 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                            {event.event_type === 'big' ? 'BIG' : 'SMALL'}
                          </span>
                          <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${event.status === 'open' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>
                            {event.status.toUpperCase()}
                          </span>
                        </div>
                        <p className="font-semibold text-slate-900 text-sm mb-1">{event.title}</p>
                        <p className="text-slate-500 text-xs line-clamp-2 mb-2">{event.description}</p>
                        <div className="flex gap-1 text-xs text-slate-400">
                          <span className="hover:bg-[#f0f2f5] px-2 py-1 rounded font-semibold">💬 {event.post_count} Comments</span>
                          <span className="hover:bg-[#f0f2f5] px-2 py-1 rounded font-semibold">🔗 Share</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))
              )}
            </div>
          )}

          {/* Events */}
          {tab === 'events' && (
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="font-bold text-slate-900 flex items-center gap-1.5 text-sm">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" /> Ongoing Events
                  </h2>
                  {isDev && (
                    <button onClick={() => setShowEventForm(!showEventForm)} className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-full text-xs font-bold transition-colors shadow-sm">
                      + New Event
                    </button>
                  )}
                </div>
                {showEventForm && (
                  <form onSubmit={handleCreateEvent} className="bg-white border border-slate-200 rounded-xl p-4 mb-3 space-y-2.5 shadow-sm">
                    <input type="text" placeholder="Event title" value={eventForm.title} onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })} required className={inputClass} />
                    <textarea placeholder="Event description" value={eventForm.description} onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })} rows={3} className={`${inputClass} resize-none`} />
                    <div className="flex flex-col sm:flex-row gap-2">
                      <select value={eventForm.event_type} onChange={(e) => setEventForm({ ...eventForm, event_type: e.target.value })} className="bg-white border border-slate-300 rounded-md px-3 py-2 text-sm text-slate-900">
                        <option value="big">Big Event</option>
                        <option value="small">Small Event</option>
                      </select>
                      <input type="datetime-local" value={eventForm.start_date} onChange={(e) => setEventForm({ ...eventForm, start_date: e.target.value })} className="flex-1 bg-white border border-slate-300 rounded-md px-3 py-2 text-sm text-slate-900" />
                      <input type="datetime-local" value={eventForm.end_date} onChange={(e) => setEventForm({ ...eventForm, end_date: e.target.value })} className="flex-1 bg-white border border-slate-300 rounded-md px-3 py-2 text-sm text-slate-900" />
                    </div>
                    <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-full text-sm font-bold transition-colors shadow-sm">Create Event</button>
                  </form>
                )}
                {openEvents.length === 0 ? (
                  <p className="text-slate-400 text-sm py-3 bg-white border border-slate-200 rounded-xl px-4">No ongoing events right now.</p>
                ) : (
                  <div className="space-y-2">
                    {openEvents.map((event) => (
                      <Link key={event.id} to={`/events/${event.id}`} className="block bg-white border border-slate-200 rounded-xl shadow-sm hover:border-emerald-200 hover:shadow-md transition-all overflow-hidden">
                        <div className="flex">
                          <div className="w-10 bg-[#f8f9fa] flex flex-col items-center py-3 gap-0.5 border-r border-slate-100 flex-shrink-0">
                            <span className="text-emerald-500 text-xs font-bold">▲</span>
                            <span className="text-xs font-bold text-slate-500">{event.post_count}</span>
                          </div>
                          <div className="flex-1 p-3.5">
                            <div className="flex items-center gap-1.5 mb-1">
                              <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${event.event_type === 'big' ? 'bg-indigo-100 text-indigo-700 border-indigo-200' : 'bg-slate-100 text-slate-600 border-slate-200'}`}>{event.event_type.toUpperCase()}</span>
                              <span className="text-xs bg-emerald-100 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full font-bold">OPEN</span>
                            </div>
                            <p className="font-semibold text-slate-900 text-sm mb-1">{event.title}</p>
                            <p className="text-xs text-slate-500 line-clamp-1 mb-2">{event.description}</p>
                            <div className="flex gap-1 text-xs text-slate-400">
                              <span className="hover:bg-[#f0f2f5] px-2 py-1 rounded font-semibold">💬 {event.post_count} Comments</span>
                              <span className="hover:bg-[#f0f2f5] px-2 py-1 rounded font-semibold">🔗 Share</span>
                            </div>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              {isMember && !isDev && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="font-bold text-slate-900 text-sm">💡 Propose Small Event</h2>
                    <button onClick={() => setShowProposalForm(!showProposalForm)} className="border border-slate-300 hover:bg-slate-50 text-slate-700 px-3 py-1.5 rounded-full text-xs font-bold transition-colors">+ Propose</button>
                  </div>
                  {showProposalForm && (
                    <form onSubmit={handleProposal} className="bg-white border border-slate-200 rounded-xl p-4 space-y-2.5 shadow-sm">
                      <input type="text" placeholder="Event title" value={proposalForm.title} onChange={(e) => setProposalForm({ ...proposalForm, title: e.target.value })} required className={inputClass} />
                      <textarea placeholder="Describe the event..." value={proposalForm.description} onChange={(e) => setProposalForm({ ...proposalForm, description: e.target.value })} rows={3} className={`${inputClass} resize-none`} />
                      <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-full text-sm font-bold transition-colors shadow-sm">Submit Proposal</button>
                    </form>
                  )}
                </div>
              )}

              {closedEvents.length > 0 && (
                <div>
                  <h2 className="font-bold text-slate-700 text-sm mb-3 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-slate-300 inline-block" /> Past Events
                  </h2>
                  <div className="space-y-1.5">
                    {closedEvents.map((event) => (
                      <Link key={event.id} to={`/events/${event.id}`} className="flex items-center gap-3 bg-white border border-slate-200 rounded-xl px-4 py-2.5 hover:border-slate-300 transition-all opacity-75 hover:opacity-100 shadow-sm">
                        <span className={`text-xs font-bold px-1.5 py-0.5 rounded border ${event.event_type === 'big' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>{event.event_type.toUpperCase()}</span>
                        <p className="font-medium text-slate-700 text-sm truncate flex-1">{event.title}</p>
                        <span className="text-xs text-slate-400 shrink-0">📝 {event.post_count}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Announcements */}
          {tab === 'announcements' && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-bold text-slate-900 text-sm">📢 Announcements</h2>
                {isDev && (
                  <button onClick={() => setShowAnnForm(!showAnnForm)} className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-full text-xs font-bold transition-colors shadow-sm">+ Post</button>
                )}
              </div>
              {showAnnForm && (
                <form onSubmit={handleAnnouncement} className="bg-white border border-slate-200 rounded-xl p-4 mb-3 space-y-2.5 shadow-sm">
                  <input type="text" placeholder="Announcement title" value={annTitle} onChange={(e) => setAnnTitle(e.target.value)} required className={inputClass} />
                  <textarea placeholder="Announcement content" value={annContent} onChange={(e) => setAnnContent(e.target.value)} rows={3} required className={`${inputClass} resize-none`} />
                  <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-full text-sm font-bold transition-colors shadow-sm">Post Announcement</button>
                </form>
              )}
              {announcements.length === 0 ? (
                <div className="bg-white border border-slate-200 rounded-xl py-12 text-center shadow-sm">
                  <p className="text-slate-400 text-sm">No announcements yet.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {announcements.map((ann) => (
                    <div key={ann.id} className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                      <div className="flex">
                        <div className="w-10 bg-[#f8f9fa] border-r border-slate-100 flex-shrink-0 flex items-center justify-center py-3">
                          <span className="text-indigo-400 text-xs">📢</span>
                        </div>
                        <div className="flex-1 p-3.5">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-bold text-slate-800">{ann.display_name}</span>
                            <span className="text-xs text-slate-400">• {new Date(ann.created_at).toLocaleString()}</span>
                          </div>
                          <p className="font-bold text-slate-900 text-sm mb-1">{ann.title}</p>
                          <p className="text-slate-600 text-sm whitespace-pre-wrap leading-relaxed">{ann.content}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Leaderboard */}
          {tab === 'leaderboard' && (
            <div>
              <h2 className="font-bold text-slate-900 text-sm mb-3">🏆 Citizen Leaderboard</h2>
              {leaderboard.length === 0 ? (
                <div className="bg-white border border-slate-200 rounded-xl py-12 text-center shadow-sm">
                  <p className="text-slate-400 text-sm">No members yet.</p>
                </div>
              ) : (
                <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-[#f8f9fa] border-b border-slate-200 text-slate-500 text-xs uppercase tracking-wide">
                        <th className="text-left px-4 py-3 w-12">#</th>
                        <th className="text-left px-4 py-3">Citizen</th>
                        <th className="text-left px-4 py-3 w-20">Role</th>
                        <th className="text-right px-4 py-3 w-24">Credits</th>
                      </tr>
                    </thead>
                    <tbody>
                      {leaderboard.map((m, i) => (
                        <tr key={m.id} className="border-b border-slate-100 last:border-0 hover:bg-[#f8f9fa] transition-colors">
                          <td className="px-4 py-3 text-slate-500 font-bold text-sm">{getRankDisplay(i)}</td>
                          <td className="px-4 py-3">
                            <span className="font-semibold text-slate-900 text-sm">{m.display_name}</span>
                            <span className="text-slate-400 text-xs ml-1.5">u/{m.username}</span>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`text-xs px-2 py-0.5 rounded-full border font-bold ${m.role === 'dev' ? 'bg-violet-100 text-violet-700 border-violet-200' : 'bg-blue-100 text-blue-700 border-blue-200'}`}>
                              {m.role.toUpperCase()}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right text-indigo-600 font-extrabold text-sm">{m.credits}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Right sidebar ── */}
        <aside className="hidden lg:block lg:col-span-1">
          <div className="sticky top-20 space-y-3">
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
              <div className="bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-3">
                <h3 className="font-bold text-white text-sm">About Community</h3>
              </div>
              <div className="p-4">
                <p className="text-slate-600 text-sm leading-relaxed mb-4">
                  {world.description || 'No description provided.'}
                </p>
                <div className="flex items-baseline gap-3 mb-1">
                  <span className="text-xl font-extrabold text-slate-900">{world.member_count}</span>
                  <span className="text-xs text-slate-500 uppercase tracking-wide">Members</span>
                </div>
                <div className="flex items-baseline gap-3 mb-4">
                  <span className="text-xl font-extrabold text-slate-900">{events.length}</span>
                  <span className="text-xs text-slate-500 uppercase tracking-wide">Events</span>
                </div>
                <div className="border-t border-slate-100 pt-3 space-y-2">
                  {renderJoinButton()}
                </div>
                {isMember && (
                  <div className="mt-3 space-y-2 text-sm border-t border-slate-100 pt-3">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500 text-xs">Your Role</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-bold border ${isDev ? 'bg-violet-100 text-violet-700 border-violet-200' : 'bg-blue-100 text-blue-700 border-blue-200'}`}>
                        {world.membership.role.toUpperCase()}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500 text-xs">Your Credits</span>
                      <span className="text-indigo-600 font-extrabold">⭐ {world.membership.credits}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {isDev && (
              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                <h3 className="font-bold text-slate-800 text-sm mb-3">🛡️ Moderator Tools</h3>
                <Link
                  to={`/worlds/${id}/manage`}
                  className="block w-full text-center bg-[#f8f9fa] hover:bg-slate-100 border border-slate-200 text-slate-700 px-4 py-2 rounded-full text-sm font-bold transition-colors"
                >
                  ⚙️ Manage World
                </Link>
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
