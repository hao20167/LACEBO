/**
 * Test suite: Navbar component
 *
 * Kiểm tra:
 *  1. Render khi chưa đăng nhập — hiển thị Login & Register links
 *  2. Render khi đã đăng nhập — hiển thị display_name và nút Logout
 *  3. Menu điều hướng: luôn có "Explore Worlds", chỉ có "My Worlds" & "Create World" khi logged in
 *  4. Logo LACEBO luôn hiển thị và link đến "/"
 *  5. Gọi logout() khi click nút Logout
 *
 * Chiến lược mock:
 *  - Mock '../contexts/AuthContext' để export useAuth (Navbar.jsx đã được sửa dùng path này).
 *  - Dùng biến `mockAuthState` ngoài factory để thay đổi giữa các test.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import Navbar from '../components/Navbar';

// ─── Mock module AuthContext để export useAuth ────────────────────────────────
let mockAuthState = { user: null, logout: vi.fn() };

vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => mockAuthState,
}));

// ─── Helper render ────────────────────────────────────────────────────────────
const FUTURE_FLAGS = { v7_startTransition: true, v7_relativeSplatPath: true };

const renderNavbar = () =>
  render(
    <MemoryRouter future={FUTURE_FLAGS}>
      <Navbar />
    </MemoryRouter>,
  );

// ─── Fixtures ────────────────────────────────────────────────────────────────
const LOGGED_IN_USER = {
  id: 1,
  username: 'alice',
  display_name: 'Alice Nguyen',
  email: 'alice@test.com',
};

// ════════════════════════════════════════════════════════════════════════════
describe('Navbar — trạng thái chưa đăng nhập', () => {
  beforeEach(() => {
    mockAuthState = { user: null, logout: vi.fn() };
  });

  it('hiển thị logo LACEBO', () => {
    renderNavbar();
    expect(screen.getByText('LACEBO')).toBeInTheDocument();
  });

  it('logo link đến "/"', () => {
    renderNavbar();
    const logoLink = screen.getByRole('link', { name: /lacebo/i });
    expect(logoLink).toHaveAttribute('href', '/');
  });

  it('hiển thị link "Explore Worlds"', () => {
    renderNavbar();
    expect(screen.getByRole('link', { name: /explore worlds/i })).toBeInTheDocument();
  });

  it('hiển thị link "Login"', () => {
    renderNavbar();
    expect(screen.getByRole('link', { name: /^login$/i })).toBeInTheDocument();
  });

  it('hiển thị link "Register"', () => {
    renderNavbar();
    expect(screen.getByRole('link', { name: /^register$/i })).toBeInTheDocument();
  });

  it('link Login trỏ đến /login', () => {
    renderNavbar();
    expect(screen.getByRole('link', { name: /^login$/i })).toHaveAttribute('href', '/login');
  });

  it('link Register trỏ đến /register', () => {
    renderNavbar();
    expect(screen.getByRole('link', { name: /^register$/i })).toHaveAttribute('href', '/register');
  });

  it('không hiển thị nút Logout', () => {
    renderNavbar();
    expect(screen.queryByRole('button', { name: /logout/i })).not.toBeInTheDocument();
  });

  it('không hiển thị "My Worlds"', () => {
    renderNavbar();
    expect(screen.queryByRole('link', { name: /my worlds/i })).not.toBeInTheDocument();
  });

  it('không hiển thị "Create World"', () => {
    renderNavbar();
    expect(screen.queryByRole('link', { name: /create world/i })).not.toBeInTheDocument();
  });
});

// ════════════════════════════════════════════════════════════════════════════
describe('Navbar — trạng thái đã đăng nhập', () => {
  beforeEach(() => {
    mockAuthState = { user: LOGGED_IN_USER, logout: vi.fn() };
  });

  it('hiển thị display_name của user', () => {
    renderNavbar();
    expect(screen.getByText('Alice Nguyen')).toBeInTheDocument();
  });

  it('hiển thị nút Logout', () => {
    renderNavbar();
    expect(screen.getByRole('button', { name: /logout/i })).toBeInTheDocument();
  });

  it('hiển thị link "My Worlds"', () => {
    renderNavbar();
    expect(screen.getByRole('link', { name: /my worlds/i })).toBeInTheDocument();
  });

  it('hiển thị link "Create World"', () => {
    renderNavbar();
    expect(screen.getByRole('link', { name: /create world/i })).toBeInTheDocument();
  });

  it('link "My Worlds" trỏ đến /worlds/mine', () => {
    renderNavbar();
    expect(screen.getByRole('link', { name: /my worlds/i })).toHaveAttribute('href', '/worlds/mine');
  });

  it('link "Create World" trỏ đến /worlds/create', () => {
    renderNavbar();
    expect(screen.getByRole('link', { name: /create world/i })).toHaveAttribute('href', '/worlds/create');
  });

  it('không hiển thị link Login khi đã đăng nhập', () => {
    renderNavbar();
    expect(screen.queryByRole('link', { name: /^login$/i })).not.toBeInTheDocument();
  });

  it('không hiển thị link Register khi đã đăng nhập', () => {
    renderNavbar();
    expect(screen.queryByRole('link', { name: /^register$/i })).not.toBeInTheDocument();
  });
});

// ════════════════════════════════════════════════════════════════════════════
describe('Navbar — hành vi logout', () => {
  it('gọi logout() khi click nút Logout', async () => {
    const mockLogout = vi.fn();
    mockAuthState = { user: LOGGED_IN_USER, logout: mockLogout };

    const user = userEvent.setup();
    renderNavbar();

    await user.click(screen.getByRole('button', { name: /logout/i }));

    expect(mockLogout).toHaveBeenCalledOnce();
  });
});

// ════════════════════════════════════════════════════════════════════════════
describe('Navbar — điều hướng chung', () => {
  beforeEach(() => {
    mockAuthState = { user: null, logout: vi.fn() };
  });

  it('"Explore Worlds" trỏ đến /worlds', () => {
    renderNavbar();
    expect(screen.getByRole('link', { name: /explore worlds/i })).toHaveAttribute('href', '/worlds');
  });

  it('render trong thẻ <nav>', () => {
    renderNavbar();
    expect(document.querySelector('nav')).toBeInTheDocument();
  });
});
