import { render, screen, waitFor, act } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { vi } from 'vitest';
import WorldDetail from './WorldDetail.jsx';
import api from '../services/api.js';

// Mock the api module
vi.mock('../services/api.js', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
  getApiCollection: vi.fn((payload) =>
    Array.isArray(payload) ? payload : payload?.data || [],
  ),
  getApiAssetUrl: vi.fn((path) => path),
}));

// Mock the AuthContext
vi.mock('../contexts/AuthContext.jsx', () => ({
  useAuth: () => ({
    user: { id: 1, username: 'testuser' },
  }),
}));

const mockWorld = {
  id: 1,
  title: 'Magic Kingdom',
  description: 'A kingdom of wonders',
  member_count: 5,
  membership: { role: 'member', status: 'approved', credits: 100 },
};

const renderWorldDetail = () => {
  return render(
    <MemoryRouter initialEntries={['/worlds/1']}>
      <Routes>
        <Route path="/worlds/:id" element={<WorldDetail />} />
      </Routes>
    </MemoryRouter>,
  );
};

describe('WorldDetail Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading state initially with skeleton', async () => {
    api.get.mockImplementation(() => new Promise(() => {}));

    await act(async () => {
      renderWorldDetail();
    });

    expect(screen.getByTestId('skeleton-loader')).toBeInTheDocument();
  });

  it('fetches and displays world detail content on successful fetch', async () => {
    api.get.mockImplementation((url) => {
      if (url === '/worlds/1') return Promise.resolve({ data: mockWorld });
      if (url === '/events/world/1') return Promise.resolve({ data: [] });
      if (url === '/posts/world/1/announcements')
        return Promise.resolve({ data: [] });
      if (url === '/worlds/1/leaderboard') return Promise.resolve({ data: [] });
      return Promise.resolve({ data: null });
    });

    await act(async () => {
      renderWorldDetail();
    });

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith('/worlds/1');
    });

    expect(screen.queryByTestId('skeleton-loader')).not.toBeInTheDocument();
    expect(screen.getByText('Magic Kingdom')).toBeInTheDocument();
    expect(screen.getByText('A kingdom of wonders')).toBeInTheDocument();
    // Members: render as label "Members" + value "5" in separate spans
    expect(screen.getByText('Members')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
    // Credits: render as "⭐ 100" in one span (no "credits" text)
    expect(screen.getByText(/⭐\s*100/)).toBeInTheDocument();
  });
});
