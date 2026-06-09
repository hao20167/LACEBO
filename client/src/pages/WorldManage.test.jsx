import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { describe, test, expect, vi, beforeEach } from 'vitest';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import WorldManage from './WorldManage';
import api from '../services/api.js';

vi.mock('../services/api.js');

const renderWorldManage = () => {
  return render(
    <BrowserRouter>
      <Routes>
        <Route path="/worlds/:id/manage" element={<WorldManage />} />
      </Routes>
    </BrowserRouter>,
  );
};

describe('WorldManage Page Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.history.pushState({}, 'Test', '/worlds/1/manage');
  });

  const mockEmptyManageData = (world = { id: 1 }) => {
    api.get.mockImplementation((url) => {
      if (url === '/worlds/1') return Promise.resolve({ data: world });
      return Promise.resolve({ data: [] });
    });
  };

  test('renders pending members', async () => {
    api.get.mockImplementation((url) => {
      if (url.includes('/members/pending'))
        return Promise.resolve({
          data: [
            {
              id: 10,
              user_id: 100,
              username: 'tester',
              display_name: 'Tester',
            },
          ],
        });
      return Promise.resolve({ data: [] });
    });

    renderWorldManage();

    const testerElements = await screen.findAllByText(/Tester/i);
    expect(testerElements[0]).toBeInTheDocument();
    expect(screen.getByText(/@tester/i)).toBeInTheDocument();
  });

  test('approves a member', async () => {
    api.get.mockImplementation((url) => {
      if (url.includes('/members/pending'))
        return Promise.resolve({
          data: [
            {
              id: 10,
              user_id: 100,
              username: 'tester',
              display_name: 'Tester',
            },
          ],
        });
      return Promise.resolve({ data: [] });
    });
    api.patch.mockResolvedValue({ data: { success: true } });

    renderWorldManage();

    const approveBtn = await screen.findByRole('button', { name: /Approve/i });
    fireEvent.click(approveBtn);

    await waitFor(() => {
      expect(api.patch).toHaveBeenCalledWith('/worlds/1/members/10', {
        status: 'approved',
      });
    });
    expect(screen.queryByText(/Tester/i)).not.toBeInTheDocument();
  });

  test('confirms before rejecting a member', async () => {
    api.get.mockImplementation((url) => {
      if (url.includes('/members/pending'))
        return Promise.resolve({
          data: [
            {
              id: 10,
              user_id: 100,
              username: 'tester',
              display_name: 'Tester',
            },
          ],
        });
      return Promise.resolve({ data: [] });
    });
    api.patch.mockResolvedValue({ data: { success: true } });

    renderWorldManage();

    const rejectBtn = await screen.findByRole('button', { name: /Reject/i });
    fireEvent.click(rejectBtn);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText(/Xác nhận từ chối thành viên/i)).toBeInTheDocument();
    expect(api.patch).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: /Từ chối/i }));

    await waitFor(() => {
      expect(api.patch).toHaveBeenCalledWith('/worlds/1/members/10', {
        status: 'rejected',
      });
    });
  });

  test('confirms before rejecting a post', async () => {
    api.get.mockImplementation((url) => {
      if (url.includes('/posts/world/'))
        return Promise.resolve({
          data: [
            {
              id: 20,
              username: 'poster',
              display_name: 'Poster',
              content: 'Pending post content',
            },
          ],
        });
      return Promise.resolve({ data: [] });
    });
    api.patch.mockResolvedValue({ data: { success: true } });

    renderWorldManage();

    fireEvent.click(await screen.findByRole('button', { name: /Posts/i }));
    fireEvent.click(await screen.findByRole('button', { name: /Reject/i }));

    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeInTheDocument();
    expect(within(dialog).getByText(/Xác nhận từ chối bài viết/i)).toBeInTheDocument();
    expect(within(dialog).getByText(/Pending post content/i)).toBeInTheDocument();
    expect(api.patch).not.toHaveBeenCalled();

    fireEvent.click(within(dialog).getByRole('button', { name: /Từ chối/i }));

    await waitFor(() => {
      expect(api.patch).toHaveBeenCalledWith('/posts/20/reject');
    });
  });

  test('confirms before scheduling world deletion', async () => {
    api.get.mockImplementation((url) => {
      if (url === '/worlds/1')
        return Promise.resolve({
          data: {
            id: 1,
            membership: { role: 'dev', status: 'approved' },
          },
        });
      return Promise.resolve({ data: [] });
    });
    api.post.mockResolvedValue({
      data: {
        id: 1,
        membership: { role: 'dev', status: 'approved' },
        deletion_scheduled_at: '2026-06-08 12:00:00',
      },
    });

    renderWorldManage();

    fireEvent.click(await screen.findByRole('button', { name: /Xóa world/i }));

    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeInTheDocument();
    expect(within(dialog).getByText(/Xác nhận xóa world/i)).toBeInTheDocument();
    expect(api.post).not.toHaveBeenCalled();

    fireEvent.click(within(dialog).getByRole('button', { name: /Xóa world/i }));

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/worlds/1/schedule-delete');
    });
  });

  test('renders empty states for members, posts, and events tabs', async () => {
    mockEmptyManageData();

    renderWorldManage();

    expect(await screen.findByText('No pending requests')).toBeInTheDocument();
    expect(
      screen.getByText('New member requests will appear here for review.'),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Posts/i }));
    expect(screen.getByText('No pending posts')).toBeInTheDocument();
    expect(
      screen.getByText('Posts waiting for approval will appear here.'),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Events/i }));
    expect(screen.getByText('No event proposals')).toBeInTheDocument();
    expect(
      screen.getByText(
        'Member-submitted small event proposals will appear here.',
      ),
    ).toBeInTheDocument();
  });

  test('cancels a reject member dialog without calling the API', async () => {
    api.get.mockImplementation((url) => {
      if (url.includes('/members/pending')) {
        return Promise.resolve({
          data: [
            {
              id: 10,
              user_id: 100,
              username: 'tester',
              display_name: 'Tester',
            },
          ],
        });
      }
      return Promise.resolve({ data: [] });
    });

    renderWorldManage();

    fireEvent.click(await screen.findByRole('button', { name: /Reject/i }));
    const dialog = screen.getByRole('dialog');

    fireEvent.click(within(dialog).getAllByRole('button')[0]);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(api.patch).not.toHaveBeenCalled();
    expect(screen.getAllByText(/Tester/i).length).toBeGreaterThan(0);
  });

  test('confirms before rejecting an event proposal', async () => {
    api.get.mockImplementation((url) => {
      if (url.includes('/events/world/')) {
        return Promise.resolve({
          data: [
            {
              id: 30,
              title: 'Festival proposal',
              description: 'A small gathering',
              creator_display_name: 'Player One',
            },
          ],
        });
      }
      return Promise.resolve({ data: [] });
    });
    api.patch.mockResolvedValue({ data: { success: true } });

    renderWorldManage();

    fireEvent.click(await screen.findByRole('button', { name: /Events/i }));
    fireEvent.click(await screen.findByRole('button', { name: /Reject/i }));

    const dialog = screen.getByRole('dialog');
    expect(within(dialog).getByText(/Festival proposal/i)).toBeInTheDocument();
    expect(api.patch).not.toHaveBeenCalled();

    fireEvent.click(within(dialog).getAllByRole('button').at(-1));

    await waitFor(() => {
      expect(api.patch).toHaveBeenCalledWith('/events/30', {
        status: 'rejected',
      });
    });
    expect(screen.queryByText(/Festival proposal/i)).not.toBeInTheDocument();
  });

  test('undoes scheduled world deletion without opening a dialog', async () => {
    mockEmptyManageData({
      id: 1,
      membership: { role: 'dev', status: 'approved' },
      deletion_scheduled_at: '2026-06-08 12:00:00',
    });
    api.post.mockResolvedValue({
      data: {
        id: 1,
        membership: { role: 'dev', status: 'approved' },
        deletion_scheduled_at: null,
      },
    });

    renderWorldManage();

    const undoButton = (await screen.findAllByRole('button')).find((button) =>
      button.textContent.includes('Ho'),
    );
    fireEvent.click(undoButton);

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/worlds/1/undo-delete');
    });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  test('shows an error message when scheduling deletion fails', async () => {
    mockEmptyManageData({
      id: 1,
      membership: { role: 'dev', status: 'approved' },
    });
    api.post.mockRejectedValue(new Error('Delete failed'));

    renderWorldManage();

    const deleteButton = (await screen.findAllByRole('button')).find(
      (button) => button.textContent === 'Xóa world',
    );
    fireEvent.click(deleteButton);
    fireEvent.click(within(screen.getByRole('dialog')).getAllByRole('button').at(-1));

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/worlds/1/schedule-delete');
    });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(
      screen.getByText((content) => content.includes('Vui')),
    ).toBeInTheDocument();
  });
});
