import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';
import api, {
  getApiAssetUrl,
  getApiCollection,
  getApiErrorMessage,
} from '../services/api.js';
import { UserProfileSkeleton } from '../components/SkeletonLoader';

const roleStyles = {
  dev: 'bg-violet-100 text-violet-700 border-violet-200',
  player: 'bg-blue-100 text-blue-700 border-blue-200',
  member: 'bg-blue-100 text-blue-700 border-blue-200',
};

const formatDate = (value) => {
  if (!value) return 'Unknown';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Unknown';
  return date.toLocaleDateString();
};

export default function UserProfile() {
  const { updateUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [worlds, setWorlds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [displayNameInput, setDisplayNameInput] = useState('');
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [saveMessage, setSaveMessage] = useState('');

  useEffect(() => {
    let isMounted = true;
    const fetchProfile = async () => {
      setLoading(true);
      setError('');
      try {
        const [profileRes, worldsRes] = await Promise.all([
          api.get('/users/me'),
          api.get('/worlds/mine'),
        ]);
        if (!isMounted) return;
        setProfile(profileRes.data);
        setDisplayNameInput(profileRes.data?.display_name || '');
        setWorlds(getApiCollection(worldsRes.data));
      } catch (err) {
        if (!isMounted) return;
        setError(getApiErrorMessage(err, 'Unable to load profile.'));
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchProfile();
    return () => { isMounted = false; };
  }, []);

  useEffect(() => {
    if (!avatarFile) { setAvatarPreview(''); return undefined; }
    const nextPreview = URL.createObjectURL(avatarFile);
    setAvatarPreview(nextPreview);
    return () => { URL.revokeObjectURL(nextPreview); };
  }, [avatarFile]);

  const displayName = profile?.display_name || profile?.username || 'User';
  const avatarSrc = avatarPreview || getApiAssetUrl(profile?.avatar_url);
  const initials = useMemo(() => {
    return displayName.split(' ').filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase();
  }, [displayName]);

  const handleStartEdit = () => {
    setDisplayNameInput(profile?.display_name || '');
    setAvatarFile(null); setSaveError(''); setSaveMessage(''); setIsEditing(true);
  };
  const handleCancelEdit = () => {
    setDisplayNameInput(profile?.display_name || '');
    setAvatarFile(null); setSaveError(''); setSaveMessage(''); setIsEditing(false);
  };
  const handleAvatarChange = (event) => { setAvatarFile(event.target.files?.[0] || null); setSaveError(''); setSaveMessage(''); };

  const handleSaveProfile = async (event) => {
    event.preventDefault();
    const nextDisplayName = displayNameInput.trim();
    if (!nextDisplayName) { setSaveError('Display name cannot be empty.'); return; }
    setSaving(true); setSaveError(''); setSaveMessage('');
    try {
      let avatarUrl = '';
      if (avatarFile) {
        const formData = new FormData();
        formData.append('image', avatarFile);
        const uploadRes = await api.post('/uploads/images', formData);
        avatarUrl = uploadRes.data.url;
      }
      const payload = { display_name: nextDisplayName };
      if (avatarUrl) payload.avatar = avatarUrl;
      const profileRes = await api.patch('/users/me', payload);
      setProfile(profileRes.data);
      updateUser?.(profileRes.data);
      setAvatarFile(null); setIsEditing(false); setSaveMessage('Profile updated.');
    } catch (err) {
      setSaveError(getApiErrorMessage(err, 'Unable to update profile.'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <UserProfileSkeleton />;

  if (error) {
    return (
      <div className="bg-white border border-red-200 rounded-xl p-8 text-center shadow-sm">
        <p className="text-red-600 mb-4">{error}</p>
        <button type="button" onClick={() => globalThis.location.reload()} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-full text-sm font-bold transition-colors">
          Try again
        </button>
      </div>
    );
  }

  const devWorlds = worlds.filter((w) => w.role === 'dev');
  const memberWorlds = worlds.filter((w) => w.role !== 'dev');

  return (
    <div className="space-y-4">
      {/* ── Profile card ── */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        {/* Banner */}
        <div className="h-24 bg-gradient-to-r from-indigo-500 via-violet-500 to-purple-600 relative">
          <div className="absolute inset-0 opacity-20 bg-[radial-gradient(ellipse_at_bottom_left,_white,_transparent)]" />
        </div>

        <div className="px-5 pb-5">
          {/* Avatar + name row */}
          <div className="flex items-end gap-4 -mt-8 mb-4">
            {avatarSrc ? (
              <img src={avatarSrc} alt={displayName} className="h-16 w-16 rounded-full object-cover border-4 border-white shadow-md flex-shrink-0" />
            ) : (
              <div className="h-16 w-16 rounded-full bg-gradient-to-br from-indigo-400 to-violet-500 border-4 border-white shadow-md flex items-center justify-center text-xl font-black text-white flex-shrink-0">
                {initials || 'U'}
              </div>
            )}
            <div className="flex-1 min-w-0 pb-1">
              <h1 className="text-xl font-extrabold text-slate-900 leading-tight">{displayName}</h1>
              <p className="text-sm text-slate-500">u/{profile?.username}</p>
            </div>
            {!isEditing && (
              <button type="button" onClick={handleStartEdit} className="mb-1 border border-indigo-500 text-indigo-600 hover:bg-indigo-50 px-4 py-1.5 rounded-full text-sm font-bold transition-colors flex-shrink-0">
                Edit Profile
              </button>
            )}
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-3 border-y border-slate-100 mb-4">
            {[
              { label: 'Email', value: profile?.email },
              { label: 'Member Since', value: formatDate(profile?.created_at) },
              { label: 'Worlds Joined', value: worlds.length, accent: true },
              { label: 'Username', value: `u/${profile?.username}` },
            ].map((stat) => (
              <div key={stat.label} className="text-center sm:text-left">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">{stat.label}</p>
                <p className={`text-sm font-bold truncate ${stat.accent ? 'text-indigo-600' : 'text-slate-800'}`}>{stat.value}</p>
              </div>
            ))}
          </div>

          {/* Edit form */}
          {isEditing && (
            <form onSubmit={handleSaveProfile} className="space-y-4">
              {saveError && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-3">{saveError}</div>
              )}
              <div>
                <label htmlFor="profile_display_name" className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">Display Name</label>
                <input
                  id="profile_display_name"
                  type="text"
                  value={displayNameInput}
                  onChange={(event) => setDisplayNameInput(event.target.value)}
                  maxLength={50}
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-md px-3 py-2 text-slate-900 focus:outline-none focus:bg-white focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition text-sm"
                />
              </div>
              <div>
                <label htmlFor="profile_avatar" className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">Avatar</label>
                <input
                  id="profile_avatar"
                  type="file"
                  accept="image/png,image/jpeg,image/gif,image/webp"
                  onChange={handleAvatarChange}
                  className="block w-full text-sm text-slate-600 file:mr-4 file:rounded-full file:border-0 file:bg-indigo-50 file:px-4 file:py-2 file:text-sm file:font-bold file:text-indigo-600 hover:file:bg-indigo-100 cursor-pointer"
                />
                <p className="mt-1.5 text-xs text-slate-400">PNG, JPEG, GIF, or WebP. Max 5 MB.</p>
              </div>
              <div className="flex gap-3 justify-end">
                <button type="button" onClick={handleCancelEdit} disabled={saving} className="border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-full text-sm font-bold transition-colors disabled:opacity-50">Cancel</button>
                <button type="submit" disabled={saving} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-full text-sm font-bold transition-colors disabled:opacity-50 shadow-sm">
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          )}

          {saveMessage && !isEditing && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm rounded-lg p-3">{saveMessage}</div>
          )}
        </div>
      </div>

      {/* ── My Communities sections ── */}
      {worlds.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl py-14 text-center shadow-sm">
          <div className="text-4xl mb-3">🌍</div>
          <p className="font-bold text-slate-700 mb-1">No worlds yet</p>
          <p className="text-slate-400 text-sm mb-4">Explore and join some worlds to see them here.</p>
          <Link to="/worlds" className="inline-flex bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-full text-sm font-bold transition-colors shadow-sm">Find a world</Link>
        </div>
      ) : (
        <>
          {devWorlds.length > 0 && (
            <section>
              <h2 className="font-bold text-slate-700 text-sm mb-3 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-violet-500 inline-block" />
                Worlds I Created ({devWorlds.length})
              </h2>
              <div className="space-y-2">
                {devWorlds.map((world) => <WorldRow key={world.id} world={world} />)}
              </div>
            </section>
          )}
          {memberWorlds.length > 0 && (
            <section>
              <h2 className="font-bold text-slate-700 text-sm mb-3 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-400 inline-block" />
                Worlds I Joined ({memberWorlds.length})
              </h2>
              <div className="space-y-2">
                {memberWorlds.map((world) => <WorldRow key={world.id} world={world} />)}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}

function WorldRow({ world }) {
  const roleClass = roleStyles[world.role] || 'bg-slate-100 text-slate-600 border-slate-200';
  return (
    <Link
      to={`/worlds/${world.id}`}
      className="block bg-white border border-slate-200 rounded-xl shadow-sm hover:border-indigo-200 hover:shadow-md transition-all overflow-hidden"
    >
      <div className="flex items-center gap-3 p-4">
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-400 to-violet-500 flex items-center justify-center text-white font-black text-sm flex-shrink-0 shadow-sm">
          {world.title[0]?.toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="font-bold text-slate-900 text-sm hover:text-indigo-600 transition-colors">w/{world.title}</span>
            <span className={`text-xs px-2 py-0.5 rounded-full border font-bold ${roleClass}`}>{world.role.toUpperCase()}</span>
          </div>
          <p className="text-xs text-slate-400">👥 {world.member_count} members · ⭐ {world.credits} credits</p>
        </div>
        <span className="text-xs text-slate-400 flex-shrink-0 hidden sm:block">{new Date(world.created_at).toLocaleDateString()}</span>
      </div>
    </Link>
  );
}
