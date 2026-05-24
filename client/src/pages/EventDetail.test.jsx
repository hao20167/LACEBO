import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, expect, test, vi, beforeEach } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import EventDetail from './EventDetail';
import api from '../services/api.js';

vi.mock('../services/api.js');
vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({ user: { id: 1, username: 'tester' } }),
}));

describe('EventDetail', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('keeps the optimistic like count in sync after unlike', async () => {
    api.get.mockImplementation((url) => {
      if (url === '/events/1') {
        return Promise.resolve({
          data: {
            id: 1,
            world_id: 2,
            title: 'Test Event',
            description: 'Demo',
            event_type: 'small',
            status: 'open',
            creator_display_name: 'Dev',
          },
        });
      }

      if (url === '/posts/event/1') {
        return Promise.resolve({
          data: [
            {
              id: 10,
              content: 'Hello world',
              liked: true,
              like_count: 1,
              comment_count: 0,
              username: 'tester',
              display_name: 'Tester',
            },
          ],
        });
      }

      return Promise.resolve({ data: [] });
    });
    api.post.mockResolvedValue({ data: { liked: false } });

    render(
      <MemoryRouter initialEntries={['/events/1']}>
        <Routes>
          <Route path="/events/:eventId" element={<EventDetail />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(await screen.findByText(/Hello world/i)).toBeInTheDocument();

    const unlikeButton = screen.getByRole('button', { name: /Liked \(1\)/i });
    fireEvent.click(unlikeButton);

    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: /Like \(0\)/i }),
      ).toBeInTheDocument();
    });
  });
});
