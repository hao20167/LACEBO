import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api, { getApiCollection } from '../services/api';
import { EventDetailSkeleton } from '../components/SkeletonLoader';
import { useToastContext } from '../components/Toast';
import Pagination from '../components/Pagination';

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
      setPosts(getApiCollection(res.data));
      if (res.data?.pagination) {
        setPagination(res.data.pagination);
      } else {
        setPagination({ totalPages: 1, hasNextPage: false, hasPrevPage: false });
      }
    } catch {}
  };

  const fetchData = async () => {
    try {
      const [eventRes] = await Promise.all([api.get(`/events/${eventId}`), fetchPosts(1)]);
      setEvent(eventRes.data);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { setPage(1); fetchData(); }, [eventId]);

  const handlePageChange = (nextPage) => { setPage(nextPage); fetchPosts(nextPage); };

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
      setPosts(posts.map((p) => p.id === postId ? { ...p, liked: res.data.liked, like_count: p.like_count + (res.data.liked ? 1 : -1) } : p));
    } catch {}
  };

  const confirmDeletePost = (post) => { setPostToDelete(post); setOpenMenuPostId(null); };
  const cancelDeletePost = () => setPostToDelete(null);
  const togglePostMenu = (postId) => setOpenMenuPostId(openMenuPostId === postId ? null : postId);

  const startEditingPost = (post) => { setOpenMenuPostId(null); setEditingPostId(post.id); setEditContent(post.content || ''); };
  const cancelEditingPost = () => { setEditingPostId(null); setEditContent(''); };

  const saveEditedPost = async () => {
    if (!editingPostId || !editContent.trim()) return;
    try {
      const res = await api.patch(`/posts/${editingPostId}`, { content: editContent.trim() });
      setPosts(posts.map((post) => post.id === editingPostId ? { ...post, content: res.data.content } : post));
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
      setComments({ ...comments, [postId]: getApiCollection(res.data) });
      setExpandedComments({ ...expandedComments, [postId]: true });
    } catch {}
  };

  const handleComment = async (postId) => {
    const content = newComment[postId];
    if (!content?.trim()) return;
    try {
      const res = await api.post(`/posts/${postId}/comments`, { content });
      setComments({ ...comments, [postId]: [...(comments[postId] || []), res.data] });
      setNewComment({ ...newComment, [postId]: '' });
      setPosts(posts.map((p) => p.id === postId ? { ...p, comment_count: p.comment_count + 1 } : p));
    } catch {}
  };

  if (loading) return <EventDetailSkeleton />;
  if (!event) return <div className="text-center text-slate-500 py-12">Event not found</div>;

  const isOpen = event.status === 'open';
  const isBig = event.event_type === 'big';

  return (
    <div className="max-w-2xl mx-auto space-y-3">
      {/* ── Event "OP post" card ── */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="flex">
          {/* Vote column */}
          <div className="w-10 bg-[#f8f9fa] flex flex-col items-center py-4 gap-1 border-r border-slate-100 flex-shrink-0">
            <span className={`text-sm font-black ${isBig ? 'text-indigo-500' : 'text-slate-400'}`}>▲</span>
            <span className="text-xs font-extrabold text-slate-600">{event.post_count || 0}</span>
            <span className="text-slate-200 text-sm font-black">▼</span>
          </div>
          {/* Content */}
          <div className="flex-1 p-4">
            <div className="flex items-center gap-1.5 mb-2 flex-wrap">
              <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${isBig ? 'bg-indigo-100 text-indigo-700 border-indigo-200' : 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                {isBig ? 'BIG EVENT' : 'SMALL EVENT'}
              </span>
              <span className={`text-xs px-2.5 py-0.5 rounded-full border font-medium ${isOpen ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>
                {event.status.toUpperCase()}
              </span>
            </div>
            <h1 className="text-lg font-extrabold text-slate-900 mb-2 leading-tight">{event.title}</h1>
            <p className="text-sm text-slate-400 mb-3">
              Posted by <span className="font-semibold text-slate-600">{event.creator_display_name}</span>
              {event.start_date && <> · 📅 {new Date(event.start_date).toLocaleDateString()}</>}
              {event.end_date && <> → {new Date(event.end_date).toLocaleDateString()}</>}
            </p>
            <p className="text-slate-700 text-sm whitespace-pre-wrap leading-relaxed mb-4">{event.description}</p>
            <div className="flex items-center gap-1 text-xs text-slate-500 border-t border-slate-100 pt-3">
              <span className="hover:bg-[#f0f2f5] px-2 py-1.5 rounded font-bold">💬 {posts.length} Comments</span>
              <span className="hover:bg-[#f0f2f5] px-2 py-1.5 rounded font-bold cursor-pointer">🔗 Share</span>
              <span className="hover:bg-[#f0f2f5] px-2 py-1.5 rounded font-bold cursor-pointer">🔖 Save</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Closed notice ── */}
      {!isOpen && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-amber-700 text-sm flex items-center gap-2 shadow-sm">
          <span>🔒</span>
          <span>This event is closed. Posts are read-only.</span>
        </div>
      )}

      {/* ── Comment compose ── */}
      {isOpen && user && (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-4">
          <p className="text-xs text-slate-500 mb-3">
            Comment as <span className="font-bold text-indigo-600">u/{user.username}</span>
          </p>
          <form onSubmit={handlePost}>
            <textarea
              value={newPost}
              onChange={(e) => setNewPost(e.target.value)}
              placeholder="What are your thoughts?"
              rows={4}
              className="w-full bg-slate-50 border border-slate-200 rounded-md px-3.5 py-2.5 text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition resize-none text-sm mb-3"
            />
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={posting || !newPost.trim()}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-full text-sm font-bold transition-colors disabled:opacity-50 shadow-sm"
              >
                {posting ? 'Posting...' : 'Comment'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── Posts ── */}
      {posts.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl py-14 text-center shadow-sm">
          <div className="text-3xl mb-3">💬</div>
          <p className="text-slate-500 text-sm">No posts yet. Be the first!</p>
        </div>
      ) : (
        <>
          <div className="space-y-2">
            {posts.map((post) => (
              <div key={post.id} className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                <div className="flex">
                  {/* Vote column */}
                  <div className="w-10 bg-[#f8f9fa] flex flex-col items-center py-3 gap-0.5 border-r border-slate-100 flex-shrink-0">
                    <button
                      type="button"
                      onClick={() => handleLike(post.id)}
                      className={`text-sm font-black transition-colors hover:text-indigo-500 ${post.liked ? 'text-indigo-600' : 'text-slate-300'}`}
                    >
                      ▲
                    </button>
                    <span className={`text-xs font-extrabold ${post.like_count > 0 ? 'text-indigo-600' : 'text-slate-400'}`}>
                      {post.like_count}
                    </span>
                    <span className="text-slate-200 text-sm font-black">▼</span>
                  </div>

                  {/* Post content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 px-3 pt-2.5 pb-1">
                      <div className="w-5 h-5 rounded-full bg-indigo-100 flex items-center justify-center text-xs font-bold text-indigo-600 flex-shrink-0">
                        {post.display_name?.[0]?.toUpperCase()}
                      </div>
                      <span className="text-xs font-bold text-slate-800">u/{post.username}</span>
                      <span className="text-xs text-slate-400">· {new Date(post.created_at).toLocaleString()}</span>
                      {post.can_delete && (
                        <div className="relative ml-auto">
                          <button
                            type="button"
                            onClick={() => togglePostMenu(post.id)}
                            className="h-6 w-6 flex items-center justify-center rounded text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors text-xs"
                          >
                            •••
                          </button>
                          {openMenuPostId === post.id && (
                            <div className="absolute right-0 z-20 mt-1 w-32 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
                              {post.user_id === user?.id && (
                                <button type="button" onClick={() => startEditingPost(post)} className="w-full px-4 py-2.5 text-left text-sm text-slate-700 hover:bg-slate-50">Sửa</button>
                              )}
                              <button type="button" onClick={() => confirmDeletePost(post)} className="w-full px-4 py-2.5 text-left text-sm text-red-600 hover:bg-red-50">Xóa</button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="px-3 pb-2">
                      {editingPostId === post.id ? (
                        <div className="space-y-2">
                          <textarea
                            value={editContent}
                            onChange={(e) => setEditContent(e.target.value)}
                            rows={4}
                            className="w-full bg-slate-50 border border-slate-300 rounded-md px-3 py-2 text-slate-900 focus:outline-none focus:bg-white focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition resize-none text-sm"
                          />
                          <div className="flex gap-2 justify-end">
                            <button type="button" onClick={cancelEditingPost} className="rounded-full border border-slate-300 bg-white px-3 py-1.5 text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors">Hủy</button>
                            <button type="button" onClick={saveEditedPost} disabled={!editContent.trim()} className="rounded-full bg-indigo-600 px-3 py-1.5 text-sm font-bold text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors">Lưu</button>
                          </div>
                        </div>
                      ) : (
                        <p className="text-slate-700 whitespace-pre-wrap text-sm leading-relaxed">{post.content}</p>
                      )}
                    </div>

                    <div className="flex items-center gap-1 px-3 pb-2.5 border-t border-slate-50 pt-2">
                      <button
                        type="button"
                        onClick={() => toggleComments(post.id)}
                        className="flex items-center gap-1 text-xs text-slate-500 hover:bg-[#f0f2f5] hover:text-indigo-600 px-2 py-1.5 rounded font-bold transition-colors"
                      >
                        💬 {post.comment_count} Comments
                      </button>
                      <span className="text-xs text-slate-500 hover:bg-[#f0f2f5] px-2 py-1.5 rounded font-bold cursor-pointer transition-colors">🔗 Share</span>
                    </div>

                    {expandedComments[post.id] && (
                      <div className="mx-3 mb-3 pt-3 border-t border-slate-100">
                        <div className="space-y-2 mb-3">
                          {(comments[post.id] || []).map((c) => (
                            <div key={c.id} className="flex gap-2">
                              <div className="w-5 h-5 rounded-full bg-slate-200 flex items-center justify-center text-xs text-slate-600 flex-shrink-0 mt-0.5 font-bold">
                                {c.display_name?.[0]?.toUpperCase()}
                              </div>
                              <div className="flex-1 bg-[#f8f9fa] rounded-lg px-3 py-2">
                                <div className="flex items-baseline gap-1.5 mb-0.5">
                                  <span className="text-xs font-bold text-slate-800">{c.display_name}</span>
                                  <span className="text-xs text-slate-400">{new Date(c.created_at).toLocaleString()}</span>
                                </div>
                                <p className="text-slate-700 text-xs leading-relaxed">{c.content}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                        {user && (
                          <div className="flex gap-2">
                            <input
                              type="text"
                              placeholder="Add a comment..."
                              value={newComment[post.id] || ''}
                              onChange={(e) => setNewComment({ ...newComment, [post.id]: e.target.value })}
                              onKeyDown={(e) => e.key === 'Enter' && handleComment(post.id)}
                              className="flex-1 bg-slate-50 border border-slate-200 rounded-full px-3 py-1.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition"
                            />
                            <button
                              type="button"
                              onClick={() => handleComment(post.id)}
                              className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-full text-xs font-bold transition-colors"
                            >
                              Reply
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
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

      {/* ── Delete modal ── */}
      {postToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
            <h2 className="text-lg font-bold text-slate-900 mb-1">Xác nhận xóa bài viết</h2>
            <p className="text-sm text-slate-500 mb-4">Bạn có chắc chắn muốn xóa bài viết này? Hành động này không thể hoàn tác.</p>
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm text-slate-700 whitespace-pre-wrap mb-5 max-h-32 overflow-y-auto">
              {postToDelete.content}
            </div>
            <div className="flex gap-3 justify-end">
              <button type="button" onClick={cancelDeletePost} className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors">Hủy</button>
              <button type="button" onClick={handleDeletePost} className="rounded-full bg-red-500 px-4 py-2 text-sm font-bold text-white hover:bg-red-600 transition-colors">Xóa bài viết</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
