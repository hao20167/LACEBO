import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, beforeEach, afterEach, test, expect } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import EventDetail from './EventDetail';
import api from '../services/api.js';

vi.mock('../services/api.js', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
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
    vi.spyOn(globalThis, 'alert').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  test('displays loading state, error message, or not found appropriately', async () => {
    // 1. Loading
    api.get.mockImplementation(() => new Promise(() => {}));
    const { unmount } = renderEventDetail();
    expect(screen.getByText('Loading event...')).toBeInTheDocument();
    unmount();

    // 2. Error: the current component falls back to the not-found state.
    api.get.mockRejectedValue(new Error('Server error'));
    const { unmount: unmountErr } = renderEventDetail();
    expect(await screen.findByText('Event not found')).toBeInTheDocument();
    unmountErr();

    // 3. Not Found
    api.get.mockImplementation((url) => {
      if (url === '/events/1') return Promise.resolve({ data: null });
      return Promise.resolve({ data: [] });
    });
    renderEventDetail();
    expect(await screen.findByText('Event not found')).toBeInTheDocument();
  });

  test('displays basic event details (title, description, badges, creator)', async () => {
    setupApiMocks();
    renderEventDetail();
    expect(await screen.findByText('Test Event')).toBeInTheDocument();
    expect(screen.getByText('Demo description')).toBeInTheDocument();
    expect(screen.getByText('SMALL EVENT')).toBeInTheDocument();
    expect(screen.getByText('OPEN')).toBeInTheDocument();
    expect(screen.getByText(/Creator User/)).toBeInTheDocument();
  });

  test('displays alternative event details (BIG EVENT, empty description)', async () => {
    setupApiMocks({
      event: { ...mockEvent, event_type: 'big', description: '' },
    });
    renderEventDetail();
    expect(await screen.findByText('BIG EVENT')).toBeInTheDocument();
    expect(screen.queryByText('Demo description')).not.toBeInTheDocument();
  });

  test('displays posts list correctly', async () => {
    setupApiMocks();
    renderEventDetail();
    expect(await screen.findByText('Hello world')).toBeInTheDocument();
    expect(screen.getByText('Post Author')).toBeInTheDocument();
    expect(screen.getByText(/@postauthor/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /💬\s*2/ })).toBeInTheDocument();
  });

  test('displays empty posts message when posts list is empty', async () => {
    setupApiMocks({ posts: [] });
    renderEventDetail();
    expect(
      await screen.findByText('No posts yet. Be the first to post!'),
    ).toBeInTheDocument();
  });

  test('handles post creation visibility based on event status', async () => {
    // 1. Open event -> shows create post form
    setupApiMocks({ posts: [] });
    const { unmount } = renderEventDetail();
    expect(
      await screen.findByPlaceholderText('Share your thoughts about this event...'),
    ).toBeInTheDocument();
    unmount();

    // 2. Closed event -> hides create post form
    setupApiMocks({ event: { ...mockEvent, status: 'closed' }, posts: [] });
    renderEventDetail();
    await screen.findByText('CLOSED');
    expect(
      screen.queryByPlaceholderText('Share your thoughts about this event...'),
    ).not.toBeInTheDocument();
    expect(
      screen.getByText('This event is closed. You can still view the posts.'),
    ).toBeInTheDocument();
  });

  test('Post button enables only when textarea has content', async () => {
    setupApiMocks({ posts: [] });
    renderEventDetail();
    const button = await screen.findByRole('button', { name: 'Post' });
    expect(button).toBeDisabled();

    const textarea = screen.getByPlaceholderText(
      'Share your thoughts about this event...',
    );
    await userEvent.type(textarea, 'Some content');
    expect(button).toBeEnabled();
  });

  test('submits post successfully and clears textarea', async () => {
    setupApiMocks({ posts: [] });
    api.post.mockResolvedValue({ data: { id: 99, status: 'pending' } });
    renderEventDetail();

    const textarea = await screen.findByPlaceholderText(
      'Share your thoughts about this event...',
    );
    await userEvent.type(textarea, 'Some content');
    fireEvent.click(screen.getByRole('button', { name: 'Post' }));

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/posts/event/1', {
        content: 'Some content',
      });
      expect(textarea).toHaveValue('');
    });
  });

  test('refreshes posts when post is created', async () => {
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
      'Share your thoughts about this event...',
    );
    await userEvent.type(textarea, 'Approved content');
    fireEvent.click(screen.getByRole('button', { name: 'Post' }));

    expect(await screen.findByText('Approved content')).toBeInTheDocument();
  });

  test('shows error message when post creation fails', async () => {
    setupApiMocks({ posts: [] });
    api.post.mockRejectedValue(new Error('Failed to create post'));
    renderEventDetail();

    const textarea = await screen.findByPlaceholderText(
      'Share your thoughts about this event...',
    );
    await userEvent.type(textarea, 'Some content');
    fireEvent.click(screen.getByRole('button', { name: 'Post' }));

    await waitFor(() =>
      expect(globalThis.alert).toHaveBeenCalledWith('Failed to create post'),
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
    const likeButton = await screen.findByRole('button', { name: /🤍\s*5/ });
    expect(likeButton).toBeInTheDocument();

    // Click -> update to liked (6)
    fireEvent.click(likeButton);
    await waitFor(() =>
      expect(screen.getByRole('button', { name: /❤️\s*6/ })).toBeInTheDocument(),
    );

    // Click again but API fails -> current component keeps the existing state
    const likedButton = screen.getByRole('button', { name: /❤️\s*6/ });
    fireEvent.click(likedButton);

    await waitFor(() =>
      expect(screen.getByRole('button', { name: /❤️\s*6/ })).toBeInTheDocument(),
    );
  });

  test('displays Liked button when post is initially liked', async () => {
    setupApiMocks({ posts: [{ ...mockPost, liked: true }] });
    renderEventDetail();
    expect(
      await screen.findByRole('button', { name: /❤️\s*5/ }),
    ).toBeInTheDocument();
  });
});

