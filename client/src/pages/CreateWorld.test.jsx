import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, test, expect, vi, beforeEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import CreateWorld from './CreateWorld';
import api from '../api';

vi.mock('../api');

describe('CreateWorld Page Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('renders create world form', () => {
    render(
      <BrowserRouter>
        <CreateWorld />
      </BrowserRouter>
    );
    expect(screen.getByText(/Create a New World/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/World Title/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Description/i)).toBeInTheDocument();
  });

  test('submits form and navigates on success', async () => {
    api.post.mockResolvedValue({ data: { id: 1 } });

    render(
      <BrowserRouter>
        <CreateWorld />
      </BrowserRouter>
    );

    fireEvent.change(screen.getByLabelText(/World Title/i), { target: { value: 'New World' } });
    fireEvent.change(screen.getByLabelText(/Description/i), { target: { value: 'Best world ever' } });
    fireEvent.click(screen.getByRole('button', { name: /Create World/i }));

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/worlds', {
        title: 'New World',
        description: 'Best world ever'
      });
    });
  });

  test('shows error message on failure', async () => {
    api.post.mockRejectedValue({
      response: { data: { error: 'Title already exists' } }
    });

    render(
      <BrowserRouter>
        <CreateWorld />
      </BrowserRouter>
    );

    fireEvent.change(screen.getByLabelText(/World Title/i), { target: { value: 'Existing World' } });
    fireEvent.click(screen.getByRole('button', { name: /Create World/i }));

    await waitFor(() => {
      expect(screen.getByText(/Title already exists/i)).toBeInTheDocument();
    });
  });
});
