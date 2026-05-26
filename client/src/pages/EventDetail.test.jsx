import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, test, vi, beforeEach } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import EventDetail from './EventDetail';
import api from '../services/api.js';

// getApiErrorMessage là named export — phải mock tường minh cùng module
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

function setupApiMocks({ event = mockEvent, posts = [mockPost], comments = [] } = {}) {
  api.get.mockImplementation((url) => {
    if (url === '/events/1') return Promise.resolve({ data: event });
    if (url === '/posts/event/1') return Promise.resolve({ data: posts });
    if (/^\/posts\/\d+\/comments$/.test(url)) return Promise.resolve({ data: comments });
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

  test('displays loading state', () => {
    api.get.mockImplementation(() => new Promise(() => { }));
    renderEventDetail();
    expect(screen.getByText('Loading event...')).toBeInTheDocument();
  });

  test('displays error message when fetch fails', async () => {
    api.get.mockRejectedValue(new Error('Server error'));
    renderEventDetail();
    expect(await screen.findByText('Server error')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Back to worlds' })).toBeInTheDocument();
  });

  test('displays "Event not found" when event data is null', async () => {
    api.get.mockImplementation((url) => {
      if (url === '/events/1') return Promise.resolve({ data: null });
      return Promise.resolve({ data: [] });
    });
    renderEventDetail();
    expect(await screen.findByText('Event not found')).toBeInTheDocument();
  });

  test('displays event title', async () => {
    setupApiMocks();
    renderEventDetail();
    expect(await screen.findByText('Test Event')).toBeInTheDocument();
  });

  test('displays event description', async () => {
    setupApiMocks();
    renderEventDetail();
    expect(await screen.findByText('Demo description')).toBeInTheDocument();
  });

  test('displays "No description" when description is empty', async () => {
    setupApiMocks({ event: { ...mockEvent, description: '' } });
    renderEventDetail();
    expect(await screen.findByText('No description')).toBeInTheDocument();
  });

  test('displays SMALL EVENT badge', async () => {
    setupApiMocks();
    renderEventDetail();
    expect(await screen.findByText('SMALL EVENT')).toBeInTheDocument();
  });

  test('displays BIG EVENT badge', async () => {
    setupApiMocks({ event: { ...mockEvent, event_type: 'big' } });
    renderEventDetail();
    expect(await screen.findByText('BIG EVENT')).toBeInTheDocument();
  });

  test('displays status badge in uppercase', async () => {
    setupApiMocks();
    renderEventDetail();
    expect(await screen.findByText('OPEN')).toBeInTheDocument();
  });

  test('displays creator name', async () => {
    setupApiMocks();
    renderEventDetail();
    expect(await screen.findByText(/Creator User/)).toBeInTheDocument();
  });

  test('displays "Back to world" link with correct href', async () => {
    setupApiMocks();
    renderEventDetail();
    const link = await screen.findByRole('link', { name: 'Back to world' });
    expect(link).toHaveAttribute('href', '/worlds/2');
  });

  test('displays posts', async () => {
    setupApiMocks();
    renderEventDetail();
    expect(await screen.findByText('Hello world')).toBeInTheDocument();
  });

  test('displays post count', async () => {
    setupApiMocks();
    renderEventDetail();
    expect(await screen.findByText('1 posts')).toBeInTheDocument();
  });

  test('displays "No approved posts" when posts list is empty', async () => {
    setupApiMocks({ posts: [] });
    renderEventDetail();
    expect(
      await screen.findByText('No approved posts for this event yet.'),
    ).toBeInTheDocument();
  });

  test('displays post author display_name and username', async () => {
    setupApiMocks();
    renderEventDetail();
    expect(await screen.findByText('Post Author')).toBeInTheDocument();
    expect(screen.getByText(/@postauthor/)).toBeInTheDocument();
  });

  test('displays comment count on post', async () => {
    setupApiMocks();
    renderEventDetail();
    expect(await screen.findByText('2 comments')).toBeInTheDocument();
  });

  test('shows Create post section when event is open', async () => {
    setupApiMocks({ posts: [] });
    renderEventDetail();
    expect(await screen.findByText('Create post')).toBeInTheDocument();
  });

  test('hides Create post section when event is closed', async () => {
    setupApiMocks({ event: { ...mockEvent, status: 'closed' }, posts: [] });
    renderEventDetail();
    await screen.findByText('CLOSED');
    expect(screen.queryByText('Create post')).not.toBeInTheDocument();
  });

  test('Post button is disabled when textarea is empty', async () => {
    setupApiMocks({ posts: [] });
    renderEventDetail();
    expect(await screen.findByRole('button', { name: 'Post' })).toBeDisabled();
  });

  test('Post button becomes enabled when textarea has content', async () => {
    setupApiMocks({ posts: [] });
    renderEventDetail();
    const textarea = await screen.findByPlaceholderText('Write a post for this event...');
    await userEvent.type(textarea, 'Some content');
    expect(screen.getByRole('button', { name: 'Post' })).toBeEnabled();
  });

  test('shows "Post submitted" message when post is pending approval', async () => {
    setupApiMocks({ posts: [] });
    api.post.mockResolvedValue({ data: { id: 99, status: 'pending' } });
    renderEventDetail();

    const textarea = await screen.findByPlaceholderText('Write a post for this event...');
    await userEvent.type(textarea, 'Some content');
    fireEvent.click(screen.getByRole('button', { name: 'Post' }));

    await waitFor(() => {
      expect(
        screen.getByText('Post submitted and waiting for dev approval.'),
      ).toBeInTheDocument();
    });
  });

  test('shows "Post published" and refreshes posts when post is auto-approved', async () => {
    const approvedPost = { ...mockPost, id: 99, content: 'Approved content', status: 'approved' };

    let postsFetched = false;
    api.get.mockImplementation((url) => {
      if (url === '/events/1') return Promise.resolve({ data: mockEvent });
      if (url === '/posts/event/1') {
        if (!postsFetched) { postsFetched = true; return Promise.resolve({ data: [] }); }
        return Promise.resolve({ data: [approvedPost] });
      }
      if (/^\/posts\/\d+\/comments$/.test(url)) return Promise.resolve({ data: [] });
      return Promise.resolve({ data: [] });
    });
    api.post.mockResolvedValue({ data: approvedPost });

    renderEventDetail();
    const textarea = await screen.findByPlaceholderText('Write a post for this event...');
    await userEvent.type(textarea, 'Approved content');
    fireEvent.click(screen.getByRole('button', { name: 'Post' }));

    await waitFor(() => {
      expect(screen.getByText('Post published.')).toBeInTheDocument();
    });
    expect(await screen.findByText('Approved content')).toBeInTheDocument();
  });

  test('shows error message when post creation fails', async () => {
    setupApiMocks({ posts: [] });
    api.post.mockRejectedValue(new Error('Failed to create post'));
    renderEventDetail();

    const textarea = await screen.findByPlaceholderText('Write a post for this event...');
    await userEvent.type(textarea, 'Some content');
    fireEvent.click(screen.getByRole('button', { name: 'Post' }));

    await waitFor(() => {
      expect(screen.getByText('Failed to create post')).toBeInTheDocument();
    });
  });

  test('clears textarea after successful post submission', async () => {
    setupApiMocks({ posts: [] });
    api.post.mockResolvedValue({ data: { id: 99, status: 'pending' } });
    renderEventDetail();

    const textarea = await screen.findByPlaceholderText('Write a post for this event...');
    await userEvent.type(textarea, 'Some content');
    fireEvent.click(screen.getByRole('button', { name: 'Post' }));

    await waitFor(() => {
      expect(textarea).toHaveValue('');
    });
  });
});

// ─── LikeButton Component ────────────────────────────────────────────────────

describe('LikeButton Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('displays Like button when post not liked', async () => {
    setupApiMocks();
    renderEventDetail();
    expect(
      await screen.findByRole('button', { name: /Like \(5\)/ }),
    ).toBeInTheDocument();
  });

  test('displays Liked button when post is liked', async () => {
    setupApiMocks({ posts: [{ ...mockPost, liked: true }] });
    renderEventDetail();
    expect(
      await screen.findByRole('button', { name: /Liked \(5\)/ }),
    ).toBeInTheDocument();
  });

  test('optimistically updates to Liked (6) on click', async () => {
    setupApiMocks();
    api.post.mockResolvedValue({ data: { liked: true } });
    renderEventDetail();

    const likeButton = await screen.findByRole('button', { name: /Like \(5\)/ });
    fireEvent.click(likeButton);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Liked \(6\)/ })).toBeInTheDocument();
    });
  });

  test('keeps the optimistic like count in sync after unlike', async () => {
    setupApiMocks({ posts: [{ ...mockPost, liked: true, like_count: 1 }] });
    api.post.mockResolvedValue({ data: { liked: false } });
    renderEventDetail();

    expect(await screen.findByText(/Hello world/i)).toBeInTheDocument();

    const unlikeButton = screen.getByRole('button', { name: /Liked \(1\)/i });
    fireEvent.click(unlikeButton);

    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: /Like \(0\)/i }),
      ).toBeInTheDocument();
    });
  });

  test('reverts like state when API call fails', async () => {
    setupApiMocks();
    api.post.mockRejectedValue(new Error('Network error'));
    renderEventDetail();

    const likeButton = await screen.findByRole('button', { name: /Like \(5\)/ });
    fireEvent.click(likeButton);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Like \(5\)/ })).toBeInTheDocument();
    });
  });
});

