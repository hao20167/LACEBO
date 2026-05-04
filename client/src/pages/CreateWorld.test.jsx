import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';
import CreateWorld from './CreateWorld.jsx';
import api from '../api.js';

// Mock the api module
vi.mock('../api.js', () => ({
  default: {
    post: vi.fn(),
  },
}));

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('CreateWorld', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the create world form', () => {
    render(
      <MemoryRouter>
        <CreateWorld />
      </MemoryRouter>
    );

    expect(screen.getByText('Create a New World')).toBeInTheDocument();
    expect(screen.getByLabelText('World Title')).toBeInTheDocument();
    expect(screen.getByLabelText('Description')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create world/i })).toBeInTheDocument();
  });

  it('submits the form successfully and navigates', async () => {
    const mockResponse = { data: { id: 1 } };
    api.post.mockResolvedValueOnce(mockResponse);

    render(
      <MemoryRouter>
        <CreateWorld />
      </MemoryRouter>
    );

    const titleInput = screen.getByLabelText('World Title');
    const descriptionInput = screen.getByLabelText('Description');
    const submitButton = screen.getByRole('button', { name: /create world/i });

    fireEvent.change(titleInput, { target: { value: 'New World' } });
    fireEvent.change(descriptionInput, { target: { value: 'A new world description' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/worlds', {
        title: 'New World',
        description: 'A new world description',
      });
    });

    expect(mockNavigate).toHaveBeenCalledWith('/worlds/1');
  });

  it('displays error on submission failure', async () => {
    const errorMessage = 'Title is required';
    api.post.mockRejectedValueOnce({
      response: { data: { error: errorMessage } },
    });

    render(
      <MemoryRouter>
        <CreateWorld />
      </MemoryRouter>
    );

    const titleInput = screen.getByLabelText('World Title');
    const submitButton = screen.getByRole('button', { name: /create world/i });

    fireEvent.change(titleInput, { target: { value: 'New World' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
  });

  it('displays generic error on submission failure without response data', async () => {
    api.post.mockRejectedValueOnce(new Error('Network error'));

    render(
      <MemoryRouter>
        <CreateWorld />
      </MemoryRouter>
    );

    const titleInput = screen.getByLabelText('World Title');
    const submitButton = screen.getByRole('button', { name: /create world/i });

    fireEvent.change(titleInput, { target: { value: 'New World' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Failed to create world')).toBeInTheDocument();
    });
  });

  it('shows loading state during submission', async () => {
    api.post.mockImplementation(() => new Promise(() => {})); // Never resolves

    render(
      <MemoryRouter>
        <CreateWorld />
      </MemoryRouter>
    );

    const titleInput = screen.getByLabelText('World Title');
    const submitButton = screen.getByRole('button', { name: /create world/i });

    fireEvent.change(titleInput, { target: { value: 'New World' } });
    fireEvent.click(submitButton);

    expect(screen.getByText('Creating...')).toBeInTheDocument();
    expect(submitButton).toBeDisabled();
  });
});