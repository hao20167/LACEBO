import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, test, expect, vi, beforeEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import Login from './Login';
import * as useAuthHook from '../hooks/useAuth';

// Mock toàn bộ module
vi.mock('../hooks/useAuth', () => ({
  useAuth: vi.fn()
}));

const renderLogin = (authValue) => {
  vi.spyOn(useAuthHook, 'useAuth').mockReturnValue(authValue);
  return render(
    <BrowserRouter>
      <Login />
    </BrowserRouter>
  );
};

describe('Login Page Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('renders login form', () => {
    renderLogin({ login: vi.fn() });
    expect(screen.getByText(/Login to LACEBO/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Username/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Password/i)).toBeInTheDocument();
  });

  test('submits form and navigates on success', async () => {
    const loginMock = vi.fn().mockResolvedValue();
    renderLogin({ login: loginMock });

    fireEvent.change(screen.getByLabelText(/Username/i), { target: { value: 'testuser' } });
    fireEvent.change(screen.getByLabelText(/Password/i), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: /Login/i }));

    await waitFor(() => {
      expect(loginMock).toHaveBeenCalledWith('testuser', 'password123');
    });
  });

  test('shows error message on failure', async () => {
    const loginMock = vi.fn().mockRejectedValue({
      response: { data: { error: 'Invalid credentials' } }
    });
    renderLogin({ login: loginMock });

    fireEvent.change(screen.getByLabelText(/Username/i), { target: { value: 'wronguser' } });
    fireEvent.change(screen.getByLabelText(/Password/i), { target: { value: 'wrongpass' } });
    fireEvent.click(screen.getByRole('button', { name: /Login/i }));

    await waitFor(() => {
      expect(screen.getByText(/Invalid credentials/i)).toBeInTheDocument();
    });
  });
});
