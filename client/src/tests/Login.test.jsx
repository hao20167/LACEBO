/**
 * Test suite: Login component
 *
 * Kiểm tra:
 *  1. Render đúng các phần tử UI
 *  2. Nhập liệu vào form
 *  3. Gọi login() với đúng tham số khi submit
 *  4. Chuyển trang /worlds sau khi đăng nhập thành công
 *  5. Hiển thị thông báo lỗi khi API trả về lỗi
 *  6. Trạng thái loading (nút disabled + text thay đổi)
 *  7. Link điều hướng đến /register
 *
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import Login from '../pages/Login';

// ─── Mock module AuthContext để export useAuth ────────────────────────────────
let mockAuthState = {
  login: vi.fn(),
  register: vi.fn(),
  logout: vi.fn(),
  user: null,
};

vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => mockAuthState,
}));

// ─── Mock useNavigate ─────────────────────────────────────────────────────────
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal();
  return { ...actual, useNavigate: () => mockNavigate };
});

// ─── Helper render ────────────────────────────────────────────────────────────
const FUTURE_FLAGS = { v7_startTransition: true, v7_relativeSplatPath: true };

const renderLogin = () =>
  render(
    <MemoryRouter future={FUTURE_FLAGS}>
      <Login />
    </MemoryRouter>,
  );

// ─── Helper điền form ─────────────────────────────────────────────────────────
const fillAndSubmit = async (
  user,
  username = 'alice',
  password = 'secret123',
) => {
  await user.type(screen.getByLabelText(/username/i), username);
  await user.type(screen.getByLabelText(/password/i), password);
  await user.click(screen.getByRole('button', { name: /^sign in$/i }));
};

// ════════════════════════════════════════════════════════════════════════════
describe('Login — render', () => {
  beforeEach(() => {
    mockAuthState = { login: vi.fn(), user: null };
    mockNavigate.mockReset();
  });

  it('hiển thị tiêu đề "Welcome back"', () => {
    renderLogin();
    expect(
      screen.getByRole('heading', { name: /welcome back/i }),
    ).toBeInTheDocument();
  });

  it('hiển thị field Username và Password', () => {
    renderLogin();
    expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
  });

  it('hiển thị nút submit "Sign in"', () => {
    renderLogin();
    expect(
      screen.getByRole('button', { name: /^sign in$/i }),
    ).toBeInTheDocument();
  });

  it('hiển thị link điều hướng đến trang Register', () => {
    renderLogin();
    const link = screen.getByRole('link', { name: /create one/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '/register');
  });

  it('không hiển thị thông báo lỗi khi mới render', () => {
    renderLogin();
    expect(screen.queryByText(/failed/i)).not.toBeInTheDocument();
  });
});

// ════════════════════════════════════════════════════════════════════════════
describe('Login — nhập liệu', () => {
  beforeEach(() => {
    mockAuthState = { login: vi.fn(), user: null };
  });

  it('cập nhật giá trị Username khi gõ', async () => {
    const user = userEvent.setup();
    renderLogin();

    await user.type(screen.getByLabelText(/username/i), 'alice');
    expect(screen.getByLabelText(/username/i)).toHaveValue('alice');
  });

  it('cập nhật giá trị Password khi gõ', async () => {
    const user = userEvent.setup();
    renderLogin();

    await user.type(screen.getByLabelText(/password/i), 'secret123');
    expect(screen.getByLabelText(/password/i)).toHaveValue('secret123');
  });

  it('input Password có type="password"', () => {
    renderLogin();
    expect(screen.getByLabelText(/password/i)).toHaveAttribute(
      'type',
      'password',
    );
  });
});

// ════════════════════════════════════════════════════════════════════════════
describe('Login — submit form', () => {
  beforeEach(() => {
    mockNavigate.mockReset();
  });

  it('gọi login() với đúng username và password', async () => {
    const mockLogin = vi.fn().mockResolvedValue(undefined);
    mockAuthState = { login: mockLogin, user: null };

    const user = userEvent.setup();
    renderLogin();
    await fillAndSubmit(user, 'alice', 'secret123');

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledOnce();
      expect(mockLogin).toHaveBeenCalledWith('alice', 'secret123');
    });
  });

  it('navigate đến /worlds sau khi login thành công', async () => {
    const mockLogin = vi.fn().mockResolvedValue(undefined);
    mockAuthState = { login: mockLogin, user: null };

    const user = userEvent.setup();
    renderLogin();
    await fillAndSubmit(user);

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/worlds');
    });
  });

  it('không navigate nếu login thất bại', async () => {
    const failLogin = vi.fn().mockRejectedValue({
      response: { data: { error: 'Invalid credentials' } },
    });
    mockAuthState = { login: failLogin, user: null };

    const user = userEvent.setup();
    renderLogin();
    await fillAndSubmit(user);

    await waitFor(() => {
      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });
});

// ════════════════════════════════════════════════════════════════════════════
describe('Login — hiển thị lỗi', () => {
  it('hiển thị lỗi từ server khi API thất bại', async () => {
    const failLogin = vi.fn().mockRejectedValue({
      response: { data: { error: 'Invalid credentials' } },
    });
    mockAuthState = { login: failLogin, user: null };

    const user = userEvent.setup();
    renderLogin();
    await fillAndSubmit(user);

    await waitFor(() => {
      expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
    });
  });

  it('hiển thị "Login failed" khi lỗi không có response', async () => {
    const failLogin = vi.fn().mockRejectedValue(new Error('Network Error'));
    mockAuthState = { login: failLogin, user: null };

    const user = userEvent.setup();
    renderLogin();
    await fillAndSubmit(user);

    await waitFor(() => {
      expect(screen.getByText('Login failed')).toBeInTheDocument();
    });
  });

  it('xóa lỗi cũ và thử lại thành công', async () => {
    const failThenSuccess = vi
      .fn()
      .mockRejectedValueOnce({
        response: { data: { error: 'Wrong password' } },
      })
      .mockResolvedValueOnce(undefined);
    mockAuthState = { login: failThenSuccess, user: null };

    const user = userEvent.setup();
    renderLogin();
    await fillAndSubmit(user);

    await waitFor(() =>
      expect(screen.getByText('Wrong password')).toBeInTheDocument(),
    );

    // Submit lần 2 — lỗi biến mất
    await user.click(screen.getByRole('button', { name: /^sign in$/i }));
    await waitFor(() =>
      expect(screen.queryByText('Wrong password')).not.toBeInTheDocument(),
    );
  });
});

// ════════════════════════════════════════════════════════════════════════════
describe('Login — trạng thái loading', () => {
  beforeEach(() => {
    mockNavigate.mockReset();
  });

  it('nút hiển thị "Signing in..." trong khi đang gửi request', async () => {
    const neverResolve = vi.fn(() => new Promise(() => {}));
    mockAuthState = { login: neverResolve, user: null };

    const user = userEvent.setup();
    renderLogin();
    await user.type(screen.getByLabelText(/username/i), 'alice');
    await user.type(screen.getByLabelText(/password/i), 'pass');
    await user.click(screen.getByRole('button', { name: /^sign in$/i }));

    expect(
      screen.getByRole('button', { name: /signing in/i }),
    ).toBeInTheDocument();
  });

  it('nút bị disabled trong khi loading', async () => {
    const neverResolve = vi.fn(() => new Promise(() => {}));
    mockAuthState = { login: neverResolve, user: null };

    const user = userEvent.setup();
    renderLogin();
    await user.type(screen.getByLabelText(/username/i), 'alice');
    await user.type(screen.getByLabelText(/password/i), 'pass');
    await user.click(screen.getByRole('button', { name: /^sign in$/i }));

    expect(screen.getByRole('button', { name: /signing in/i })).toBeDisabled();
  });

  it('nút trở lại "Sign in" và enabled sau khi request xong', async () => {
    const mockLogin = vi.fn().mockResolvedValue(undefined);
    mockAuthState = { login: mockLogin, user: null };

    const user = userEvent.setup();
    renderLogin();
    await fillAndSubmit(user);

    await waitFor(() => expect(mockLogin).toHaveBeenCalledOnce());
    // Sau khi async xong, nút quay về trạng thái ban đầu
    expect(screen.getByRole('button', { name: /^sign in$/i })).not.toBeDisabled();
  });
});
