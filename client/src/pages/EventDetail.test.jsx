import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, beforeEach, test, expect } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import EventDetail from './EventDetail';
import api from '../services/api.js';

vi.mock('../services/api.js', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
  getApiErrorMessage: vi.fn((err, fallback) => err?.message || fallback),
}));

vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({ user: { id: 1, username: 'tester' } }),
}));

// ─── Mock data ───────────────────────────────────────────────────────────────

const mockEvent = {
  id: 1,
  world_id: 2,
  title: 'Test Event',
  description: 'Demo description',
  event_type: 'small',
  status: 'open',
  start_date: '2024-06-01',
  end_date: '2024-06-02',
  creator_display_name: 'Creator User',
  creator_name: 'creator',
};

const mockPost = {
  id: 10,
  content: 'Hello world',
  liked: false,
  like_count: 5,
  comment_count: 2,
  username: 'postauthor',
  display_name: 'Post Author',
  created_at: '2024-05-26T10:00:00Z',
};

const mockComment = {
  id: 20,
  content: 'A comment',
  username: 'commenter',
  display_name: 'Commenter User',
  created_at: '2024-05-26T11:00:00Z',
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function setupApiMocks({
  event = mockEvent,
  posts = [mockPost],
  comments = [],
} = {}) {
  api.get.mockImplementation((url) => {
    if (url === '/events/1') return Promise.resolve({ data: event });
    if (url === '/posts/event/1') return Promise.resolve({ data: posts });
    if (/^\/posts\/\d+\/comments$/.test(url))
      return Promise.resolve({ data: comments });
    return Promise.resolve({ data: [] });
  });
}

function renderEventDetail() {
  return render(
    <MemoryRouter initialEntries={['/events/1']}>
      <Routes>
        <Route path="/events/:eventId" element={<EventDetail />} />
      </Routes>
    </MemoryRouter>,
  );
}

// ─── EventDetail Component ───────────────────────────────────────────────────

describe('EventDetail Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('displays loading state, error message, or not found appropriately', async () => {
    // 1. Loading
    api.get.mockImplementation(() => new Promise(() => {}));
    const { unmount } = renderEventDetail();
    expect(screen.getByText('Loading event...')).toBeInTheDocument();
    unmount();

    // 2. Error
    api.get.mockRejectedValue(new Error('Server error'));
    const { unmount: unmountErr } = renderEventDetail();
    expect(await screen.findByText('Server error')).toBeInTheDocument();
    unmountErr();

    // 3. Not Found
    api.get.mockImplementation((url) => {
      if (url === '/events/1') return Promise.resolve({ data: null });
      return Promise.resolve({ data: [] });
    });
    renderEventDetail();
    expect(await screen.findByText('Event not found')).toBeInTheDocument();
  });

  test('displays basic event details (title, description, badges, creator, link)', async () => {
    setupApiMocks();
    renderEventDetail();
    expect(await screen.findByText('Test Event')).toBeInTheDocument();
    expect(screen.getByText('Demo description')).toBeInTheDocument();
    expect(screen.getByText('SMALL EVENT')).toBeInTheDocument();
    expect(screen.getByText('OPEN')).toBeInTheDocument();
    expect(screen.getByText(/Creator User/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Back to world' })).toHaveAttribute(
      'href',
      '/worlds/2',
    );
  });

  test('displays alternative event details (BIG EVENT, empty description)', async () => {
    setupApiMocks({
      event: { ...mockEvent, event_type: 'big', description: '' },
    });
    renderEventDetail();
    expect(await screen.findByText('BIG EVENT')).toBeInTheDocument();
    expect(screen.getByText('No description')).toBeInTheDocument();
  });

  test('displays posts list correctly', async () => {
    setupApiMocks();
    renderEventDetail();
    expect(await screen.findByText('Hello world')).toBeInTheDocument();
    expect(screen.getByText('1 posts')).toBeInTheDocument();
    expect(screen.getByText('Post Author')).toBeInTheDocument();
    expect(screen.getByText(/@postauthor/)).toBeInTheDocument();
    expect(screen.getByText('2 comments')).toBeInTheDocument();
  });

  test('displays "No approved posts" when posts list is empty', async () => {
    setupApiMocks({ posts: [] });
    renderEventDetail();
    expect(
      await screen.findByText('No approved posts for this event yet.'),
    ).toBeInTheDocument();
  });

  test('handles post creation visibility based on event status', async () => {
    // 1. Open event -> shows Create post
    setupApiMocks({ posts: [] });
    const { unmount } = renderEventDetail();
    expect(await screen.findByText('Create post')).toBeInTheDocument();
    unmount();

    // 2. Closed event -> hides Create post
    setupApiMocks({ event: { ...mockEvent, status: 'closed' }, posts: [] });
    renderEventDetail();
    await screen.findByText('CLOSED');
    expect(screen.queryByText('Create post')).not.toBeInTheDocument();
  });

  test('Post button enables only when textarea has content', async () => {
    setupApiMocks({ posts: [] });
    renderEventDetail();
    const button = await screen.findByRole('button', { name: 'Post' });
    expect(button).toBeDisabled();

    const textarea = screen.getByPlaceholderText(
      'Write a post for this event...',
    );
    await userEvent.type(textarea, 'Some content');
    expect(button).toBeEnabled();
  });

  test('submits post successfully and clears textarea when pending', async () => {
    setupApiMocks({ posts: [] });
    api.post.mockResolvedValue({ data: { id: 99, status: 'pending' } });
    renderEventDetail();

    const textarea = await screen.findByPlaceholderText(
      'Write a post for this event...',
    );
    await userEvent.type(textarea, 'Some content');
    fireEvent.click(screen.getByRole('button', { name: 'Post' }));

    await waitFor(() => {
      expect(
        screen.getByText('Post submitted and waiting for dev approval.'),
      ).toBeInTheDocument();
      expect(textarea).toHaveValue('');
    });
  });

  test('shows "Post published" and refreshes posts when post is auto-approved', async () => {
    const approvedPost = {
      ...mockPost,
      id: 99,
      content: 'Approved content',
      status: 'approved',
    };
    let postsFetched = false;
    api.get.mockImplementation((url) => {
      if (url === '/events/1') return Promise.resolve({ data: mockEvent });
      if (url === '/posts/event/1') {
        if (!postsFetched) {
          postsFetched = true;
          return Promise.resolve({ data: [] });
        }
        return Promise.resolve({ data: [approvedPost] });
      }
      if (/^\/posts\/\d+\/comments$/.test(url))
        return Promise.resolve({ data: [] });
      return Promise.resolve({ data: [] });
    });
    api.post.mockResolvedValue({ data: approvedPost });

    renderEventDetail();
    const textarea = await screen.findByPlaceholderText(
      'Write a post for this event...',
    );
    await userEvent.type(textarea, 'Approved content');
    fireEvent.click(screen.getByRole('button', { name: 'Post' }));

    await waitFor(() =>
      expect(screen.getByText('Post published.')).toBeInTheDocument(),
    );
    expect(await screen.findByText('Approved content')).toBeInTheDocument();
  });

  test('shows error message when post creation fails', async () => {
    setupApiMocks({ posts: [] });
    api.post.mockRejectedValue(new Error('Failed to create post'));
    renderEventDetail();

    const textarea = await screen.findByPlaceholderText(
      'Write a post for this event...',
    );
    await userEvent.type(textarea, 'Some content');
    fireEvent.click(screen.getByRole('button', { name: 'Post' }));

    await waitFor(() =>
      expect(screen.getByText('Failed to create post')).toBeInTheDocument(),
    );
  });
});

