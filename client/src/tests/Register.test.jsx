/**
 * Test suite: Register component
 *
 * Kiểm tra:
 *  1. Render đúng các phần tử UI (4 fields)
 *  2. Nhập liệu vào form
 *  3. Gọi register() với đúng form data khi submit
 *  4. Chuyển trang /worlds sau khi đăng ký thành công
 *  5. Hiển thị thông báo lỗi khi API thất bại
 *  6. Trạng thái loading
 *  7. Link điều hướng về /login
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import Register from '../pages/Register';

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

const renderRegister = () =>
  render(
    <MemoryRouter future={FUTURE_FLAGS}>
      <Register />
    </MemoryRouter>,
  );

// ─── Helper điền form ─────────────────────────────────────────────────────────
const fillForm = async (
  user,
  {
    displayName = 'Alice Nguyen',
    username = 'alice',
    email = 'alice@test.com',
    password = 'Password1!',
  } = {},
) => {
  await user.type(screen.getByLabelText(/display name/i), displayName);
  await user.type(screen.getByLabelText(/username/i), username);
  await user.type(screen.getByLabelText(/email/i), email);
  await user.type(screen.getByLabelText(/password/i), password);
};

const fillAndSubmit = async (user, formData) => {
  await fillForm(user, formData);
  await user.click(screen.getByRole('button', { name: /create account/i }));
};

// ════════════════════════════════════════════════════════════════════════════
describe('Register — render', () => {
  beforeEach(() => {
    mockAuthState = { register: vi.fn(), user: null };
    mockNavigate.mockReset();
  });

  it('hiển thị tiêu đề "Join LACEBO"', () => {
    renderRegister();
    expect(
      screen.getByRole('heading', { name: /join lacebo/i }),
    ).toBeInTheDocument();
  });

  it('hiển thị 4 input fields: Display Name, Username, Email, Password', () => {
    renderRegister();
    expect(screen.getByLabelText(/display name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
  });

  it('hiển thị nút "Create Account"', () => {
    renderRegister();
    expect(
      screen.getByRole('button', { name: /create account/i }),
    ).toBeInTheDocument();
  });

  it('hiển thị link điều hướng về trang Login', () => {
    renderRegister();
    const link = screen.getByRole('link', { name: /login/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '/login');
  });

  it('không hiển thị thông báo lỗi khi mới render', () => {
    renderRegister();
    expect(screen.queryByText(/failed/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/registration/i)).not.toBeInTheDocument();
  });
});

// ════════════════════════════════════════════════════════════════════════════
describe('Register — nhập liệu', () => {
  beforeEach(() => {
    mockAuthState = { register: vi.fn(), user: null };
  });

  it('cập nhật từng field khi gõ', async () => {
    const user = userEvent.setup();
    renderRegister();
    await fillForm(user);

    expect(screen.getByLabelText(/display name/i)).toHaveValue('Alice Nguyen');
    expect(screen.getByLabelText(/username/i)).toHaveValue('alice');
    expect(screen.getByLabelText(/email/i)).toHaveValue('alice@test.com');
    expect(screen.getByLabelText(/password/i)).toHaveValue('Password1!');
  });

  it('input Email có type="email"', () => {
    renderRegister();
    expect(screen.getByLabelText(/email/i)).toHaveAttribute('type', 'email');
  });

  it('input Password có type="password"', () => {
    renderRegister();
    expect(screen.getByLabelText(/password/i)).toHaveAttribute(
      'type',
      'password',
    );
  });

  it('input Password có minLength="6"', () => {
    renderRegister();
    expect(screen.getByLabelText(/password/i)).toHaveAttribute(
      'minLength',
      '6',
    );
  });
});

// ════════════════════════════════════════════════════════════════════════════
describe('Register — submit form', () => {
  beforeEach(() => {
    mockNavigate.mockReset();
  });

  it('gọi register() với đúng form data', async () => {
    const mockRegister = vi.fn().mockResolvedValue(undefined);
    mockAuthState = { register: mockRegister, user: null };

    const user = userEvent.setup();
    renderRegister();
    await fillAndSubmit(user);

    await waitFor(() => {
      expect(mockRegister).toHaveBeenCalledOnce();
      expect(mockRegister).toHaveBeenCalledWith({
        display_name: 'Alice Nguyen',
        username: 'alice',
        email: 'alice@test.com',
        password: 'Password1!',
      });
    });
  });

  it('navigate đến /worlds sau khi đăng ký thành công', async () => {
    const mockRegister = vi.fn().mockResolvedValue(undefined);
    mockAuthState = { register: mockRegister, user: null };

    const user = userEvent.setup();
    renderRegister();
    await fillAndSubmit(user);

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/worlds');
    });
  });

  it('không navigate nếu register thất bại', async () => {
    const failRegister = vi.fn().mockRejectedValue({
      response: { data: { error: 'Username taken' } },
    });
    mockAuthState = { register: failRegister, user: null };

    const user = userEvent.setup();
    renderRegister();
    await fillAndSubmit(user);

    await waitFor(() => {
      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });
});

// ════════════════════════════════════════════════════════════════════════════
describe('Register — hiển thị lỗi', () => {
  it('hiển thị lỗi từ server khi API thất bại', async () => {
    const failRegister = vi.fn().mockRejectedValue({
      response: { data: { error: 'Username already taken' } },
    });
    mockAuthState = { register: failRegister, user: null };

    const user = userEvent.setup();
    renderRegister();
    await fillAndSubmit(user);

    await waitFor(() => {
      expect(screen.getByText('Username already taken')).toBeInTheDocument();
    });
  });

  it('hiển thị "Registration failed" khi không có response lỗi', async () => {
    const failRegister = vi.fn().mockRejectedValue(new Error('Network Error'));
    mockAuthState = { register: failRegister, user: null };

    const user = userEvent.setup();
    renderRegister();
    await fillAndSubmit(user);

    await waitFor(() => {
      expect(screen.getByText('Registration failed')).toBeInTheDocument();
    });
  });
});

// ════════════════════════════════════════════════════════════════════════════
describe('Register — trạng thái loading', () => {
  beforeEach(() => {
    mockNavigate.mockReset();
  });

  it('nút hiển thị "Creating account..." trong khi loading', async () => {
    const neverResolve = vi.fn(() => new Promise(() => {}));
    mockAuthState = { register: neverResolve, user: null };

    const user = userEvent.setup();
    renderRegister();
    await fillAndSubmit(user);

    expect(
      screen.getByRole('button', { name: /creating account/i }),
    ).toBeInTheDocument();
  });

  it('nút bị disabled trong khi loading', async () => {
    const neverResolve = vi.fn(() => new Promise(() => {}));
    mockAuthState = { register: neverResolve, user: null };

    const user = userEvent.setup();
    renderRegister();
    await fillAndSubmit(user);

    expect(
      screen.getByRole('button', { name: /creating account/i }),
    ).toBeDisabled();
  });

  it('nút trở lại "Create Account" và enabled sau khi request xong', async () => {
    const mockRegister = vi.fn().mockResolvedValue(undefined);
    mockAuthState = { register: mockRegister, user: null };

    const user = userEvent.setup();
    renderRegister();
    await fillAndSubmit(user);

    await waitFor(() => expect(mockRegister).toHaveBeenCalledOnce());
    expect(
      screen.getByRole('button', { name: /create account/i }),
    ).not.toBeDisabled();
  });
});
