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
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({ user: { id: 1, username: 'tester' } }),
}));

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
};

const mockPost = {
  id: 10,
  event_id: 1,
  world_id: 2,
  user_id: 1,
  content: 'Hello world',
  liked: false,
  like_count: 5,
  comment_count: 2,
  can_delete: true,
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

function setupApiMocks({
  event = mockEvent,
  posts = [mockPost],
  comments = [],
} = {}) {
  api.get.mockImplementation((url) => {
    if (url === '/events/1') return Promise.resolve({ data: event });
    if (url === '/posts/event/1') return Promise.resolve({ data: posts });
    if (/^\/posts\/\d+\/comments$/.test(url)) {
      return Promise.resolve({ data: comments });
    }
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

describe('EventDetail', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('renders loading and not found states', async () => {
    api.get.mockImplementation(() => new Promise(() => {}));
    const { unmount } = renderEventDetail();
    expect(screen.getByTestId('skeleton-loader')).toBeInTheDocument();
    unmount();

    api.get.mockImplementation((url) => {
      if (url === '/events/1') return Promise.resolve({ data: null });
      return Promise.resolve({ data: [] });
    });
    renderEventDetail();

    expect(await screen.findByText('Event not found')).toBeInTheDocument();
  });

  test('renders event details and posts', async () => {
    setupApiMocks();
    renderEventDetail();

    expect(await screen.findByText('Test Event')).toBeInTheDocument();
    expect(screen.getByText('Demo description')).toBeInTheDocument();
    expect(screen.getByText('SMALL EVENT')).toBeInTheDocument();
    expect(screen.getByText('OPEN')).toBeInTheDocument();
    expect(screen.getByText(/Creator User/)).toBeInTheDocument();
    expect(screen.getByText('Hello world')).toBeInTheDocument();
    expect(screen.getByText('Post Author')).toBeInTheDocument();
    expect(screen.getByText(/@postauthor/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /5/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /2/ })).toBeInTheDocument();
  });

  test('renders empty state when there are no approved posts', async () => {
    setupApiMocks({ posts: [] });
    renderEventDetail();

    expect(
      await screen.findByText('No posts yet. Be the first to post!'),
    ).toBeInTheDocument();
    expect(screen.getByText('Be the first to post.')).toBeInTheDocument();
  });

  test('hides post composer for closed events', async () => {
    setupApiMocks({ event: { ...mockEvent, status: 'closed' }, posts: [] });
    renderEventDetail();

    expect(await screen.findByText('CLOSED')).toBeInTheDocument();
    expect(screen.queryByPlaceholderText(/Share your thoughts/)).not.toBeInTheDocument();
    expect(screen.getByText('This event is closed. You can still view the posts.')).toBeInTheDocument();
  });

  test('creates a post and refreshes the list', async () => {
    let postFetchCount = 0;
    api.get.mockImplementation((url) => {
      if (url === '/events/1') return Promise.resolve({ data: mockEvent });
      if (url === '/posts/event/1') {
        postFetchCount += 1;
        return Promise.resolve({
          data: postFetchCount === 1 ? [] : [{ ...mockPost, content: 'Fresh post' }],
        });
      }
      return Promise.resolve({ data: [] });
    });
    api.post.mockResolvedValue({ data: { id: 99 } });

    renderEventDetail();
    const textarea = await screen.findByPlaceholderText('Share your thoughts about this event...');
    await userEvent.type(textarea, 'Fresh post');
    fireEvent.click(screen.getByRole('button', { name: 'Post' }));

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/posts/event/1', {
        content: 'Fresh post',
      });
    });
    expect(await screen.findByText('Fresh post')).toBeInTheDocument();
    expect(textarea).toHaveValue('');
  });

  test('edits an owned post and updates the rendered content', async () => {
    setupApiMocks();
    api.patch.mockResolvedValue({ data: { ...mockPost, content: 'Updated post' } });
    renderEventDetail();

    await screen.findByText('Hello world');
    fireEvent.click(screen.getByRole('button', { name: '...' }));
    fireEvent.click(screen.getAllByRole('button').find((button) => button.textContent.includes('S')));

    const editor = screen.getByDisplayValue('Hello world');
    await userEvent.clear(editor);
    await userEvent.type(editor, 'Updated post');
    fireEvent.click(screen.getAllByRole('button').find((button) => button.textContent.includes('L')));

    await waitFor(() => {
      expect(api.patch).toHaveBeenCalledWith('/posts/10', {
        content: 'Updated post',
      });
    });
    expect(screen.getByText('Updated post')).toBeInTheDocument();
    expect(screen.queryByDisplayValue('Updated post')).not.toBeInTheDocument();
  });

  test('cancels editing without calling the API', async () => {
    setupApiMocks();
    renderEventDetail();

    await screen.findByText('Hello world');
    fireEvent.click(screen.getByRole('button', { name: '...' }));
    fireEvent.click(screen.getAllByRole('button').find((button) => button.textContent.includes('S')));

    const editor = screen.getByDisplayValue('Hello world');
    await userEvent.clear(editor);
    await userEvent.type(editor, 'Discarded post');
    fireEvent.click(screen.getAllByRole('button').find((button) => button.textContent.includes('H')));

    expect(api.patch).not.toHaveBeenCalled();
    expect(screen.getByText('Hello world')).toBeInTheDocument();
    expect(screen.queryByText('Discarded post')).not.toBeInTheDocument();
  });

  test('confirms before deleting a post and removes it after success', async () => {
    setupApiMocks();
    api.delete.mockResolvedValue({ data: { success: true } });
    renderEventDetail();

    await screen.findByText('Hello world');
    fireEvent.click(screen.getByRole('button', { name: '...' }));
    fireEvent.click(screen.getAllByRole('button').find((button) => button.textContent.includes('X')));

    expect(screen.getAllByText('Hello world')).toHaveLength(2);
    expect(api.delete).not.toHaveBeenCalled();

    fireEvent.click(screen.getAllByRole('button').at(-1));

    await waitFor(() => {
      expect(api.delete).toHaveBeenCalledWith('/posts/10');
    });
    expect(screen.queryByText('Hello world')).not.toBeInTheDocument();
    expect(
      screen.getByText('No approved posts for this event yet.'),
    ).toBeInTheDocument();
  });

  test('cancels delete dialog without calling the API', async () => {
    setupApiMocks();
    renderEventDetail();

    await screen.findByText('Hello world');
    fireEvent.click(screen.getByRole('button', { name: '...' }));
    fireEvent.click(screen.getAllByRole('button').find((button) => button.textContent.includes('X')));

    fireEvent.click(screen.getAllByRole('button').at(-2));

    expect(api.delete).not.toHaveBeenCalled();
    expect(screen.getAllByText('Hello world')).toHaveLength(1);
  });

  test('loads comments, renders empty comment state, and adds a comment', async () => {
    setupApiMocks({ comments: [] });
    api.post.mockResolvedValue({ data: mockComment });
    renderEventDetail();

    fireEvent.click(await screen.findByRole('button', { name: /2/ }));
    expect(await screen.findByText('No comments yet.')).toBeInTheDocument();

    const commentInput = screen.getByPlaceholderText('Write a comment...');
    await userEvent.type(commentInput, 'A comment');
    fireEvent.click(screen.getByRole('button', { name: 'Send' }));

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/posts/10/comments', {
        content: 'A comment',
      });
    });
    expect(screen.getByText('Commenter User')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /3/ })).toBeInTheDocument();
  });

  test('toggles like state from the API response', async () => {
    setupApiMocks();
    api.post.mockResolvedValue({ data: { liked: true } });
    renderEventDetail();

    fireEvent.click(await screen.findByRole('button', { name: /5/ }));

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/posts/10/like');
    });
    expect(screen.getByRole('button', { name: /6/ })).toBeInTheDocument();
  });
});