// ─── LikeButton Component ────────────────────────────────────────────────────

describe('LikeButton Component', () => {
  beforeEach(() => vi.clearAllMocks());

  test('handles like state correctly (display, optimistic update, error revert)', async () => {
    // Initial display not liked
    setupApiMocks();
    api.post
      .mockResolvedValueOnce({ data: { liked: true } }) // First click success
      .mockRejectedValueOnce(new Error('Network error')); // Second click fail

    renderEventDetail();

    // Check initial
    const likeButton = await screen.findByRole('button', {
      name: /Like \(5\)/,
    });
    expect(likeButton).toBeInTheDocument();

    // Click -> Optimistic update to Liked (6)
    fireEvent.click(likeButton);
    await waitFor(() =>
      expect(
        screen.getByRole('button', { name: /Liked \(6\)/ }),
      ).toBeInTheDocument(),
    );

    // Click again but API fails -> Reverts back to initial state (liked: false) via fetchEventData
    const likedButton = screen.getByRole('button', { name: /Liked \(6\)/ });
    fireEvent.click(likedButton);

    await waitFor(() =>
      expect(
        screen.getByRole('button', { name: /Like \(5\)/ }),
      ).toBeInTheDocument(),
    );
  });

  test('displays Liked button when post is initially liked', async () => {
    setupApiMocks({ posts: [{ ...mockPost, liked: true }] });
    renderEventDetail();
    expect(
      await screen.findByRole('button', { name: /Liked \(5\)/ }),
    ).toBeInTheDocument();
  });
});

