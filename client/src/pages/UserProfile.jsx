import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';
import api, {
  getApiAssetUrl,
  getApiCollection,
  getApiErrorMessage,
} from '../services/api.js';

const roleStyles = {
  dev: 'bg-purple-900/50 text-purple-300 border-purple-700/60',
  player: 'bg-blue-900/50 text-blue-300 border-blue-700/60',
  member: 'bg-blue-900/50 text-blue-300 border-blue-700/60',
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

      const payload = {
        display_name: nextDisplayName,
      };

      if (avatarUrl) {
        payload.avatar = avatarUrl;
      }

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

  if (loading) {
    return (
      <div className="text-center text-dark-400 py-12">Loading profile...</div>
    );
  }

  if (error) {
    return (
      <div className="bg-dark-900 border border-red-800 rounded-xl p-6 text-center">
        <h1 className="text-2xl font-bold text-dark-100 mb-2">UserProfile</h1>
        <p className="text-red-300 mb-4">{error}</p>
        <button
          type="button"
          onClick={() => globalThis.location.reload()}
          className="bg-primary-600 hover:bg-primary-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <section className="bg-dark-900 border border-dark-700 rounded-xl p-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-5">
          {avatarSrc ? (
            <img
              src={avatarSrc}
              alt={displayName}
              className="h-24 w-24 rounded-xl object-cover border border-dark-700"
            />
          ) : (
            <div className="h-24 w-24 rounded-xl bg-primary-900/60 border border-primary-700/60 text-primary-200 flex items-center justify-center text-3xl font-bold">
              {initials || 'U'}
            </div>
          )}

          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-primary-400 mb-1">
              UserProfile
            </p>
            <h1 className="text-3xl font-bold text-dark-100 truncate">
              {displayName}
            </h1>
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2 text-sm">
              <p className="text-dark-400">
                Username:{' '}
                <span className="text-dark-200">{profile?.username}</span>
              </p>
              <p className="text-dark-400">
                Email: <span className="text-dark-200">{profile?.email}</span>
              </p>
              <p className="text-dark-400">
                Joined:{' '}
                <span className="text-dark-200">
                  {formatDate(profile?.created_at)}
                </span>
              </p>
              <p className="text-dark-400">
                Worlds:{' '}
                <span className="text-dark-200">{worlds.length}</span>
              </p>
            </div>
          </div>

          <div className="sm:self-start">
            {!isEditing && (
              <button
                type="button"
                onClick={handleStartEdit}
                className="bg-primary-600 hover:bg-primary-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
              >
                Edit Profile
              </button>
            )}
          </div>
        </div>

        {isEditing && (
          <form
            onSubmit={handleSaveProfile}
            className="mt-6 border-t border-dark-700 pt-6 space-y-4"
          >
            {saveError && (
              <div className="bg-red-900/30 border border-red-700 text-red-300 text-sm rounded-lg p-3">
                {saveError}
              </div>
            )}

            <div>
              <label
                htmlFor="profile_display_name"
                className="block text-sm text-dark-400 mb-1"
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
                className="w-full bg-dark-800 border border-dark-600 rounded-lg px-4 py-2.5 text-dark-100 focus:outline-none focus:border-primary-500 transition"
              />
            </div>

            <div>
              <label
                htmlFor="profile_avatar"
                className="block text-sm text-dark-400 mb-1"
              >
                Avatar
              </label>
              <input
                id="profile_avatar"
                type="file"
                accept="image/png,image/jpeg,image/gif,image/webp"
                onChange={handleAvatarChange}
                className="block w-full text-sm text-dark-300 file:mr-4 file:rounded-lg file:border-0 file:bg-dark-700 file:px-4 file:py-2 file:text-sm file:font-medium file:text-dark-100 hover:file:bg-dark-600"
              />
              <p className="mt-2 text-xs text-dark-500">
                PNG, JPEG, GIF, or WebP. Maximum 5 MB.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 sm:justify-end">
              <button
                type="button"
                onClick={handleCancelEdit}
                disabled={saving}
                className="border border-dark-600 bg-dark-800 hover:bg-dark-700 text-dark-200 px-4 py-2 rounded-lg text-sm font-medium transition disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="bg-primary-600 hover:bg-primary-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Profile'}
              </button>
            </div>
          </form>
        )}

        {saveMessage && !isEditing && (
          <div className="mt-4 bg-green-900/30 border border-green-700 text-green-300 text-sm rounded-lg p-3">
            {saveMessage}
          </div>
        )}
      </section>

      <section>
        <div className="flex items-center justify-between gap-4 mb-5">
          <h2 className="text-2xl font-bold text-dark-100">
            Worlds You Joined
          </h2>
          <Link
            to="/worlds"
            className="text-primary-400 hover:text-primary-300 text-sm font-medium transition"
          >
            Explore worlds
          </Link>
        </div>

        {worlds.length === 0 ? (
          <div className="bg-dark-900 border border-dark-700 rounded-xl p-8 text-center">
            <p className="text-dark-300 mb-3">
              This account has not joined any worlds yet.
            </p>
            <Link
              to="/worlds"
              className="inline-flex bg-primary-600 hover:bg-primary-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
            >
              Find a world
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {worlds.map((world) => {
              const roleClass =
                roleStyles[world.role] ||
                'bg-dark-800 text-dark-300 border-dark-600';

              return (
                <Link
                  key={world.id}
                  to={`/worlds/${world.id}`}
                  className="bg-dark-900 border border-dark-700 rounded-xl p-5 hover:border-primary-600 transition group"
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <h3 className="text-lg font-semibold text-dark-100 group-hover:text-primary-400 transition line-clamp-2">
                      {world.title}
                    </h3>
                    <span
                      className={`shrink-0 text-xs px-2 py-1 rounded-full border font-medium ${roleClass}`}
                    >
                      {(world.role || 'member').toUpperCase()}
                    </span>
                  </div>
                  <p className="text-dark-400 text-sm mb-4 line-clamp-2">
                    {world.description || 'No description'}
                  </p>
                  <div className="grid grid-cols-3 gap-3 text-xs text-dark-400">
                    <span>
                      <span className="block text-dark-500">Members</span>
                      <span className="text-dark-200">
                        {world.member_count ?? 0}
                      </span>
                    </span>
                    <span>
                      <span className="block text-dark-500">Credits</span>
                      <span className="text-dark-200">
                        {world.credits ?? 0}
                      </span>
                    </span>
                    <span>
                      <span className="block text-dark-500">Created</span>
                      <span className="text-dark-200">
                        {formatDate(world.created_at)}
                      </span>
                    </span>
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
