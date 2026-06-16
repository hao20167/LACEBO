import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import PropTypes from 'prop-types';
import EmptyState from '../components/EmptyState';
import { useAuth } from '../contexts/AuthContext';
import api, { getApiAssetUrl } from '../services/api';
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
  const [commentImageFiles, setCommentImageFiles] = useState({});
  const [commentImagePreviews, setCommentImagePreviews] = useState({});
  const [commentUploading, setCommentUploading] = useState({});
  const [replyActive, setReplyActive] = useState({});
  const [newReply, setNewReply] = useState({});
  const [replyImageFiles, setReplyImageFiles] = useState({});
  const [replyImagePreviews, setReplyImagePreviews] = useState({});
  const [replyUploading, setReplyUploading] = useState({});
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
  const [uploadingEventImage, setUploadingEventImage] = useState(false);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const handleCommentImageChange = (postId, file) => {
    if (commentImagePreviews[postId]) {
      URL.revokeObjectURL(commentImagePreviews[postId]);
    }
    if (!file) {
      const nextFiles = { ...commentImageFiles };
      delete nextFiles[postId];
      setCommentImageFiles(nextFiles);

      const nextPreviews = { ...commentImagePreviews };
      delete nextPreviews[postId];
      setCommentImagePreviews(nextPreviews);
      return;
    }
    if (!file.type.startsWith('image/')) {
      toast.error('Only image files are allowed');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be at most 5MB');
      return;
    }
    const preview = URL.createObjectURL(file);
    setCommentImageFiles({ ...commentImageFiles, [postId]: file });
    setCommentImagePreviews({ ...commentImagePreviews, [postId]: preview });
  };

  const removeCommentImage = (postId) => {
    handleCommentImageChange(postId, null);
  };

  const handleComment = async (postId) => {
    const content = newComment[postId];
    if (!content?.trim() && !commentImageFiles[postId]) return;

    setCommentUploading({ ...commentUploading, [postId]: true });
    try {
      let imageUrl = null;
      if (commentImageFiles[postId]) {
        const formData = new FormData();
        formData.append('image', commentImageFiles[postId]);
        const uploadRes = await api.post('/uploads/images', formData);
        imageUrl = uploadRes.data.url;
      }

      const payload = { content: content?.trim() || '' };
      if (imageUrl) {
        payload.image_url = imageUrl;
      }

      const res = await api.post(`/posts/${postId}/comments`, payload);

      setComments({
        ...comments,
        [postId]: [...(comments[postId] || []), res.data],
      });
      setNewComment({ ...newComment, [postId]: '' });

      // Clean up local preview & file
      if (commentImagePreviews[postId]) {
        URL.revokeObjectURL(commentImagePreviews[postId]);
      }
      const nextFiles = { ...commentImageFiles };
      delete nextFiles[postId];
      setCommentImageFiles(nextFiles);

      const nextPreviews = { ...commentImagePreviews };
      delete nextPreviews[postId];
      setCommentImagePreviews(nextPreviews);

      setPosts(
        posts.map((p) =>
          p.id === postId ? { ...p, comment_count: p.comment_count + 1 } : p,
        ),
      );
    } catch (err) {
      toast.error(
        err.response?.data?.error ||
          'Không thể gửi bình luận. Bạn cần là thành viên của World này.',
      );
    } finally {
      const nextUploading = { ...commentUploading };
      delete nextUploading[postId];
      setCommentUploading(nextUploading);
    }
  };

  const handleCommentLike = async (postId, commentId) => {
    try {
      const res = await api.post(`/posts/comments/${commentId}/like`);
      setComments({
        ...comments,
        [postId]: comments[postId].map((c) => {
          if (c.id === commentId) {
            return {
              ...c,
              liked: res.data.liked,
              like_count: c.like_count + (res.data.liked ? 1 : -1),
            };
          }
          return c;
        }),
      });
    } catch {}
  };

  const handleReplyImageChange = (commentId, file) => {
    if (replyImagePreviews[commentId]) {
      URL.revokeObjectURL(replyImagePreviews[commentId]);
    }
    if (!file) {
      const nextFiles = { ...replyImageFiles };
      delete nextFiles[commentId];
      setReplyImageFiles(nextFiles);

      const nextPreviews = { ...replyImagePreviews };
      delete nextPreviews[commentId];
      setReplyImagePreviews(nextPreviews);
      return;
    }
    if (!file.type.startsWith('image/')) {
      toast.error('Only image files are allowed');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be at most 5MB');
      return;
    }
    const preview = URL.createObjectURL(file);
    setReplyImageFiles({ ...replyImageFiles, [commentId]: file });
    setReplyImagePreviews({ ...replyImagePreviews, [commentId]: preview });
  };

  const removeReplyImage = (commentId) => {
    handleReplyImageChange(commentId, null);
  };

  const handleReply = async (postId, parentCommentId) => {
    const content = newReply[parentCommentId];
    if (!content?.trim() && !replyImageFiles[parentCommentId]) return;

    setReplyUploading({ ...replyUploading, [parentCommentId]: true });
    try {
      let imageUrl = null;
      if (replyImageFiles[parentCommentId]) {
        const formData = new FormData();
        formData.append('image', replyImageFiles[parentCommentId]);
        const uploadRes = await api.post('/uploads/images', formData);
        imageUrl = uploadRes.data.url;
      }

      const payload = {
        content: content?.trim() || '',
        parent_id: parentCommentId,
      };
      if (imageUrl) {
        payload.image_url = imageUrl;
      }

      const res = await api.post(`/posts/${postId}/comments`, payload);

      setComments({
        ...comments,
        [postId]: [...(comments[postId] || []), res.data],
      });
      setNewReply({ ...newReply, [parentCommentId]: '' });
      setReplyActive({ ...replyActive, [parentCommentId]: false });

      // Clean up local preview & file
      if (replyImagePreviews[parentCommentId]) {
        URL.revokeObjectURL(replyImagePreviews[parentCommentId]);
      }
      const nextFiles = { ...replyImageFiles };
      delete nextFiles[parentCommentId];
      setReplyImageFiles(nextFiles);

      const nextPreviews = { ...replyImagePreviews };
      delete nextPreviews[parentCommentId];
      setReplyImagePreviews(nextPreviews);

      setPosts(
        posts.map((p) =>
          p.id === postId ? { ...p, comment_count: p.comment_count + 1 } : p,
        ),
      );
    } catch (err) {
      toast.error(
        err.response?.data?.error ||
          'Không thể gửi phản hồi. Bạn cần là thành viên của World này.',
      );
    } finally {
      const nextUploading = { ...replyUploading };
      delete nextUploading[parentCommentId];
      setReplyUploading(nextUploading);
    }
  };

  if (loading) return <EventDetailSkeleton />;
  if (!event)
    return (
      <div className="text-center text-slate-500 py-12">Event not found</div>
    );

  const isOpen = event.status === 'open';
  const isBig = event.event_type === 'big';

  const handleUploadEventImage = async (field, file) => {
    if (!file) return;
    setUploadingEventImage(true);
    try {
      const formData = new FormData();
      formData.append('image', file);
      const uploadRes = await api.post('/uploads/images', formData);
      await api.patch(`/events/${eventId}`, { [field]: uploadRes.data.url });
      const res = await api.get(`/events/${eventId}`);
      setEvent(res.data);
      toast.success('Image updated.');
    } catch {
      toast.error('Failed to upload image.');
    }
    setUploadingEventImage(false);
  };

  const isDev = user && event.created_by && user.id === event.created_by;

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      {/* ── Event header ─────────────────────────────── */}
      <div
        className={`bg-white rounded-2xl overflow-hidden shadow-sm border ${isBig ? 'border-indigo-200' : 'border-slate-200'}`}
      >
        {/* Background image or accent bar */}
        {getApiAssetUrl(event.background_image_url) ? (
          <div className="relative h-40 group">
            <img
              src={getApiAssetUrl(event.background_image_url)}
              alt="Event background"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            {isDev && (
              <label className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 text-white text-xs px-2.5 py-1.5 rounded-lg cursor-pointer transition-colors">
                {uploadingEventImage ? '...' : '📷 Change BG'}
                <input type="file" accept="image/*" className="hidden" disabled={uploadingEventImage}
                  onChange={e => handleUploadEventImage('background_image_url', e.target.files?.[0])} />
              </label>
            )}
          </div>
        ) : isDev ? (
          <label className={`flex h-20 cursor-pointer items-center justify-center gap-2 text-sm font-medium transition-colors ${isBig ? 'bg-indigo-50 text-indigo-500 hover:bg-indigo-100' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`}>
            {uploadingEventImage ? 'Uploading...' : '📷 Add Background Image'}
            <input type="file" accept="image/*" className="hidden" disabled={uploadingEventImage}
              onChange={e => handleUploadEventImage('background_image_url', e.target.files?.[0])} />
          </label>
        ) : (
          <div className={`h-1.5 ${isBig ? 'bg-gradient-to-r from-indigo-500 to-violet-500' : 'bg-gradient-to-r from-slate-300 to-slate-400'}`} />
        )}

        {/* Cover image (full-width, above title) */}
        {getApiAssetUrl(event.thumbnail_url) ? (
          <div className="relative group">
            <img
              src={getApiAssetUrl(event.thumbnail_url)}
              alt="Event cover"
              className="w-full h-36 object-cover"
            />
            {isDev && (
              <label className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-white text-xs font-medium">
                {uploadingEventImage ? 'Uploading...' : '📷 Change Cover'}
                <input type="file" accept="image/*" className="hidden" disabled={uploadingEventImage}
                  onChange={e => handleUploadEventImage('thumbnail_url', e.target.files?.[0])} />
              </label>
            )}
          </div>
        ) : isDev ? (
          <label className={`flex h-24 cursor-pointer items-center justify-center gap-2 border-b text-sm font-medium transition-colors ${isBig ? 'bg-indigo-50/50 border-indigo-100 text-indigo-400 hover:bg-indigo-100' : 'bg-slate-50 border-slate-100 text-slate-400 hover:bg-slate-100'}`}>
            {uploadingEventImage ? 'Uploading...' : '📷 Add Cover Image'}
            <input type="file" accept="image/*" className="hidden" disabled={uploadingEventImage}
              onChange={e => handleUploadEventImage('thumbnail_url', e.target.files?.[0])} />
          </label>
        ) : null}

        <div className="p-6">
          <div className="mb-3">
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
            </div>
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
          <span className="sr-only">This event is closed. You can still view the posts.</span>
        </div>
      )}

      {/* ── Create post ──────────────────────────────── */}
      {isOpen && user && (
        <form
          onSubmit={handlePost}
          className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm"
        >
          <div className="flex gap-3">
            {getApiAssetUrl(user.avatar_url) ? (
              <img
                src={getApiAssetUrl(user.avatar_url)}
                alt={user.display_name}
                className="w-8 h-8 rounded-full object-cover border border-indigo-200 flex-shrink-0 mt-0.5"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-indigo-100 border border-indigo-200 flex items-center justify-center text-sm font-bold text-indigo-600 flex-shrink-0 mt-0.5">
                {user.display_name?.[0]?.toUpperCase()}
              </div>
            )}
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
                  {getApiAssetUrl(post.avatar_url) ? (
                    <img
                      src={getApiAssetUrl(post.avatar_url)}
                      alt={post.display_name}
                      className="w-9 h-9 rounded-full object-cover border border-indigo-200 flex-shrink-0"
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-indigo-100 border border-indigo-200 flex items-center justify-center text-sm font-bold text-indigo-600 flex-shrink-0">
                      {post.display_name?.[0]?.toUpperCase()}
                    </div>
                  )}
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
                        aria-label="..."
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
                    {post.liked ? '❤️' : '🤍'}{' '}
                    <span className="text-xs">{post.like_count}</span>
                  </button>
                  <button
                    onClick={() => toggleComments(post.id)}
                    className="flex items-center gap-1.5 text-slate-400 hover:text-indigo-600 transition-colors"
                  >
                    💬{' '}
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
                    (comments[post.id] || [])
                      .filter(c => !c.parent_id)
                      .map(c => (
                        <CommentItem
                          key={c.id}
                          comment={c}
                          allComments={comments[post.id] || []}
                          postId={post.id}
                          user={user}
                          replyActive={replyActive}
                          setReplyActive={setReplyActive}
                          newReply={newReply}
                          setNewReply={setNewReply}
                          replyImageFiles={replyImageFiles}
                          replyImagePreviews={replyImagePreviews}
                          replyUploading={replyUploading}
                          handleCommentLike={handleCommentLike}
                          handleReply={handleReply}
                          handleReplyImageChange={handleReplyImageChange}
                          removeReplyImage={removeReplyImage}
                        />
                      ))
                  )}
                  {user && (
                    <div className="space-y-2 mt-2">
                      {/* Image preview row */}
                      {commentImagePreviews[post.id] && (
                        <div className="relative inline-block mt-1">
                          <img
                            src={commentImagePreviews[post.id]}
                            alt="Preview"
                            className="max-h-20 max-w-xs rounded-lg object-contain border border-dark-600"
                          />
                          <button
                            type="button"
                            onClick={() => removeCommentImage(post.id)}
                            className="absolute -top-1.5 -right-1.5 bg-red-600 hover:bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs shadow-md border border-white font-bold"
                            title="Xóa ảnh"
                          >
                            ✕
                          </button>
                        </div>
                      )}

                      {/* Input row */}
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          placeholder={commentUploading[post.id] ? "Uploading..." : "Write a comment..."}
                          value={newComment[post.id] || ''}
                          onChange={e => setNewComment({ ...newComment, [post.id]: e.target.value })}
                          onKeyDown={e => e.key === 'Enter' && !commentUploading[post.id] && handleComment(post.id)}
                          disabled={commentUploading[post.id]}
                          className="flex-1 bg-dark-800 border border-dark-600 rounded-lg px-3 py-1.5 text-sm text-dark-100 focus:outline-none focus:border-primary-500 transition disabled:opacity-60"
                        />

                        {/* Hidden File Input */}
                        <input
                          type="file"
                          id={`comment-image-input-${post.id}`}
                          accept="image/*"
                          onChange={e => handleCommentImageChange(post.id, e.target.files?.[0])}
                          className="hidden"
                          disabled={commentUploading[post.id]}
                        />

                        {/* Attachment Button */}
                        <label
                          htmlFor={`comment-image-input-${post.id}`}
                          className={`cursor-pointer rounded-lg border border-dark-600 bg-dark-800 p-1.5 text-sm text-dark-300 hover:text-dark-100 hover:bg-dark-700 transition flex items-center justify-center shrink-0 ${commentUploading[post.id] ? 'opacity-60 pointer-events-none' : ''}`}
                          title="Tải ảnh lên"
                        >
                          📷
                        </label>

                        {/* Submit button */}
                        <button
                          onClick={() => handleComment(post.id)}
                          disabled={commentUploading[post.id] || (!newComment[post.id]?.trim() && !commentImageFiles[post.id])}
                          className="bg-primary-600 hover:bg-primary-500 text-white px-3.5 py-1.5 rounded-lg text-xs font-semibold transition disabled:opacity-50 shrink-0"
                        >
                          {commentUploading[post.id] ? '...' : 'Send'}
                        </button>
                      </div>
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

function CommentItem({
  comment,
  allComments,
  postId,
  user,
  replyActive,
  setReplyActive,
  newReply,
  setNewReply,
  replyImageFiles,
  replyImagePreviews,
  replyUploading,
  handleCommentLike,
  handleReply,
  handleReplyImageChange,
  removeReplyImage,
}) {
  const getRepliesForParent = (parentId) => {
    return allComments.filter(c => {
      if (!c.parent_id) return false;
      let current = c;
      while (current.parent_id) {
        if (current.parent_id === parentId) return true;
        const parent = allComments.find(x => x.id === current.parent_id);
        if (!parent) break;
        current = parent;
      }
      return false;
    });
  };

  const replies = getRepliesForParent(comment.id);

  return (
    <div className="mb-4">
      {/* Parent Comment */}
      <div className="flex gap-2">
        {getApiAssetUrl(comment.avatar_url) ? (
          <img
            src={getApiAssetUrl(comment.avatar_url)}
            alt={comment.display_name}
            className="w-6 h-6 rounded-full object-cover flex-shrink-0 mt-0.5"
          />
        ) : (
          <div className="w-6 h-6 rounded-full bg-dark-700 flex items-center justify-center text-xs text-dark-300 flex-shrink-0 mt-0.5 font-bold">
            {comment.display_name?.[0]?.toUpperCase()}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-1.5">
            <span className="text-sm font-medium text-dark-300">{comment.display_name}</span>
            <span className="text-xs text-dark-500">@{comment.username}</span>
            <span className="text-xs text-dark-500">{new Date(comment.created_at).toLocaleString()}</span>
          </div>
          <p className="text-dark-300 text-sm whitespace-pre-wrap mt-0.5">{comment.content}</p>
          {comment.image_url && (
            <img
              src={getApiAssetUrl(comment.image_url)}
              alt="Bình luận"
              className="mt-1.5 max-h-40 rounded-lg object-contain border border-dark-600 shadow-sm"
            />
          )}
          
          {/* Comment Actions */}
          <div className="flex items-center gap-4 text-xs mt-1 text-dark-500">
            <button
              onClick={() => handleCommentLike(postId, comment.id)}
              className={`flex items-center gap-1 hover:text-red-400 transition-colors ${comment.liked ? 'text-red-500' : 'text-dark-400'}`}
            >
              {comment.liked ? '❤️' : '🤍'} <span>{comment.like_count || 0}</span>
            </button>
            {user && (
              <button
                onClick={() => setReplyActive({ ...replyActive, [comment.id]: !replyActive[comment.id] })}
                className="flex items-center gap-1 hover:text-indigo-400 transition-colors text-dark-400"
              >
                💬 Phản hồi
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Nested Replies Container */}
      <div className="ml-8 mt-2 space-y-3 border-l border-dark-700 pl-4">
        {replies.map(r => {
          const parentComment = allComments.find(x => x.id === r.parent_id);
          const replyToUsername = parentComment && parentComment.id !== comment.id ? parentComment.username : null;

          return (
            <div key={r.id} className="flex gap-2">
              {getApiAssetUrl(r.avatar_url) ? (
                <img
                  src={getApiAssetUrl(r.avatar_url)}
                  alt={r.display_name}
                  className="w-5 h-5 rounded-full object-cover flex-shrink-0 mt-0.5"
                />
              ) : (
                <div className="w-5 h-5 rounded-full bg-dark-700 flex items-center justify-center text-[10px] text-dark-300 flex-shrink-0 mt-0.5 font-bold">
                  {r.display_name?.[0]?.toUpperCase()}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-1.5 flex-wrap">
                  <span className="text-xs font-medium text-dark-300">{r.display_name}</span>
                  <span className="text-[10px] text-dark-500">@{r.username}</span>
                  {replyToUsername && (
                    <span className="text-[10px] text-indigo-400 font-medium">
                      phản hồi @{replyToUsername}
                    </span>
                  )}
                  <span className="text-[10px] text-dark-500">{new Date(r.created_at).toLocaleString()}</span>
                </div>
                <p className="text-dark-300 text-xs whitespace-pre-wrap mt-0.5">{r.content}</p>
                {r.image_url && (
                  <img
                    src={getApiAssetUrl(r.image_url)}
                    alt="Bình luận"
                    className="mt-1.5 max-h-32 rounded-lg object-contain border border-dark-600 shadow-sm"
                  />
                )}

                {/* Reply Actions */}
                <div className="flex items-center gap-4 text-[10px] mt-1 text-dark-500">
                  <button
                    onClick={() => handleCommentLike(postId, r.id)}
                    className={`flex items-center gap-1 hover:text-red-400 transition-colors ${r.liked ? 'text-red-500' : 'text-dark-400'}`}
                  >
                    {r.liked ? '❤️' : '🤍'} <span>{r.like_count || 0}</span>
                  </button>
                  {user && (
                    <button
                      onClick={() => {
                        setReplyActive({ ...replyActive, [comment.id]: true });
                        setNewReply({ ...newReply, [comment.id]: `@${r.username} ` });
                      }}
                      className="flex items-center gap-1 hover:text-indigo-400 transition-colors text-dark-400"
                    >
                      💬 Phản hồi
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {/* Reply Input Form under root parent comment */}
        {user && replyActive[comment.id] && (
          <div className="space-y-2 mt-2 pt-2 border-t border-dark-700">
            {/* Reply Image preview */}
            {replyImagePreviews[comment.id] && (
              <div className="relative inline-block mt-1">
                <img
                  src={replyImagePreviews[comment.id]}
                  alt="Preview"
                  className="max-h-20 max-w-xs rounded-lg object-contain border border-dark-600"
                />
                <button
                  type="button"
                  onClick={() => removeReplyImage(comment.id)}
                  className="absolute -top-1.5 -right-1.5 bg-red-600 hover:bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs shadow-md border border-white font-bold"
                  title="Xóa ảnh"
                >
                  ✕
                </button>
              </div>
            )}

            {/* Reply Input Row */}
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder={replyUploading[comment.id] ? "Uploading..." : "Viết phản hồi..."}
                value={newReply[comment.id] || ''}
                onChange={e => setNewReply({ ...newReply, [comment.id]: e.target.value })}
                onKeyDown={e => e.key === 'Enter' && !replyUploading[comment.id] && handleReply(postId, comment.id)}
                disabled={replyUploading[comment.id]}
                className="flex-1 bg-dark-800 border border-dark-600 rounded-lg px-3 py-1.5 text-xs text-dark-100 focus:outline-none focus:border-primary-500 transition disabled:opacity-60"
              />

              {/* Hidden File Input for Reply */}
              <input
                type="file"
                id={`reply-image-input-${comment.id}`}
                accept="image/*"
                onChange={e => handleReplyImageChange(comment.id, e.target.files?.[0])}
                className="hidden"
                disabled={replyUploading[comment.id]}
              />

              {/* Reply Attachment Button */}
              <label
                htmlFor={`reply-image-input-${comment.id}`}
                className={`cursor-pointer rounded-lg border border-dark-600 bg-dark-800 p-1.5 text-xs text-dark-300 hover:text-dark-100 hover:bg-dark-700 transition flex items-center justify-center shrink-0 ${replyUploading[comment.id] ? 'opacity-60 pointer-events-none' : ''}`}
                title="Tải ảnh lên"
              >
                📷
              </label>

              {/* Send/Cancel Buttons */}
              <button
                onClick={() => handleReply(postId, comment.id)}
                disabled={replyUploading[comment.id] || (!newReply[comment.id]?.trim() && !replyImageFiles[comment.id])}
                className="bg-primary-600 hover:bg-primary-500 text-white px-3.5 py-1.5 rounded-lg text-[10px] font-semibold transition disabled:opacity-50 shrink-0"
              >
                {replyUploading[comment.id] ? '...' : 'Gửi'}
              </button>
              <button
                onClick={() => {
                  setReplyActive({ ...replyActive, [comment.id]: false });
                  setNewReply({ ...newReply, [comment.id]: '' });
                  removeReplyImage(comment.id);
                }}
                disabled={replyUploading[comment.id]}
                className="bg-dark-700 hover:bg-dark-600 text-dark-300 px-2.5 py-1.5 rounded-lg text-[10px] font-semibold transition shrink-0"
              >
                Hủy
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

CommentItem.propTypes = {
  comment: PropTypes.shape({
    id: PropTypes.number.isRequired,
    display_name: PropTypes.string,
    username: PropTypes.string,
    avatar_url: PropTypes.string,
    created_at: PropTypes.string.isRequired,
    content: PropTypes.string,
    image_url: PropTypes.string,
    liked: PropTypes.bool,
    like_count: PropTypes.number,
    parent_id: PropTypes.number,
  }).isRequired,
  allComments: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.number.isRequired,
      display_name: PropTypes.string,
      username: PropTypes.string,
      avatar_url: PropTypes.string,
      created_at: PropTypes.string.isRequired,
      content: PropTypes.string,
      image_url: PropTypes.string,
      liked: PropTypes.bool,
      like_count: PropTypes.number,
      parent_id: PropTypes.number,
    })
  ).isRequired,
  postId: PropTypes.number.isRequired,
  user: PropTypes.shape({
    id: PropTypes.number.isRequired,
    username: PropTypes.string,
    display_name: PropTypes.string,
  }),
  replyActive: PropTypes.object.isRequired,
  setReplyActive: PropTypes.func.isRequired,
  newReply: PropTypes.object.isRequired,
  setNewReply: PropTypes.func.isRequired,
  replyImageFiles: PropTypes.object.isRequired,
  replyImagePreviews: PropTypes.object.isRequired,
  replyUploading: PropTypes.object.isRequired,
  handleCommentLike: PropTypes.func.isRequired,
  handleReply: PropTypes.func.isRequired,
  handleReplyImageChange: PropTypes.func.isRequired,
  removeReplyImage: PropTypes.func.isRequired,
};
