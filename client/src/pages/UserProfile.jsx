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
  const [bgFile, setBgFile] = useState(null);
  const [bgPreview, setBgPreview] = useState('');
  const [uploadingBg, setUploadingBg] = useState(false);

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
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!avatarFile) {
      setAvatarPreview('');
      return undefined;
    }
    const nextPreview = URL.createObjectURL(avatarFile);
    setAvatarPreview(nextPreview);
    return () => {
      URL.revokeObjectURL(nextPreview);
    };
  }, [avatarFile]);

  useEffect(() => {
    if (!bgFile) {
      setBgPreview('');
      return undefined;
    }
    const nextPreview = URL.createObjectURL(bgFile);
    setBgPreview(nextPreview);
    return () => {
      URL.revokeObjectURL(nextPreview);
    };
  }, [bgFile]);

  const handleBgChange = (event) => {
    const file = event.target.files?.[0] || null;
    setBgFile(file);
  };

  const handleSaveBg = async () => {
    if (!bgFile) return;
    setUploadingBg(true);
    try {
      const formData = new FormData();
      formData.append('image', bgFile);
      const uploadRes = await api.post('/uploads/images', formData);
      const profileRes = await api.patch('/users/me', { background_image: uploadRes.data.url });
      setProfile(profileRes.data);
      updateUser?.(profileRes.data);
      setBgFile(null);
      setSaveMessage('Background updated.');
    } catch (err) {
      setSaveError(getApiErrorMessage(err, 'Unable to update background.'));
    }
    setUploadingBg(false);
  };

  const displayName = profile?.display_name || profile?.username || 'User';
  const avatarSrc = avatarPreview || getApiAssetUrl(profile?.avatar_url);
  const initials = useMemo(() => {
    return displayName
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join('')
      .toUpperCase();
  }, [displayName]);

  const handleStartEdit = () => {
    setDisplayNameInput(profile?.display_name || '');
    setAvatarFile(null);
    setSaveError('');
    setSaveMessage('');
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setDisplayNameInput(profile?.display_name || '');
    setAvatarFile(null);
    setSaveError('');
    setSaveMessage('');
    setIsEditing(false);
  };

  const handleAvatarChange = (event) => {
    const file = event.target.files?.[0] || null;
    setAvatarFile(file);
    setSaveError('');
    setSaveMessage('');
  };

  const handleSaveProfile = async (event) => {
    event.preventDefault();
    const nextDisplayName = displayNameInput.trim();
    if (!nextDisplayName) {
      setSaveError('Display name cannot be empty.');
      return;
    }
    setSaving(true);
    setSaveError('');
    setSaveMessage('');
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
      setAvatarFile(null);
      setIsEditing(false);
      setSaveMessage('Profile updated.');
    } catch (err) {
      setSaveError(getApiErrorMessage(err, 'Unable to update profile.'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <UserProfileSkeleton />;

  if (error) {
    return (
      <div className="bg-white border border-red-200 rounded-2xl p-8 text-center shadow-sm">
        <p className="text-red-600 mb-4">{error}</p>
        <button
          type="button"
          onClick={() => globalThis.location.reload()}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* ── Banner + Profile card ────────────────────── */}
      <div>
        {/* Background banner — clickable to upload */}
        <div className="relative h-36 rounded-2xl overflow-hidden shadow-sm group">
          {bgPreview || getApiAssetUrl(profile?.background_image_url) ? (
            <img
              src={bgPreview || getApiAssetUrl(profile?.background_image_url)}
              alt="Profile background"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-r from-indigo-500 via-violet-500 to-purple-600" />
          )}
          {/* Hover overlay to change background */}
          <label className="absolute inset-0 flex flex-col items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer gap-1">
            <span className="text-white text-sm font-medium">
              {uploadingBg ? 'Uploading...' : '📷 Change Background'}
            </span>
            <input
              type="file"
              accept="image/png,image/jpeg,image/gif,image/webp"
              onChange={handleBgChange}
              className="hidden"
              disabled={uploadingBg}
            />
          </label>
        </div>
        {/* Profile card overlapping banner */}
        <div className="bg-white border border-slate-200 rounded-2xl px-6 pb-6 pt-0 -mt-12 mx-2 shadow-sm relative z-10">
          {/* BG save bar — appears inside the card so it's never covered */}
          {bgFile && (
            <div className="flex items-center justify-between gap-3 bg-indigo-50 border-b border-indigo-100 -mx-6 px-6 py-3 mb-0 rounded-t-2xl">
              <span className="text-sm text-indigo-700 font-medium">
                {uploadingBg ? 'Saving background...' : 'New background image ready to save'}
              </span>
              {!uploadingBg && (
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => { setBgFile(null); setBgPreview(''); }}
                    className="text-sm text-slate-500 hover:text-slate-700 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors bg-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveBg}
                    className="text-sm bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-lg font-medium shadow-sm transition-colors"
                  >
                    Save Background
                  </button>
                </div>
              )}
            </div>
          )}
          <div className="flex flex-col sm:flex-row sm:items-end gap-4 mb-6">
            {/* Avatar */}
            {avatarSrc ? (
              <img
                src={avatarSrc}
                alt={displayName}
                className="h-20 w-20 rounded-xl object-cover border-4 border-white shadow-md -mt-6 flex-shrink-0"
              />
            ) : (
              <div className="h-20 w-20 rounded-xl bg-indigo-100 border-4 border-white shadow-md -mt-6 flex items-center justify-center text-2xl font-bold text-indigo-600 flex-shrink-0">
                {initials || 'U'}
              </div>
            )}

            {/* Name + username */}
            <div className="flex-1 min-w-0 mt-2 sm:mt-0 pb-1">
              <h1 className="text-2xl font-bold text-slate-900 truncate">
                {displayName}
              </h1>
              <p className="text-slate-500 text-sm">@{profile?.username}</p>
            </div>

            {/* Edit button */}
            {!isEditing && (
              <button
                type="button"
                onClick={handleStartEdit}
                className="shrink-0 self-start sm:self-end bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm"
              >
                Edit Profile
              </button>
            )}
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-4 border-y border-slate-100">
            <div>
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-0.5">
                Email
              </p>
              <p className="text-sm font-medium text-slate-700 truncate">
                {profile?.email}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-0.5">
                Member Since
              </p>
              <p className="text-sm font-medium text-slate-700">
                {formatDate(profile?.created_at)}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-0.5">
                Worlds
              </p>
              <p className="text-sm font-bold text-indigo-600">
                {worlds.length}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-0.5">
                Username
              </p>
              <p className="text-sm font-medium text-slate-700">
                {profile?.username}
              </p>
            </div>
          </div>

          {/* Edit form */}
          {isEditing && (
            <form
              onSubmit={handleSaveProfile}
              className="mt-5 space-y-4"
            >
              {saveError && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-3">
                  {saveError}
                </div>
              )}
              <div>
                <label
                  htmlFor="profile_display_name"
                  className="block text-sm font-medium text-slate-700 mb-1.5"
                >
                  Display Name
                </label>
                <input
                  id="profile_display_name"
                  type="text"
                  value={displayNameInput}
                  onChange={(event) => setDisplayNameInput(event.target.value)}
                  maxLength={50}
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-slate-900 focus:outline-none focus:bg-white focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition"
                />
              </div>
              <div>
                <label
                  htmlFor="profile_avatar"
                  className="block text-sm font-medium text-slate-700 mb-1.5"
                >
                  Avatar
                </label>
                <input
                  id="profile_avatar"
                  type="file"
                  accept="image/png,image/jpeg,image/gif,image/webp"
                  onChange={handleAvatarChange}
                  className="block w-full text-sm text-slate-600 file:mr-4 file:rounded-lg file:border-0 file:bg-slate-100 file:px-4 file:py-2 file:text-sm file:font-medium file:text-slate-700 hover:file:bg-slate-200 cursor-pointer"
                />
                <p className="mt-1.5 text-xs text-slate-400">
                  PNG, JPEG, GIF, or WebP. Maximum 5 MB.
                </p>
              </div>
              <div className="flex gap-3 justify-end pt-2">
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  disabled={saving}
                  className="border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 shadow-sm"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          )}

          {saveMessage && !isEditing && (
            <div className="mt-4 bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm rounded-lg p-3">
              {saveMessage}
            </div>
          )}
        </div>
      </div>

      {/* ── Worlds section ──────────────────────────── */}
      <section>
        <div className="flex items-center justify-between gap-4 mb-5">
          <h2 className="text-xl font-bold text-slate-900">Worlds You Joined</h2>
          <Link
            to="/worlds"
            className="text-indigo-600 hover:text-indigo-700 text-sm font-medium transition-colors"
          >
            Explore more →
          </Link>
        </div>

        {worlds.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl py-14 text-center shadow-sm">
            <div className="text-4xl mb-3">🌍</div>
            <p className="text-slate-600 font-medium mb-1">No worlds yet</p>
            <p className="text-slate-400 text-sm mb-5">
              Explore and join some worlds to see them here.
            </p>
            <Link
              to="/worlds"
              className="inline-flex bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-colors shadow-sm"
            >
              Find a world
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {worlds.map((world) => {
              const roleClass =
                roleStyles[world.role] || 'bg-slate-100 text-slate-600 border-slate-200';
              return (
                <Link
                  key={world.id}
                  to={`/worlds/${world.id}`}
                  className="bg-white border border-slate-200 rounded-xl overflow-hidden hover:border-indigo-300 hover:shadow-md transition-all group flex flex-col"
                >
                  {getApiAssetUrl(world.cover_image) ? (
                    <img
                      src={getApiAssetUrl(world.cover_image)}
                      alt={world.title}
                      className="w-full h-28 object-cover group-hover:opacity-95 transition-opacity"
                    />
                  ) : (
                    <div className="h-1 bg-gradient-to-r from-indigo-400 to-violet-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                  )}
                  <div className="p-5 flex flex-col flex-1">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <h3 className="text-base font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-2">
                        {world.title}
                      </h3>
                      <span
                        className={`shrink-0 text-xs px-2.5 py-1 rounded-full border font-medium ${roleClass}`}
                      >
                        {(world.role || 'member').toUpperCase()}
                      </span>
                    </div>
                    <p className="text-slate-500 text-sm mb-4 line-clamp-2 flex-1">
                      {world.description || 'No description'}
                    </p>
                    <div className="grid grid-cols-3 gap-3 text-xs pt-3 border-t border-slate-100">
                      <div>
                        <span className="block text-slate-400 mb-0.5">Members</span>
                        <span className="text-slate-700 font-semibold">
                          {world.member_count ?? 0}
                        </span>
                      </div>
                      <div>
                        <span className="block text-slate-400 mb-0.5">Credits</span>
                        <span className="text-indigo-600 font-semibold">
                          {world.credits ?? 0}
                        </span>
                      </div>
                      <div>
                        <span className="block text-slate-400 mb-0.5">Joined</span>
                        <span className="text-slate-700 font-semibold">
                          {formatDate(world.created_at)}
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
