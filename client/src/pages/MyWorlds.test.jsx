import { render, screen, waitFor, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';
import MyWorlds from './MyWorlds.jsx';
import api from '../api.js';

// Mock the api module
vi.mock('../api.js', () => ({
  default: {
    get: vi.fn(),
  },
}));

const mockWorlds = [
  {
    id: 1,
    title: 'My World 1',
    description: 'Description 1',
    member_count: 10,
    credits: 100,
    role: 'dev',
  },
  {
    id: 2,
    title: 'My World 2',
    description: 'Description 2',
    member_count: 5,
    credits: 50,
    role: 'member',
  },
];

describe('MyWorlds', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading state initially', async () => {
    // Mock api to never resolve, keeping loading true
    api.get.mockImplementationOnce(() => new Promise(() => {}));

    await act(async () => {
      render(
        <MemoryRouter>
          <MyWorlds />
        </MemoryRouter>
      );
    });

    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('fetches and displays user worlds on mount', async () => {
    api.get.mockResolvedValueOnce({ data: mockWorlds });

    await act(async () => {
      render(
        <MemoryRouter>
          <MyWorlds />
        </MemoryRouter>
      );
    });

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith('/worlds/mine');
    });

    expect(screen.getByText('My World 1')).toBeInTheDocument();
    expect(screen.getByText('My World 2')).toBeInTheDocument();
    expect(screen.getByText('Description 1')).toBeInTheDocument();
    expect(screen.getByText('👥 10 members')).toBeInTheDocument();
    expect(screen.getByText('⭐ 100 credits')).toBeInTheDocument();
    expect(screen.getByText('DEV')).toBeInTheDocument();
    expect(screen.getByText('MEMBER')).toBeInTheDocument();
  });

  it('displays empty state when no worlds found', async () => {
    api.get.mockResolvedValueOnce({ data: [] });

    await act(async () => {
      render(
        <MemoryRouter>
          <MyWorlds />
        </MemoryRouter>
      );
    });

    await waitFor(() => {
      expect(screen.getByText("You haven't joined any worlds yet.")).toBeInTheDocument();
      expect(screen.getByText(/explore worlds/i)).toBeInTheDocument();
    });
  });

  it('handles API error gracefully', async () => {
    api.get.mockRejectedValueOnce(new Error('API Error'));

    await act(async () => {
      render(
        <MemoryRouter>
          <MyWorlds />
        </MemoryRouter>
      );
    });

    await waitFor(() => {
      expect(screen.getByText("You haven't joined any worlds yet.")).toBeInTheDocument();
    });
  });

  it('renders the new world link', async () => {
    api.get.mockResolvedValueOnce({ data: [] });

    await act(async () => {
      render(
        <MemoryRouter>
          <MyWorlds />
        </MemoryRouter>
      );
    });

    expect(screen.getByRole('link', { name: /\+ new world/i })).toHaveAttribute('href', '/worlds/create');
  });
});