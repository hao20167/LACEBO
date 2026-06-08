import { render, screen, waitFor, act, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';
import UserProfile from './UserProfile.jsx';
import api from '../services/api.js';

// Mock the api module
vi.mock('../services/api.js', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
  },
  getApiCollection: vi.fn((payload) => (Array.isArray(payload) ? payload : payload?.data || [])),
  getApiAssetUrl: vi.fn((path) => path),
  getApiErrorMessage: vi.fn((err, fallback) => err.message || fallback),
}));

// Mock the AuthContext
const mockUpdateUser = vi.fn();
vi.mock('../contexts/AuthContext.jsx', () => ({
  useAuth: () => ({
    updateUser: mockUpdateUser,
  }),
}));

const mockProfile = {
  id: 1,
  username: 'johndoe',
  display_name: 'John Doe',
  email: 'john@example.com',
  avatar_url: '/uploads/avatar.png',
  created_at: '2024-01-01T00:00:00Z',
};

const mockWorlds = [
  {
    id: 101,
    title: 'World of Magic',
    description: 'A magical place',
    role: 'dev',
    credits: 50,
    member_count: 12,
    created_at: '2024-02-01T00:00:00Z',
  },
];

describe('UserProfile Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading state initially with skeleton', async () => {
    api.get.mockImplementation(() => new Promise(() => {}));

    await act(async () => {
      render(
        <MemoryRouter>
          <UserProfile />
        </MemoryRouter>,
      );
    });

    expect(screen.getByTestId('skeleton-loader')).toBeInTheDocument();
  });

  it('fetches and displays profile details and joined worlds on successful fetch', async () => {
    api.get.mockImplementation((url) => {
      if (url === '/users/me') return Promise.resolve({ data: mockProfile });
      if (url === '/worlds/mine') return Promise.resolve({ data: mockWorlds });
      return Promise.resolve({ data: [] });
    });

    await act(async () => {
      render(
        <MemoryRouter>
          <UserProfile />
        </MemoryRouter>,
      );
    });

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith('/users/me');
      expect(api.get).toHaveBeenCalledWith('/worlds/mine');
    });

    expect(screen.queryByTestId('skeleton-loader')).not.toBeInTheDocument();
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('johndoe')).toBeInTheDocument();
    expect(screen.getByText('john@example.com')).toBeInTheDocument();
    expect(screen.getByText('World of Magic')).toBeInTheDocument();
    expect(screen.getByText('A magical place')).toBeInTheDocument();
    expect(screen.getByText('DEV')).toBeInTheDocument();
    expect(screen.getByText('Members')).toBeInTheDocument();
    expect(screen.getByText('12')).toBeInTheDocument();
    expect(screen.getByText('Credits')).toBeInTheDocument();
    expect(screen.getByText('50')).toBeInTheDocument();
  });

  it('allows user to enter editing mode and cancel editing', async () => {
    api.get.mockImplementation((url) => {
      if (url === '/users/me') return Promise.resolve({ data: mockProfile });
      if (url === '/worlds/mine') return Promise.resolve({ data: mockWorlds });
      return Promise.resolve({ data: [] });
    });

    await act(async () => {
      render(
        <MemoryRouter>
          <UserProfile />
        </MemoryRouter>,
      );
    });

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    const editBtn = screen.getByRole('button', { name: /edit profile/i });
    fireEvent.click(editBtn);

    const input = screen.getByLabelText(/display name/i);
    expect(input.value).toBe('John Doe');

    const cancelBtn = screen.getByRole('button', { name: /cancel/i });
    fireEvent.click(cancelBtn);

    expect(screen.queryByLabelText(/display name/i)).not.toBeInTheDocument();
    expect(screen.getByText('John Doe')).toBeInTheDocument();
  });

  it('updates display name successfully', async () => {
    api.get.mockImplementation((url) => {
      if (url === '/users/me') return Promise.resolve({ data: mockProfile });
      if (url === '/worlds/mine') return Promise.resolve({ data: mockWorlds });
      return Promise.resolve({ data: [] });
    });

    const updatedProfile = { ...mockProfile, display_name: 'John Smith' };
    api.patch.mockResolvedValueOnce({ data: updatedProfile });

    await act(async () => {
      render(
        <MemoryRouter>
          <UserProfile />
        </MemoryRouter>,
      );
    });

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /edit profile/i }));

    const input = screen.getByLabelText(/display name/i);
    fireEvent.change(input, { target: { value: 'John Smith' } });

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /save profile/i }));
    });

    await waitFor(() => {
      expect(api.patch).toHaveBeenCalledWith('/users/me', {
        display_name: 'John Smith',
      });
      expect(mockUpdateUser).toHaveBeenCalledWith(updatedProfile);
    });

    expect(screen.getByText('John Smith')).toBeInTheDocument();
  });

  it('handles initial fetch error gracefully with retry option', async () => {
    api.get.mockRejectedValueOnce(new Error('Fetch failed'));

    await act(async () => {
      render(
        <MemoryRouter>
          <UserProfile />
        </MemoryRouter>,
      );
    });

    await waitFor(() => {
      expect(screen.getByText('Fetch failed')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
    });
  });
});
