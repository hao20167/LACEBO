import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import api, { getApiErrorMessage } from '../services/api.js';

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
  const [profile, setProfile] = useState(null);
  const [worlds, setWorlds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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
        setWorlds(Array.isArray(worldsRes.data) ? worldsRes.data : []);
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

  const displayName = profile?.display_name || profile?.username || 'User';
  const initials = useMemo(() => {
    return displayName
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join('')
      .toUpperCase();
  }, [displayName]);

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
          onClick={() => window.location.reload()}
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
          {profile?.avatar_url ? (
            <img
              src={profile.avatar_url}
              alt={displayName}
              className="h-24 w-24 rounded-xl object-cover border border-dark-700"
            />
          ) : (
            <div className="h-24 w-24 rounded-xl bg-primary-900/60 border border-primary-700/60 text-primary-200 flex items-center justify-center text-3xl font-bold">
              {initials || 'U'}
            </div>
          )}

          <div className="min-w-0">
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
        </div>
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
