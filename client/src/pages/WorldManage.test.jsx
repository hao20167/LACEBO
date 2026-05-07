import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, test, expect, vi, beforeEach } from 'vitest';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import WorldManage from './WorldManage';
import api from '../api';

vi.mock('../api');

const renderWorldManage = (id = "1") => {
  return render(
    <BrowserRouter>
      <Routes>
        <Route path="/worlds/:id/manage" element={<WorldManage />} />
      </Routes>
    </BrowserRouter>
  );
};

describe('WorldManage Page Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.history.pushState({}, 'Test', '/worlds/1/manage');
  });

  test('renders pending members', async () => {
    api.get.mockImplementation((url) => {
      if (url.includes('/members/pending')) return Promise.resolve({ data: [{ id: 10, user_id: 100, username: 'tester', display_name: 'Tester' }] });
      return Promise.resolve({ data: [] });
    });

    renderWorldManage();

    const testerElements = await screen.findAllByText(/Tester/i);
    expect(testerElements[0]).toBeInTheDocument();
    expect(screen.getByText(/@tester/i)).toBeInTheDocument();
  });

  test('approves a member', async () => {
    api.get.mockImplementation((url) => {
      if (url.includes('/members/pending')) return Promise.resolve({ data: [{ id: 10, user_id: 100, username: 'tester', display_name: 'Tester' }] });
      return Promise.resolve({ data: [] });
    });
    api.patch.mockResolvedValue({ data: { success: true } });

    renderWorldManage();

    const approveBtn = await screen.findByRole('button', { name: /Approve/i });
    fireEvent.click(approveBtn);

    await waitFor(() => {
      expect(api.patch).toHaveBeenCalledWith('/worlds/1/members/10', { status: 'approved' });
    });
    expect(screen.queryByText(/Tester/i)).not.toBeInTheDocument();
  });
});
