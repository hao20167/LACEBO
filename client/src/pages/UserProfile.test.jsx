import {
  render,
  screen,
  waitFor,
  act,
  fireEvent,
} from '@testing-library/react';
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
  getApiCollection: vi.fn((payload) =>
    Array.isArray(payload) ? payload : payload?.data || [],
  ),
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

// ─── Shared fixtures ────────────────────────────────────────────────────────

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

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Default successful mock: /users/me → mockProfile, /worlds/mine → mockWorlds */
const mockSuccessfulFetch = () => {
  api.get.mockImplementation((url) => {
    if (url === '/users/me') return Promise.resolve({ data: mockProfile });
    if (url === '/worlds/mine') return Promise.resolve({ data: mockWorlds });
    return Promise.resolve({ data: [] });
  });
};

/** Renders <UserProfile /> inside a MemoryRouter and waits for act to settle */
const renderUserProfile = async () => {
  await act(async () => {
    render(
      <MemoryRouter>
        <UserProfile />
      </MemoryRouter>,
    );
  });
};

/** Renders the component and waits until the profile display name is visible */
const renderAndWaitForProfile = async () => {
  await renderUserProfile();
  await waitFor(() => {
    expect(screen.getByText('John Doe')).toBeInTheDocument();
  });
};

// ─── Tests ──────────────────────────────────────────────────────────────────

describe('UserProfile Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading state initially with skeleton', async () => {
    api.get.mockImplementation(() => new Promise(() => {}));

    await renderUserProfile();

    expect(screen.getByTestId('skeleton-loader')).toBeInTheDocument();
  });

  it('fetches and displays profile details and joined worlds on successful fetch', async () => {
    mockSuccessfulFetch();

    await renderUserProfile();

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
    mockSuccessfulFetch();
    await renderAndWaitForProfile();

    fireEvent.click(screen.getByRole('button', { name: /edit profile/i }));

    const input = screen.getByLabelText(/display name/i);
    expect(input.value).toBe('John Doe');

    fireEvent.click(screen.getByRole('button', { name: /cancel/i }));

    expect(screen.queryByLabelText(/display name/i)).not.toBeInTheDocument();
    expect(screen.getByText('John Doe')).toBeInTheDocument();
  });

  it('updates display name successfully', async () => {
    mockSuccessfulFetch();

    const updatedProfile = { ...mockProfile, display_name: 'John Smith' };
    api.patch.mockResolvedValueOnce({ data: updatedProfile });

    await renderAndWaitForProfile();

    fireEvent.click(screen.getByRole('button', { name: /edit profile/i }));
    fireEvent.change(screen.getByLabelText(/display name/i), {
      target: { value: 'John Smith' },
    });

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /save changes/i }));
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

    await renderUserProfile();

    await waitFor(() => {
      expect(screen.getByText('Fetch failed')).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /try again/i }),
      ).toBeInTheDocument();
    });
  });
});
