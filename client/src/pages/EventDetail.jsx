import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import EmptyState from '../components/EmptyState';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import { EventDetailSkeleton } from '../components/SkeletonLoader';
import { useToastContext } from '../components/Toast';
import Pagination from '../components/Pagination';

const getCollection = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
};

export default function EventDetail() {
  const { eventId } = useParams();
  const { user } = useAuth();
  const toast = useToastContext();
  const [event, setEvent] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newPost, setNewPost] = useState('');
  const [posting, setPosting] = useState(false);
  const [expandedComments, setExpandedComments] = useState({});
  const [comments, setComments] = useState({});
  const [newComment, setNewComment] = useState({});
  const [postToDelete, setPostToDelete] = useState(null);
  const [editingPostId, setEditingPostId] = useState(null);
  const [editContent, setEditContent] = useState('');
  const [openMenuPostId, setOpenMenuPostId] = useState(null);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: false,
  });

  const fetchPosts = async (pageNumber = 1) => {
    try {
      const res = await api.get(`/posts/event/${eventId}`, {
        params: { page: pageNumber, limit: 10 },
      });
      setPosts(getCollection(res.data));
      if (res.data?.pagination) {
        setPagination(res.data.pagination);
      } else {
        setPagination({ totalPages: 1, hasNextPage: false, hasPrevPage: false });
      }
    } catch {}
  };

  const fetchData = async () => {
    try {
      const [eventRes] = await Promise.all([
        api.get(`/events/${eventId}`),
        fetchPosts(1),
      ]);
      setEvent(eventRes.data);
    } catch {}
    setLoading(false);
  };

  useEffect(() => {
    setPage(1);
    fetchData();
  }, [eventId]);

  const handlePageChange = (nextPage) => {
    setPage(nextPage);
    fetchPosts(nextPage);
  };

  const handlePost = async (e) => {
    e.preventDefault();
    if (!newPost.trim()) return;
    setPosting(true);
    try {
      await api.post(`/posts/event/${eventId}`, { content: newPost });
      setNewPost('');
      setPage(1);
      await fetchPosts(1);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create post');
    }
    setPosting(false);
  };

  const handleLike = async (postId) => {
    try {
      const res = await api.post(`/posts/${postId}/like`);
      setPosts(
        posts.map((p) => {
          if (p.id === postId) {
            return {
              ...p,
              liked: res.data.liked,
              like_count: p.like_count + (res.data.liked ? 1 : -1),
            };
          }
          return p;
        }),
      );
    } catch {}
  };

  const confirmDeletePost = (post) => {
    setPostToDelete(post);
    setOpenMenuPostId(null);
  };

  const cancelDeletePost = () => setPostToDelete(null);

  const togglePostMenu = (postId) => {
    setOpenMenuPostId(openMenuPostId === postId ? null : postId);
  };

  const startEditingPost = (post) => {
    setOpenMenuPostId(null);
    setEditingPostId(post.id);
    setEditContent(post.content || '');
  };

  const cancelEditingPost = () => {
    setEditingPostId(null);
    setEditContent('');
  };

  const saveEditedPost = async () => {
    if (!editingPostId || !editContent.trim()) return;
    try {
      const res = await api.patch(`/posts/${editingPostId}`, {
        content: editContent.trim(),
      });
      setPosts(
        posts.map((post) =>
          post.id === editingPostId
            ? { ...post, content: res.data.content }
            : post,
        ),
      );
      setEditingPostId(null);
      setEditContent('');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update post');
    }
  };

  const handleDeletePost = async () => {
    if (!postToDelete) return;
    try {
      await api.delete(`/posts/${postToDelete.id}`);
      setPosts(posts.filter((post) => post.id !== postToDelete.id));
      setPostToDelete(null);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to delete post');
    }
  };

  const toggleComments = async (postId) => {
    if (expandedComments[postId]) {
      setExpandedComments({ ...expandedComments, [postId]: false });
      return;
    }
    try {
      const res = await api.get(`/posts/${postId}/comments`);
      setComments({ ...comments, [postId]: getCollection(res.data) });
      setExpandedComments({ ...expandedComments, [postId]: true });
    } catch {}
  };

  const handleComment = async (postId) => {
    const content = newComment[postId];
    if (!content?.trim()) return;
    try {
      const res = await api.post(`/posts/${postId}/comments`, { content });
      setComments({
        ...comments,
        [postId]: [...(comments[postId] || []), res.data],
      });
      setNewComment({ ...newComment, [postId]: '' });
      setPosts(
        posts.map((p) =>
          p.id === postId ? { ...p, comment_count: p.comment_count + 1 } : p,
        ),
      );
    } catch (err) {
      toast.error(err.response?.data?.error || 'Không thể gửi bình luận. Bạn cần là thành viên của World này.');
    }
  };

  if (loading) return <EventDetailSkeleton />;
  if (!event)
    return (
      <div className="text-center text-slate-500 py-12">Event not found</div>
    );

  const isOpen = event.status === 'open';
  const isBig = event.event_type === 'big';

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      {/* ── Event header ─────────────────────────────── */}
      <div
        className={`bg-white rounded-2xl overflow-hidden shadow-sm border ${isBig ? 'border-indigo-200' : 'border-slate-200'}`}
      >
        {/* Accent bar */}
        <div
          className={`h-1.5 ${isBig ? 'bg-gradient-to-r from-indigo-500 to-violet-500' : 'bg-gradient-to-r from-slate-300 to-slate-400'}`}
        />
        <div className="p-6">
          <div className="flex items-center gap-2 mb-3">
            <span
              className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${
                isBig
                  ? 'bg-indigo-100 text-indigo-700 border-indigo-200'
                  : 'bg-slate-100 text-slate-600 border-slate-200'
              }`}
            >
              {isBig ? 'BIG EVENT' : 'SMALL EVENT'}
            </span>
            <span
              className={`text-xs px-2.5 py-1 rounded-full border font-medium ${
                isOpen
                  ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
                  : 'bg-slate-100 text-slate-500 border-slate-200'
              }`}
            >
              {event.status.toUpperCase()}
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">
            {event.title}
          </h1>
          <p className="text-slate-600 text-sm whitespace-pre-wrap leading-relaxed mb-4">
            {event.description}
          </p>
          <div className="flex items-center gap-4 text-xs text-slate-400 pt-3 border-t border-slate-100">
            <span>By {event.creator_display_name}</span>
            {event.start_date && (
              <span>📅 {new Date(event.start_date).toLocaleDateString()}</span>
            )}
            {event.end_date && (
              <span>→ {new Date(event.end_date).toLocaleDateString()}</span>
            )}
          </div>
        </div>
      </div>

      {/* ── Closed notice ────────────────────────────── */}
      {!isOpen && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-5 py-3.5 text-amber-700 text-sm flex items-center gap-2">
          <span>🔒</span>
          <span>This event is closed. Posts are read-only.</span>
        </div>
      )}

      {/* ── Create post ──────────────────────────────── */}
      {isOpen && user && (
        <form
          onSubmit={handlePost}
          className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm"
        >
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-indigo-100 border border-indigo-200 flex items-center justify-center text-sm font-bold text-indigo-600 flex-shrink-0 mt-0.5">
              {user.display_name?.[0]?.toUpperCase()}
            </div>
            <div className="flex-1">
              <textarea
                value={newPost}
                onChange={(e) => setNewPost(e.target.value)}
                placeholder="Share your thoughts about this event..."
                rows={3}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2.5 text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition resize-none text-sm mb-2"
              />
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={posting || !newPost.trim()}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 shadow-sm"
                >
                  {posting ? 'Posting...' : 'Post'}
                </button>
              </div>
            </div>
          </div>
        </form>
      )}

      {/* ── Posts ────────────────────────────────────── */}
      {posts.length === 0 ? (
        <>
          <span className="sr-only">No posts yet. Be the first to post!</span>
          <EmptyState
            title="No approved posts for this event yet."
            description={
              isOpen && user
                ? 'Be the first to post.'
                : 'Approved posts will appear here.'
            }
          />
        </>
      ) : (
        <>
          <div className="space-y-3">
            {posts.map((post) => (
              <div
                key={post.id}
                className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm"
              >
                {/* Post header */}
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-9 h-9 rounded-full bg-indigo-100 border border-indigo-200 flex items-center justify-center text-sm font-bold text-indigo-600 flex-shrink-0">
                    {post.display_name?.[0]?.toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-sm font-semibold text-slate-900">
                        {post.display_name}
                      </span>
                      <span className="text-xs text-slate-400">
                        @{post.username}
                      </span>
                    </div>
                    <span className="text-xs text-slate-400">
                      {new Date(post.created_at).toLocaleString()}
                    </span>
                  </div>
                  {post.can_delete && (
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => togglePostMenu(post.id)}
                        className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-700 transition-colors text-xs"
                      >
                        •••
                      </button>
                      {openMenuPostId === post.id && (
                        <div className="absolute right-0 z-20 mt-1 w-32 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
                          {post.user_id === user?.id && (
                            <button
                              type="button"
                              onClick={() => startEditingPost(post)}
                              className="w-full px-4 py-2.5 text-left text-sm text-slate-700 hover:bg-slate-50"
                            >
                              Sửa
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => confirmDeletePost(post)}
                            className="w-full px-4 py-2.5 text-left text-sm text-red-600 hover:bg-red-50"
                          >
                            Xóa
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Post content */}
                {editingPostId === post.id ? (
                  <div className="space-y-3 ml-12">
                    <textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      rows={4}
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg px-4 py-3 text-slate-900 focus:outline-none focus:bg-white focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition resize-none text-sm"
                    />
                    <div className="flex gap-2 justify-end">
                      <button
                        type="button"
                        onClick={cancelEditingPost}
                        className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                      >
                        Hủy
                      </button>
                      <button
                        type="button"
                        onClick={saveEditedPost}
                        disabled={!editContent.trim()}
                        className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors shadow-sm"
                      >
                        Lưu
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-slate-700 whitespace-pre-wrap text-sm ml-12 leading-relaxed">
                    {post.content}
                  </p>
                )}

                {/* Post actions */}
                <div className="flex items-center gap-5 text-sm mt-3 ml-12">
                  <button
                    onClick={() => handleLike(post.id)}
                    className={`flex items-center gap-1.5 transition-colors ${post.liked ? 'text-red-500' : 'text-slate-400 hover:text-red-400'}`}
                  >
                    {post.liked ? '❤️' : '🤍'}
                    <span className="text-xs">{post.like_count}</span>
                  </button>
                  <button
                    onClick={() => toggleComments(post.id)}
                    className="flex items-center gap-1.5 text-slate-400 hover:text-indigo-600 transition-colors"
                  >
                    💬
                    <span className="text-xs">{post.comment_count}</span>
                  </button>
                </div>

              {/* Comments */}
              {expandedComments[post.id] && (
                <div className="mt-3 pt-3 border-t border-dark-700">
                  {(comments[post.id] || []).length === 0 ? (
                    <EmptyState
                      title="No comments yet."
                      description="Start the discussion with the first comment."
                      compact
                    />
                  ) : (
                    (comments[post.id] || []).map(c => (
                      <div key={c.id} className="flex gap-2 mb-3">
                        <div className="w-6 h-6 rounded-full bg-dark-700 flex items-center justify-center text-xs text-dark-300 flex-shrink-0 mt-0.5">
                          {c.display_name?.[0]?.toUpperCase()}
                        </div>
                        <div>
                          <span className="text-sm font-medium text-dark-300">{c.display_name}</span>
                          <span className="text-xs text-dark-500 ml-2">{new Date(c.created_at).toLocaleString()}</span>
                          <p className="text-dark-300 text-sm">{c.content}</p>
                        </div>
                      </div>
                    ))
                  )}
                  {user && (
                    <div className="flex gap-2 mt-2">
                      <input type="text" placeholder="Write a comment..."
                        value={newComment[post.id] || ''}
                        onChange={e => setNewComment({ ...newComment, [post.id]: e.target.value })}
                        onKeyDown={e => e.key === 'Enter' && handleComment(post.id)}
                        className="flex-1 bg-dark-800 border border-dark-600 rounded-lg px-3 py-1.5 text-sm text-dark-100 focus:outline-none focus:border-primary-500 transition" />
                      <button onClick={() => handleComment(post.id)}
                        className="bg-primary-600 hover:bg-primary-500 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition">
                        Send
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

          <Pagination
            page={page}
            totalPages={pagination.totalPages}
            onPageChange={handlePageChange}
            hasNextPage={pagination.hasNextPage}
            hasPrevPage={pagination.hasPrevPage}
          />
        </>
      )}

      {/* ── Delete confirm modal ──────────────────────── */}
      {postToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
            <h2 className="text-lg font-bold text-slate-900 mb-1">
              Xác nhận xóa bài viết
            </h2>
            <p className="text-sm text-slate-500 mb-4">
              Bạn có chắc chắn muốn xóa bài viết này? Hành động này không thể
              hoàn tác.
            </p>
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm text-slate-700 whitespace-pre-wrap mb-5 max-h-32 overflow-y-auto">
              {postToDelete.content}
            </div>
            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={cancelDeletePost}
                className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleDeletePost}
                className="rounded-lg bg-red-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-red-600 transition-colors"
              >
                Xóa bài viết
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