// ─── Comments Component ───────────────────────────────────────────────────────

describe('Comments Component', () => {
  beforeEach(() => vi.clearAllMocks());

  test('handles comment fetching states (loading, error, retry, empty, loaded)', async () => {
    // 1. Loading & Error
    let callCount = 0;
    let resolveComments;
    api.get.mockImplementation((url) => {
      if (url === '/events/1') return Promise.resolve({ data: mockEvent });
      if (url === '/posts/event/1')
        return Promise.resolve({ data: [mockPost] });
      if (/^\/posts\/\d+\/comments$/.test(url)) {
        callCount++;
        if (callCount === 1)
          return new Promise((resolve, reject) => {
            resolveComments = reject;
          });
        if (callCount === 2) return Promise.resolve({ data: [] }); // empty
        return Promise.resolve({ data: [mockComment] }); // loaded
      }
      return Promise.resolve({ data: [] });
    });

    const { unmount } = renderEventDetail();
    expect(await screen.findByText('Loading comments...')).toBeInTheDocument();

    resolveComments(new Error('Failed to load comments'));
    expect(
      await screen.findByText('Failed to load comments'),
    ).toBeInTheDocument();

    // 2. Retry -> Empty
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(await screen.findByText('No comments yet.')).toBeInTheDocument();
    unmount();

    // 3. Loaded Comments Display
    renderEventDetail();
    expect(await screen.findByText('A comment')).toBeInTheDocument();
    expect(screen.getByText('Commenter User')).toBeInTheDocument();
    expect(screen.getByText(/@commenter/)).toBeInTheDocument();
  });

  test('comment form input enables button and submits properly', async () => {
    const newComment = {
      id: 3,
      content: 'Great post!',
      username: 'tester',
      display_name: 'Tester',
      created_at: new Date().toISOString(),
    };
    setupApiMocks({ posts: [{ ...mockPost, comment_count: 2 }] });

    let resolvePost;
    api.post.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolvePost = resolve;
        }),
    );

    renderEventDetail();
    await screen.findByText('2 comments'); // Initial count

    const submitBtn = screen.getByRole('button', { name: 'Comment' });
    expect(submitBtn).toBeDisabled();

    const textarea = screen.getByPlaceholderText('Write a comment...');
    await userEvent.type(textarea, 'Great post!');
    expect(submitBtn).toBeEnabled();

    // Submit
    fireEvent.click(submitBtn);
    expect(
      screen.getByRole('button', { name: 'Commenting...' }),
    ).toBeInTheDocument();

    // Resolve API
    resolvePost({ data: newComment });

    // Assertions after success
    await waitFor(() => {
      expect(screen.getByText('Great post!')).toBeInTheDocument();
      expect(textarea).toHaveValue('');
      expect(screen.getByText('3 comments')).toBeInTheDocument();
    });
  });

  test('shows error message when comment submission fails', async () => {
    setupApiMocks();
    api.post.mockRejectedValue(new Error('Failed to add comment'));
    renderEventDetail();

    const textarea = await screen.findByPlaceholderText('Write a comment...');
    await userEvent.type(textarea, 'Failed content');
    fireEvent.click(screen.getByRole('button', { name: 'Comment' }));

    await waitFor(() =>
      expect(screen.getByText('Failed to add comment')).toBeInTheDocument(),
    );
  });
});
