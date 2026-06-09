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
        setPagination({
          totalPages: 1,
          hasNextPage: false,
          hasPrevPage: false,
        });
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
      setPosts(posts.map(p => {
        if (p.id === postId) {
          return { ...p, liked: res.data.liked, like_count: p.like_count + (res.data.liked ? 1 : -1) };
        }
        return p;
      }));
    } catch { }
  };

  const confirmDeletePost = (post) => {
    setPostToDelete(post);
    setOpenMenuPostId(null);
  };

  const cancelDeletePost = () => {
    setPostToDelete(null);
  };

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
      setPosts(posts.map((post) =>
        post.id === editingPostId ? { ...post, content: res.data.content } : post,
      ));
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
    } catch { }
  };

  const handleComment = async (postId) => {
    const content = newComment[postId];
    if (!content?.trim()) return;
    try {
      const res = await api.post(`/posts/${postId}/comments`, { content });
      setComments({ ...comments, [postId]: [...(comments[postId] || []), res.data] });
      setNewComment({ ...newComment, [postId]: '' });
      setPosts(posts.map(p => p.id === postId ? { ...p, comment_count: p.comment_count + 1 } : p));
    } catch { }
  };

  if (loading) return <EventDetailSkeleton />;
  if (!event) return <div className="text-center text-dark-400 py-12">Event not found</div>;

  const isOpen = event.status === 'open';

  return (
    <div className="max-w-3xl mx-auto">
      {/* Event Header */}
      <div className="bg-dark-900 border border-dark-700 rounded-2xl p-6 mb-6">
        <div className="flex items-center gap-2 mb-2">
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
            event.event_type === 'big' ? 'bg-primary-900/50 text-primary-300' : 'bg-dark-700 text-dark-300'
          }`}>
            {event.event_type === 'big' ? 'BIG EVENT' : 'SMALL EVENT'}
          </span>
          <span className={`text-xs px-2 py-0.5 rounded-full ${
            isOpen ? 'bg-green-900/50 text-green-300' : 'bg-dark-700 text-dark-400'
          }`}>
            {event.status.toUpperCase()}
          </span>
        </div>
        <h1 className="text-2xl font-bold text-dark-100 mb-2">{event.title}</h1>
        <p className="text-dark-300 whitespace-pre-wrap mb-3">{event.description}</p>
        <div className="flex items-center gap-4 text-sm text-dark-500">
          <span>By {event.creator_display_name}</span>
          {event.start_date && <span>📅 {new Date(event.start_date).toLocaleDateString()}</span>}
          {event.end_date && <span>→ {new Date(event.end_date).toLocaleDateString()}</span>}
        </div>
      </div>

      {/* Create Post */}
      {isOpen && user && (
        <form onSubmit={handlePost} className="bg-dark-900 border border-dark-700 rounded-xl p-4 mb-6">
          <textarea
            value={newPost} onChange={e => setNewPost(e.target.value)}
            placeholder="Share your thoughts about this event..."
            rows={3}
            className="w-full bg-dark-800 border border-dark-600 rounded-lg px-4 py-2.5 text-dark-100 focus:outline-none focus:border-primary-500 transition resize-none mb-3"
          />
          <div className="flex justify-end">
            <button type="submit" disabled={posting || !newPost.trim()}
              className="bg-primary-600 hover:bg-primary-500 text-white px-6 py-2 rounded-lg text-sm font-medium transition disabled:opacity-50">
              {posting ? 'Posting...' : 'Post'}
            </button>
          </div>
        </form>
      )}

      {!isOpen && (
        <div className="bg-dark-800 border border-dark-700 rounded-xl p-4 mb-6 text-center text-dark-400 text-sm">
          This event is closed. You can still view the posts.
        </div>
      )}

      {/* Posts */}
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
          <div className="space-y-4">
          {posts.map(post => (
            <div key={post.id} className="bg-dark-900 border border-dark-700 rounded-xl p-4">
              {/* Post header */}
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-full bg-primary-800 flex items-center justify-center text-sm font-medium text-primary-200">
                  {post.display_name?.[0]?.toUpperCase()}
                </div>
                <div>
                  <span className="text-sm font-medium text-dark-200">{post.display_name}</span>
                  <span className="text-xs text-dark-500 ml-2">@{post.username}</span>
                </div>
                <div className="ml-auto flex items-center gap-2">
                  <span className="text-xs text-dark-500">{new Date(post.created_at).toLocaleString()}</span>
                  {post.can_delete && (
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => togglePostMenu(post.id)}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-dark-800 text-dark-400 hover:bg-dark-700 hover:text-dark-100 transition"
                      >
                        ...
                      </button>
                      {openMenuPostId === post.id && (
                        <div className="absolute right-0 z-20 mt-2 w-36 overflow-hidden rounded-2xl border border-dark-700 bg-dark-900 shadow-2xl">
                          {post.user_id === user?.id && (
                            <button
                              type="button"
                              onClick={() => startEditingPost(post)}
                              className="w-full px-4 py-3 text-left text-sm text-dark-100 hover:bg-dark-800"
                            >
                              Sửa
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => confirmDeletePost(post)}
                            className="w-full px-4 py-3 text-left text-sm text-red-400 hover:bg-dark-800"
                          >
                            Xóa
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Post content */}
              {editingPostId === post.id ? (
                <div className="space-y-3 mb-3">
                  <textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    rows={4}
                    className="w-full bg-dark-800 border border-dark-600 rounded-lg px-4 py-3 text-dark-100 focus:outline-none focus:border-primary-500 transition resize-none"
                  />
                  <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                    <button
                      type="button"
                      onClick={cancelEditingPost}
                      className="rounded-2xl border border-dark-700 bg-dark-800 px-4 py-3 text-sm font-medium text-dark-200 hover:border-dark-500"
                    >
                      Hủy
                    </button>
                    <button
                      type="button"
                      onClick={saveEditedPost}
                      disabled={!editContent.trim()}
                      className="rounded-2xl bg-primary-600 px-4 py-3 text-sm font-medium text-white hover:bg-primary-500 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Lưu
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-dark-200 whitespace-pre-wrap mb-3">{post.content}</p>
              )}

              {/* Post actions */}
              <div className="flex items-center gap-4 text-sm">
                <button onClick={() => handleLike(post.id)} 
                  className={`flex items-center gap-1 transition ${post.liked ? 'text-red-400' : 'text-dark-400 hover:text-red-400'}`}>
                  {post.liked ? '❤️' : '🤍'} {post.like_count}
                </button>
                <button onClick={() => toggleComments(post.id)}
                  className="flex items-center gap-1 text-dark-400 hover:text-primary-400 transition">
                  💬 {post.comment_count}
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

      {postToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-[28px] border border-dark-700 bg-dark-900 p-6 shadow-2xl">
            <div className="mb-4">
              <h2 className="text-xl font-semibold text-dark-100">Xác nhận xóa bài viết</h2>
              <p className="mt-2 text-sm text-dark-300">
                Bạn có chắc chắn muốn xóa bài viết này? Hành động này không thể hoàn tác.
              </p>
            </div>
            <div className="mb-5 rounded-2xl border border-dark-700 bg-dark-800 p-4 text-sm text-dark-200 whitespace-pre-wrap">
              {postToDelete.content}
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={cancelDeletePost}
                className="rounded-2xl border border-dark-700 bg-dark-800 px-4 py-3 text-sm font-medium text-dark-200 hover:border-dark-500"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleDeletePost}
                className="rounded-2xl bg-red-500 px-4 py-3 text-sm font-medium text-white hover:bg-red-400"
              >
                Xóa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
