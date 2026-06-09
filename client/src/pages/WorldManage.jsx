import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import EmptyState from '../components/EmptyState.jsx';
import api from '../services/api.js';

const toSafeUrlId = (value) => {
  const id = String(value);
  return /^\d+$/.test(id) ? encodeURIComponent(id) : null;
};

export default function WorldManage() {
  const { id } = useParams();
  const safeWorldId = toSafeUrlId(id);
  const [world, setWorld] = useState(null);
  const [pendingMembers, setPendingMembers] = useState([]);
  const [pendingPosts, setPendingPosts] = useState([]);
  const [proposedEvents, setProposedEvents] = useState([]);
  const [tab, setTab] = useState('members');
  const [loading, setLoading] = useState(true);
  const [confirmDialog, setConfirmDialog] = useState(null);
  const [confirming, setConfirming] = useState(false);
  const [actionMessage, setActionMessage] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      if (!safeWorldId) {
        setWorld(null);
        setPendingMembers([]);
        setPendingPosts([]);
        setProposedEvents([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const [worldRes, membersRes, postsRes, eventsRes] = await Promise.all([
          api.get(`/worlds/${safeWorldId}`),
          api.get(`/worlds/${safeWorldId}/members/pending`),
          api.get(`/posts/world/${safeWorldId}/pending`),
          api.get(`/events/world/${safeWorldId}/proposed`),
        ]);
        setWorld(worldRes.data);
        setPendingMembers(membersRes.data);
        setPendingPosts(postsRes.data);
        setProposedEvents(eventsRes.data);
      } catch {
        setWorld(null);
        setPendingMembers([]);
        setPendingPosts([]);
        setProposedEvents([]);
      }
      setLoading(false);
    };

    fetchData();
  }, [safeWorldId]);

  const handleMember = async (memberId, status) => {
    const safeWorldId = toSafeUrlId(id);
    const safeMemberId = toSafeUrlId(memberId);
    if (!safeWorldId || !safeMemberId) return;

    try {
      await api.patch(`/worlds/${safeWorldId}/members/${safeMemberId}`, {
        status,
      });
      setPendingMembers(pendingMembers.filter((m) => m.id !== memberId));
    } catch {}
  };

  const handlePost = async (postId, action) => {
    const safePostId = toSafeUrlId(postId);
    if (!safePostId) return;

    try {
      if (action === 'approve') {
        await api.patch(`/posts/${safePostId}/approve`);
      } else if (action === 'reject') {
        await api.patch(`/posts/${safePostId}/reject`);
      }
      setPendingPosts(pendingPosts.filter((p) => p.id !== postId));
    } catch {}
  };

  const handleEvent = async (eventId, status) => {
    const safeEventId = toSafeUrlId(eventId);
    if (!safeEventId) return;

    try {
      await api.patch(`/events/${safeEventId}`, { status });
      setProposedEvents(proposedEvents.filter((e) => e.id !== eventId));
    } catch {}
  };

  const scheduleWorldDeletion = async () => {
    if (!safeWorldId) return;

    try {
      const response = await api.post(`/worlds/${safeWorldId}/schedule-delete`);
      setWorld(response.data);
      setActionMessage('World sẽ được xóa sau 3 phút.');
    } catch {
      setActionMessage('Không thể xóa world. Vui lòng thử lại.');
    }
  };

  const undoWorldDeletion = async () => {
    if (!safeWorldId) return;

    try {
      const response = await api.post(`/worlds/${safeWorldId}/undo-delete`);
      setWorld(response.data);
      setActionMessage('Yêu cầu xóa đã được hủy.');
    } catch {
      setActionMessage('Không thể hoàn tác. Vui lòng thử lại.');
    }
  };

  const formatVietnamTime = (value) => {
    if (!value) return '';
    const normalizedValue =
      typeof value === 'string' && /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(value)
        ? `${value.replace(' ', 'T')}Z`
        : value;
    const dateValue = new Date(normalizedValue);
    if (Number.isNaN(dateValue.getTime())) return value;
    return dateValue.toLocaleString('vi-VN', {
      timeZone: 'Asia/Ho_Chi_Minh',
      dateStyle: 'short',
      timeStyle: 'short',
      hour12: false,
    });
  };

  const handleDeleteClick = () => {
    setConfirmDialog({ mode: 'delete-world' });
  };

  const confirmRejectMember = (member) => {
    setConfirmDialog({ mode: 'reject-member', itemId: member.id, itemLabel: member.display_name });
  };

  const confirmRejectPost = (post) => {
    setConfirmDialog({ mode: 'reject-post', itemId: post.id, itemLabel: post.content });
  };

  const confirmRejectEvent = (event) => {
    setConfirmDialog({ mode: 'reject-event', itemId: event.id, itemLabel: event.title });
  };

  const confirmDialogAction = async () => {
    if (!confirmDialog) return;
    const dialog = confirmDialog;
    setConfirming(true);

    try {
      if (dialog.mode === 'delete-world') {
        await scheduleWorldDeletion();
      } else if (dialog.mode === 'reject-member') {
        await handleMember(dialog.itemId, 'rejected');
      } else if (dialog.mode === 'reject-post') {
        await handlePost(dialog.itemId, 'reject');
      } else if (dialog.mode === 'reject-event') {
        await handleEvent(dialog.itemId, 'rejected');
      }
      setConfirmDialog(null);
    } catch {
      // keep current actionMessage or let existing handlers surface errors
    } finally {
      setConfirming(false);
    }
  };

  const cancelConfirmDialog = () => {
    setConfirmDialog(null);
  };

  const isDev = world?.membership?.role === 'dev' && world?.membership?.status === 'approved';
  const isDeletionScheduled = Boolean(world?.deletion_scheduled_at);
  const dialogCopy = {
    'delete-world': {
      title: 'Xác nhận xóa world',
      description: 'World sẽ được lên lịch xóa hoàn toàn sau 3 phút nếu bạn xác nhận.',
      confirmLabel: 'Xóa world',
    },
    'reject-member': {
      title: 'Xác nhận từ chối thành viên',
      description: 'Thành viên này sẽ bị từ chối tham gia world.',
      confirmLabel: 'Từ chối',
    },
    'reject-post': {
      title: 'Xác nhận từ chối bài viết',
      description: 'Bài viết này sẽ bị từ chối và không được đăng trong world.',
      confirmLabel: 'Từ chối',
    },
    'reject-event': {
      title: 'Xác nhận từ chối sự kiện',
      description: 'Đề xuất sự kiện này sẽ bị từ chối.',
      confirmLabel: 'Từ chối',
    },
  };
  const currentDialogCopy = confirmDialog ? dialogCopy[confirmDialog.mode] : null;

  if (loading)
    return <div className="text-center text-dark-400 py-12">Loading...</div>;

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <Link
          to={`/worlds/${id}`}
          className="text-dark-400 hover:text-dark-200 transition"
        >
          ← Back to World
        </Link>
        <h1 className="text-2xl font-bold text-dark-100">World Management</h1>
      </div>

      {actionMessage && (
        <div className="mb-4 rounded-xl border border-yellow-700 bg-yellow-950/80 p-4 text-yellow-100">
          {actionMessage}
        </div>
      )}

      {isDev && (
        <div className="mb-6 flex flex-col gap-3 rounded-2xl border border-dark-700 bg-dark-900 p-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-dark-100">Quản lý xóa world</h2>
              <p className="text-dark-400 text-sm">
                Chỉ Dev mới có quyền xóa world. Khi xóa, world sẽ bị xóa sau 3 phút.
              </p>
            </div>
            <button
              type="button"
              onClick={isDeletionScheduled ? undoWorldDeletion : handleDeleteClick}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${isDeletionScheduled ? 'bg-yellow-700 hover:bg-yellow-600 text-dark-950' : 'bg-red-800 hover:bg-red-700 text-white'}`}
            >
              {isDeletionScheduled ? 'Hoàn tác xóa world' : 'Xóa world'}
            </button>
          </div>
          {isDeletionScheduled && world?.deletion_scheduled_at && (
            <p className="text-dark-400 text-sm">
              World đã lên lịch xóa vào {formatVietnamTime(world.deletion_scheduled_at)} (giờ Việt Nam).
            </p>
          )}
        </div>
      )}

      {confirmDialog && currentDialogCopy && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirm-dialog-title"
            className="w-full max-w-md rounded-2xl bg-dark-950 border border-dark-700 p-6 shadow-xl"
          >
            <h3 id="confirm-dialog-title" className="text-xl font-semibold text-dark-100 mb-4">
              {currentDialogCopy.title}
            </h3>
            <p className="text-dark-400 mb-4">{currentDialogCopy.description}</p>
            {confirmDialog.itemLabel && confirmDialog.mode !== 'delete-world' && (
              <div className="max-h-40 overflow-y-auto rounded-xl border border-dark-700 bg-dark-900 p-3 text-sm text-dark-200 mb-4 whitespace-pre-wrap">
                {confirmDialog.itemLabel}
              </div>
            )}
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={cancelConfirmDialog}
                disabled={confirming}
                className="w-full sm:w-auto rounded-lg border border-dark-700 bg-dark-900 px-4 py-2 text-sm text-dark-200 hover:bg-dark-800 transition disabled:cursor-not-allowed disabled:opacity-60"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={confirmDialogAction}
                disabled={confirming}
                className="w-full sm:w-auto rounded-lg bg-red-800 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 transition disabled:cursor-not-allowed disabled:opacity-60"
              >
                {confirming ? 'Đang xử lý...' : currentDialogCopy.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-dark-900 rounded-xl p-1 border border-dark-700">
        {[
          { key: 'members', label: `Members (${pendingMembers.length})` },
          { key: 'posts', label: `Posts (${pendingPosts.length})` },
          { key: 'events', label: `Events (${proposedEvents.length})` },
        ].map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition ${tab === t.key ? 'bg-primary-600 text-white' : 'text-dark-400 hover:text-dark-200'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Pending Members */}
      {tab === 'members' && (
        <div>
          <h2 className="text-lg font-semibold text-dark-100 mb-4">
            Pending Member Requests
          </h2>
          {pendingMembers.length === 0 ? (
            <EmptyState
              title="No pending requests"
              description="New member requests will appear here for review."
            />
          ) : (
            <div className="space-y-3">
              {pendingMembers.map((member) => (
                <div
                  key={member.id}
                  className="bg-dark-900 border border-dark-700 rounded-xl p-4 flex flex-col sm:flex-row gap-3 sm:items-center justify-between"
                >
                  <div>
                    <span className="font-medium text-dark-200">
                      {member.display_name}
                    </span>
                    <span className="text-dark-500 text-sm ml-2">
                      @{member.username}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleMember(member.id, 'approved')}
                      className="bg-green-700 hover:bg-green-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition"
                    >
                      Approve
                    </button>
                    <button
                      type="button"
                      onClick={() => confirmRejectMember(member)}
                      className="bg-red-800 hover:bg-red-700 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Pending Posts */}
      {tab === 'posts' && (
        <div>
          <h2 className="text-lg font-semibold text-dark-100 mb-4">
            Pending Posts
          </h2>
          {pendingPosts.length === 0 ? (
            <EmptyState
              title="No pending posts"
              description="Posts waiting for approval will appear here."
            />
          ) : (
            <div className="space-y-3">
              {pendingPosts.map((post) => (
                <div
                  key={post.id}
                  className="bg-dark-900 border border-dark-700 rounded-xl p-4"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-medium text-dark-200">
                      {post.display_name}
                    </span>
                    <span className="text-dark-500 text-sm">
                      @{post.username}
                    </span>
                  </div>
                  <p className="text-dark-300 text-sm mb-3">{post.content}</p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => handlePost(post.id, 'approve')}
                      className="bg-green-700 hover:bg-green-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition"
                    >
                      Approve
                    </button>
                    <button
                      type="button"
                      onClick={() => confirmRejectPost(post)}
                      className="bg-red-800 hover:bg-red-700 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Proposed Events */}
      {tab === 'events' && (
        <div>
          <h2 className="text-lg font-semibold text-dark-100 mb-4">
            Proposed Small Events
          </h2>
          {proposedEvents.length === 0 ? (
            <EmptyState
              title="No event proposals"
              description="Member-submitted small event proposals will appear here."
            />
          ) : (
            <div className="space-y-3">
              {proposedEvents.map((event) => (
                <div
                  key={event.id}
                  className="bg-dark-900 border border-dark-700 rounded-xl p-4"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs bg-dark-700 text-dark-300 px-2 py-0.5 rounded-full">
                      SMALL EVENT PROPOSAL
                    </span>
                  </div>
                  <h3 className="font-semibold text-dark-100 mb-1">
                    {event.title}
                  </h3>
                  <p className="text-dark-400 text-sm mb-1">
                    {event.description}
                  </p>
                  <p className="text-dark-500 text-xs mb-3">
                    Proposed by {event.creator_display_name}
                  </p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleEvent(event.id, 'open')}
                      className="bg-green-700 hover:bg-green-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition"
                    >
                      Approve & Open
                    </button>
                    <button
                      type="button"
                      onClick={() => confirmRejectEvent(event)}
                      className="bg-red-800 hover:bg-red-700 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
