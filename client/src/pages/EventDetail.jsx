/* eslint-disable react/prop-types */
import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api, { getApiErrorMessage } from '../services/api.js';

const formatDate = (value) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString();
};

const statusClasses = {
  open: 'bg-green-900/50 text-green-300 border-green-800',
  closed: 'bg-dark-800 text-dark-300 border-dark-700',
  approved: 'bg-blue-900/50 text-blue-300 border-blue-800',
  proposed: 'bg-yellow-900/40 text-yellow-300 border-yellow-800',
};

function LikeButton({ liked, count, disabled, onToggle }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={disabled}
      className={`text-sm px-3 py-1.5 rounded-lg border transition disabled:cursor-not-allowed disabled:opacity-60 ${
        liked
          ? 'bg-primary-900/50 text-primary-300 border-primary-700'
          : 'bg-dark-800 text-dark-300 border-dark-700 hover:border-dark-500'
      }`}
    >
      {liked ? 'Liked' : 'Like'} ({count || 0})
    </button>
  );
}

function Comments({ postId, user, onCommentCreated }) {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formMessage, setFormMessage] = useState('');

  const fetchComments = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const res = await api.get(`/posts/${postId}/comments`);
      setComments(res.data);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to load comments'));
    } finally {
      setLoading(false);
    }
  }, [postId]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmedContent = content.trim();
    if (!trimmedContent) return;

    setSubmitting(true);
    setFormMessage('');

    try {
      const res = await api.post(`/posts/${postId}/comments`, {
        content: trimmedContent,
      });
      setComments((currentComments) => [...currentComments, res.data]);
      setContent('');
      onCommentCreated(postId);
    } catch (err) {
      setFormMessage(getApiErrorMessage(err, 'Failed to add comment'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mt-4 border-t border-dark-800 pt-4">
      <h3 className="text-sm font-semibold text-dark-200 mb-3">Comments</h3>

      {loading ? (
        <p className="text-sm text-dark-500">Loading comments...</p>
      ) : error ? (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-red-300">{error}</p>
          <button
            type="button"
            onClick={fetchComments}
            className="self-start text-sm text-primary-400 hover:text-primary-300"
          >
            Retry
          </button>
        </div>
      ) : comments.length === 0 ? (
        <p className="text-sm text-dark-500">No comments yet.</p>
      ) : (
        <div className="space-y-3">
          {comments.map((comment) => (
            <div key={comment.id} className="rounded-lg bg-dark-800/70 p-3">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mb-1">
                <span className="text-sm font-medium text-dark-100">
                  {comment.display_name || comment.username}
                </span>
                <span className="text-xs text-dark-500">
                  @{comment.username}
                  {comment.created_at
                    ? ` - ${new Date(comment.created_at).toLocaleString()}`
                    : ''}
                </span>
              </div>
              <p className="text-sm text-dark-300 whitespace-pre-wrap">
                {comment.content}
              </p>
            </div>
          ))}
        </div>
      )}

      {user ? (
        <form onSubmit={handleSubmit} className="mt-4 space-y-2">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Write a comment..."
            required
            rows={3}
            className="w-full bg-dark-800 border border-dark-600 rounded-lg px-3 py-2 text-sm text-dark-100 focus:outline-none focus:border-primary-500 resize-none"
          />
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <button
              type="submit"
              disabled={submitting || !content.trim()}
              className="self-start bg-dark-700 hover:bg-dark-600 text-dark-100 px-3 py-1.5 rounded-lg text-sm font-medium transition disabled:opacity-50"
            >
              {submitting ? 'Commenting...' : 'Comment'}
            </button>
            {formMessage && (
              <p className="text-sm text-dark-400">{formMessage}</p>
            )}
          </div>
        </form>
      ) : (
        <p className="mt-4 text-sm text-dark-500">
          Login and join this world to comment.
        </p>
      )}
    </div>
  );
}

export default function EventDetail() {
  const { eventId } = useParams();
  const { user } = useAuth();
  const [event, setEvent] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [postContent, setPostContent] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formMessage, setFormMessage] = useState('');

  const fetchEventData = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const [eventRes, postsRes] = await Promise.all([
        api.get(`/events/${eventId}`),
        api.get(`/posts/event/${eventId}`),
      ]);
      setEvent(eventRes.data);
      setPosts(postsRes.data);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to load event'));
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    fetchEventData();
  }, [fetchEventData]);

  const handleCreatePost = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setFormMessage('');

    try {
      const res = await api.post(`/posts/event/${eventId}`, {
        content: postContent.trim(),
        image_url: imageUrl.trim() || undefined,
      });

      setPostContent('');
      setImageUrl('');

      if (res.data?.status === 'approved') {
        setFormMessage('Post published.');
        await fetchEventData();
      } else {
        setFormMessage('Post submitted and waiting for dev approval.');
      }
    } catch (err) {
      setFormMessage(getApiErrorMessage(err, 'Failed to create post'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleLike = async (postId) => {
    if (!user) return;

    const oldPost = posts.find((post) => post.id === postId);
    if (!oldPost) return;

    setPosts((currentPosts) =>
      currentPosts.map((post) => {
        if (post.id !== postId) return post;
        const liked = !post.liked;
        return {
          ...post,
          liked,
          like_count: Number(post.like_count || 0) + (liked ? 1 : -1),
        };
      }),
    );

    try {
      const res = await api.post(`/posts/${postId}/like`);
      setPosts((currentPosts) =>
        currentPosts.map((post) =>
          post.id === postId
            ? {
                ...post,
                liked: res.data.liked,
                like_count:
                  Number(oldPost.like_count || 0) + (res.data.liked ? 1 : 0),
              }
            : post,
        ),
      );
    } catch {
      await fetchEventData();
    }
  };

  const handleCommentCreated = (postId) => {
    setPosts((currentPosts) =>
      currentPosts.map((post) =>
        post.id === postId
          ? {
              ...post,
              comment_count: Number(post.comment_count || 0) + 1,
            }
          : post,
      ),
    );
  };

  if (loading) {
    return (
      <div className="text-center text-dark-400 py-12">Loading event...</div>
    );
  }

  if (error || !event) {
    return (
      <div className="text-center py-12">
        <p className="text-dark-300 mb-4">{error || 'Event not found'}</p>
        <Link to="/worlds" className="text-primary-400 hover:underline">
          Back to worlds
        </Link>
      </div>
    );
  }

  const startDate = formatDate(event.start_date);
  const endDate = formatDate(event.end_date);
  const isOpen = event.status === 'open';

  return (
    <div className="space-y-6">
      <Link
        to={`/worlds/${event.world_id}`}
        className="inline-flex text-sm text-primary-400 hover:text-primary-300"
      >
        Back to world
      </Link>

      <section className="bg-dark-900 border border-dark-700 rounded-2xl p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-primary-900/50 text-primary-300">
                {event.event_type === 'big' ? 'BIG EVENT' : 'SMALL EVENT'}
              </span>
              <span
                className={`text-xs font-medium px-2 py-0.5 rounded-full border ${
                  statusClasses[event.status] || statusClasses.closed
                }`}
              >
                {event.status?.toUpperCase()}
              </span>
            </div>

            <h1 className="text-3xl font-bold text-dark-100 mb-3">
              {event.title}
            </h1>
            <p className="text-dark-300 whitespace-pre-wrap">
              {event.description || 'No description'}
            </p>
          </div>

          <div className="md:text-right text-sm text-dark-500 space-y-1 shrink-0">
            {startDate && (
              <p>
                <span className="text-dark-400">Start:</span> {startDate}
              </p>
            )}
            {endDate && (
              <p>
                <span className="text-dark-400">End:</span> {endDate}
              </p>
            )}
            <p>
              <span className="text-dark-400">Created by:</span>{' '}
              {event.creator_display_name || event.creator_name}
            </p>
          </div>
        </div>
      </section>

      {isOpen && (
        <section className="bg-dark-900 border border-dark-700 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-dark-100">Create post</h2>
            {!user && (
              <Link to="/login" className="text-sm text-primary-400">
                Login to post
              </Link>
            )}
          </div>

          {user ? (
            <form onSubmit={handleCreatePost} className="space-y-3">
              <textarea
                value={postContent}
                onChange={(e) => setPostContent(e.target.value)}
                placeholder="Write a post for this event..."
                required
                rows={4}
                className="w-full bg-dark-800 border border-dark-600 rounded-lg px-3 py-2 text-sm text-dark-100 focus:outline-none focus:border-primary-500 resize-none"
              />
              <input
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="Image URL (optional)"
                className="w-full bg-dark-800 border border-dark-600 rounded-lg px-3 py-2 text-sm text-dark-100 focus:outline-none focus:border-primary-500"
              />
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <button
                  type="submit"
                  disabled={submitting || !postContent.trim()}
                  className="bg-primary-600 hover:bg-primary-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition disabled:opacity-50"
                >
                  {submitting ? 'Posting...' : 'Post'}
                </button>
                {formMessage && (
                  <p className="text-sm text-dark-400">{formMessage}</p>
                )}
              </div>
            </form>
          ) : (
            <p className="text-sm text-dark-400">
              You need to login and be an approved member of this world to post.
            </p>
          )}
        </section>
      )}

      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-dark-100">Event posts</h2>
          <span className="text-sm text-dark-500">{posts.length} posts</span>
        </div>

        {posts.length === 0 ? (
          <div className="text-center text-dark-400 bg-dark-900 border border-dark-700 rounded-xl py-10">
            No approved posts for this event yet.
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map((post) => (
              <article
                key={post.id}
                className="bg-dark-900 border border-dark-700 rounded-xl p-4"
              >
                <div className="flex items-center justify-between gap-4 mb-3">
                  <div>
                    <p className="font-medium text-dark-100">
                      {post.display_name || post.username}
                    </p>
                    <p className="text-xs text-dark-500">
                      @{post.username}
                      {post.created_at
                        ? ` - ${new Date(post.created_at).toLocaleString()}`
                        : ''}
                    </p>
                  </div>
                  <span className="text-xs text-dark-500">
                    {post.comment_count || 0} comments
                  </span>
                </div>

                <p className="text-dark-300 whitespace-pre-wrap mb-3">
                  {post.content}
                </p>

                {post.image_url && (
                  <img
                    src={post.image_url}
                    alt=""
                    className="max-h-96 w-full object-cover rounded-lg border border-dark-700 mb-3"
                  />
                )}

                <LikeButton
                  liked={post.liked}
                  count={post.like_count}
                  disabled={!user}
                  onToggle={() => handleToggleLike(post.id)}
                />

                <Comments
                  postId={post.id}
                  user={user}
                  onCommentCreated={handleCommentCreated}
                />
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
