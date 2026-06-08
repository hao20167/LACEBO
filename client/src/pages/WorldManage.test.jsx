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
});