// ─── Comments Component ───────────────────────────────────────────────────────

describe('Comments Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('displays "Loading comments..." while fetching', async () => {
    let resolveComments;
    api.get.mockImplementation((url) => {
      if (url === '/events/1') return Promise.resolve({ data: mockEvent });
      if (url === '/posts/event/1') return Promise.resolve({ data: [mockPost] });
      if (/^\/posts\/\d+\/comments$/.test(url))
        return new Promise((resolve) => { resolveComments = resolve; });
      return Promise.resolve({ data: [] });
    });

    renderEventDetail();
    expect(await screen.findByText('Loading comments...')).toBeInTheDocument();
    resolveComments({ data: [] }); // cleanup tránh warning act()
  });

  test('displays error and Retry button when comments fetch fails', async () => {
    api.get.mockImplementation((url) => {
      if (url === '/events/1') return Promise.resolve({ data: mockEvent });
      if (url === '/posts/event/1') return Promise.resolve({ data: [mockPost] });
      if (/^\/posts\/\d+\/comments$/.test(url))
        return Promise.reject(new Error('Failed to load comments'));
      return Promise.resolve({ data: [] });
    });

    renderEventDetail();
    expect(await screen.findByText('Failed to load comments')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument();
  });

  test('retries loading comments when Retry is clicked', async () => {
    let callCount = 0;
    api.get.mockImplementation((url) => {
      if (url === '/events/1') return Promise.resolve({ data: mockEvent });
      if (url === '/posts/event/1') return Promise.resolve({ data: [mockPost] });
      if (/^\/posts\/\d+\/comments$/.test(url)) {
        callCount += 1;
        if (callCount === 1) return Promise.reject(new Error('Failed to load comments'));
        return Promise.resolve({ data: [mockComment] });
      }
      return Promise.resolve({ data: [] });
    });

    renderEventDetail();
    fireEvent.click(await screen.findByRole('button', { name: 'Retry' }));
    expect(await screen.findByText('A comment')).toBeInTheDocument();
  });

  test('displays "No comments yet." when comment list is empty', async () => {
    setupApiMocks({ comments: [] });
    renderEventDetail();
    expect(await screen.findByText('No comments yet.')).toBeInTheDocument();
  });

  test('displays existing comments', async () => {
    setupApiMocks({ comments: [mockComment] });
    renderEventDetail();
    expect(await screen.findByText('A comment')).toBeInTheDocument();
  });

  test('displays comment author display_name and username', async () => {
    setupApiMocks({ comments: [mockComment] });
    renderEventDetail();
    expect(await screen.findByText('Commenter User')).toBeInTheDocument();
    expect(screen.getByText(/@commenter/)).toBeInTheDocument();
  });

  test('displays comment form for authenticated user', async () => {
    setupApiMocks();
    renderEventDetail();
    expect(
      await screen.findByPlaceholderText('Write a comment...'),
    ).toBeInTheDocument();
  });

  test('disables submit button when textarea is empty', async () => {
    setupApiMocks();
    renderEventDetail();
    const submitButton = await screen.findByRole('button', { name: 'Comment' });
    expect(submitButton).toBeDisabled();
  });

  test('enables submit button when textarea has content', async () => {
    setupApiMocks();
    renderEventDetail();
    const textarea = await screen.findByPlaceholderText('Write a comment...');
    await userEvent.type(textarea, 'Some comment');
    expect(screen.getByRole('button', { name: 'Comment' })).toBeEnabled();
  });

  test('shows "Commenting..." on button while submitting', async () => {
    setupApiMocks();
    api.post.mockImplementation(() => new Promise(() => { }));

    renderEventDetail();
    const textarea = await screen.findByPlaceholderText('Write a comment...');
    await userEvent.type(textarea, 'Great post!');
    fireEvent.click(screen.getByRole('button', { name: 'Comment' }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Commenting...' })).toBeInTheDocument();
    });
  });

  test('submits comment successfully and appends to list', async () => {
    const newComment = {
      id: 3,
      content: 'Great post!',
      username: 'tester',
      display_name: 'Tester',
      created_at: new Date().toISOString(),
    };

    setupApiMocks();
    api.post.mockResolvedValue({ data: newComment });

    renderEventDetail();
    const textarea = await screen.findByPlaceholderText('Write a comment...');
    await userEvent.type(textarea, 'Great post!');
    await userEvent.click(screen.getByRole('button', { name: 'Comment' }));

    await waitFor(() => {
      expect(screen.getByText('Great post!')).toBeInTheDocument();
    });
  });

  test('clears textarea after successful comment submission', async () => {
    const newComment = {
      id: 3,
      content: 'Great post!',
      username: 'tester',
      display_name: 'Tester',
      created_at: new Date().toISOString(),
    };

    setupApiMocks();
    api.post.mockResolvedValue({ data: newComment });

    renderEventDetail();
    const textarea = await screen.findByPlaceholderText('Write a comment...');
    await userEvent.type(textarea, 'Great post!');
    await userEvent.click(screen.getByRole('button', { name: 'Comment' }));

    await waitFor(() => {
      expect(textarea).toHaveValue('');
    });
  });

  test('increments comment_count on post after submitting', async () => {
    const newComment = {
      id: 3,
      content: 'Great post!',
      username: 'tester',
      display_name: 'Tester',
      created_at: new Date().toISOString(),
    };

    setupApiMocks({ posts: [{ ...mockPost, comment_count: 2 }] });
    api.post.mockResolvedValue({ data: newComment });

    renderEventDetail();
    await screen.findByText('2 comments');

    const textarea = await screen.findByPlaceholderText('Write a comment...');
    await userEvent.type(textarea, 'Great post!');
    await userEvent.click(screen.getByRole('button', { name: 'Comment' }));

    await waitFor(() => {
      expect(screen.getByText('3 comments')).toBeInTheDocument();
    });
  });

  test('shows error message when comment submission fails', async () => {
    setupApiMocks();
    api.post.mockRejectedValue(new Error('Failed to add comment'));

    renderEventDetail();
    const textarea = await screen.findByPlaceholderText('Write a comment...');
    await userEvent.type(textarea, 'Great post!');
    await userEvent.click(screen.getByRole('button', { name: 'Comment' }));

    await waitFor(() => {
      expect(screen.getByText('Failed to add comment')).toBeInTheDocument();
    });
  });
});
