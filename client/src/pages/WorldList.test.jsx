import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';
import WorldList from './WorldList.jsx';
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
    title: 'World 1',
    description: 'Description 1',
    member_count: 10,
    created_at: '2023-01-01T00:00:00Z',
  },
  {
    id: 2,
    title: 'World 2',
    description: 'Description 2',
    member_count: 5,
    created_at: '2023-01-02T00:00:00Z',
  },
];

describe('WorldList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading state initially', async () => {
    // Mock api to never resolve, keeping loading true
    api.get.mockImplementationOnce(() => new Promise(() => {}));

    await act(async () => {
      render(
        <MemoryRouter>
          <WorldList />
        </MemoryRouter>
      );
    });

    expect(screen.getByText('Loading worlds...')).toBeInTheDocument();
  });

  it('fetches and displays worlds on mount', async () => {
    api.get.mockResolvedValueOnce({ data: mockWorlds });

    await act(async () => {
      render(
        <MemoryRouter>
          <WorldList />
        </MemoryRouter>
      );
    });

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith('/worlds', { params: {} });
    });

    expect(screen.getByText('World 1')).toBeInTheDocument();
    expect(screen.getByText('World 2')).toBeInTheDocument();
    expect(screen.getByText('Description 1')).toBeInTheDocument();
    expect(screen.getByText('👥 10 members')).toBeInTheDocument();
  });

  it('handles search functionality', async () => {
    api.get.mockResolvedValueOnce({ data: mockWorlds });
    api.get.mockResolvedValueOnce({ data: [mockWorlds[0]] }); // After search

    await act(async () => {
      render(
        <MemoryRouter>
          <WorldList />
        </MemoryRouter>
      );
    });

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith('/worlds', { params: {} });
    });

    const searchInput = screen.getByPlaceholderText('Search worlds by title...');
    const searchButton = screen.getByRole('button', { name: /search/i });

    fireEvent.change(searchInput, { target: { value: 'World 1' } });
    fireEvent.click(searchButton);

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith('/worlds', { params: { search: 'World 1' } });
    });

    expect(screen.getByText('World 1')).toBeInTheDocument();
    expect(screen.queryByText('World 2')).not.toBeInTheDocument();
  });

  it('displays empty state when no worlds found', async () => {
    api.get.mockResolvedValueOnce({ data: [] });

    await act(async () => {
      render(
        <MemoryRouter>
          <WorldList />
        </MemoryRouter>
      );
    });

    await waitFor(() => {
      expect(screen.getByText('No worlds found')).toBeInTheDocument();
      expect(screen.getByText(/create a world/i)).toBeInTheDocument();
    });
  });

  it('handles API error gracefully', async () => {
    api.get.mockRejectedValueOnce(new Error('API Error'));

    await act(async () => {
      render(
        <MemoryRouter>
          <WorldList />
        </MemoryRouter>
      );
    });

    await waitFor(() => {
      expect(screen.getByText('No worlds found')).toBeInTheDocument();
    });
  });
});