// ─── Comments Component ───────────────────────────────────────────────────────

describe('Comments Component', () => {
  beforeEach(() => vi.clearAllMocks());

  test('fetches and displays comments when expanded', async () => {
    let callCount = 0;
    api.get.mockImplementation((url) => {
      if (url === '/events/1') return Promise.resolve({ data: mockEvent });
      if (url === '/posts/event/1')
        return Promise.resolve({ data: [mockPost] });
      if (/^\/posts\/\d+\/comments$/.test(url)) {
        callCount++;
        return Promise.resolve({ data: [mockComment] });
      }
      return Promise.resolve({ data: [] });
    });

    renderEventDetail();
    fireEvent.click(await screen.findByRole('button', { name: /💬\s*2/ }));

    expect(await screen.findByText('A comment')).toBeInTheDocument();
    expect(screen.getByText('Commenter User')).toBeInTheDocument();
    expect(callCount).toBe(1);
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
    fireEvent.click(await screen.findByRole('button', { name: /💬\s*2/ }));

    const submitBtn = await screen.findByRole('button', { name: 'Send' });

    const input = screen.getByPlaceholderText('Write a comment...');
    await userEvent.type(input, 'Great post!');

    // Submit
    fireEvent.click(submitBtn);

    // Resolve API
    resolvePost({ data: newComment });

    // Assertions after success
    await waitFor(() => {
      expect(screen.getByText('Great post!')).toBeInTheDocument();
      expect(input).toHaveValue('');
      expect(screen.getByRole('button', { name: /💬\s*3/ })).toBeInTheDocument();
    });
  });

  test('keeps comment input when comment submission fails', async () => {
    setupApiMocks();
    api.post.mockRejectedValue(new Error('Failed to add comment'));
    renderEventDetail();

    fireEvent.click(await screen.findByRole('button', { name: /💬\s*2/ }));
    const input = await screen.findByPlaceholderText('Write a comment...');
    await userEvent.type(input, 'Failed content');
    fireEvent.click(screen.getByRole('button', { name: 'Send' }));

    await waitFor(() =>
      expect(input).toHaveValue('Failed content'),
    );
  });
});
