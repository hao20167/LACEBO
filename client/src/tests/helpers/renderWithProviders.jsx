/**
 * renderWithProviders — Helper dùng chung cho mọi component test.
 *
 * Bọc component trong:
 *  - MemoryRouter (để Link / useNavigate hoạt động)
 *  - AuthContext.Provider với mock value tùy chỉnh
 *
 * Cách dùng:
 *   renderWithProviders(<Login />, { authValue: { login: mockFn } });
 *   renderWithProviders(<Navbar />, { authValue: { user: { display_name: 'Alice' }, logout: vi.fn() } });
 */

import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AuthContext } from '../../contexts/AuthContext';

/** Giá trị mặc định khi chưa đăng nhập */
export const defaultAuthValue = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,
  login: vi.fn(),
  register: vi.fn(),
  logout: vi.fn(),
};

/**
 * @param {React.ReactElement} ui           — Component cần render
 * @param {object}             options
 * @param {object}             [options.authValue]          — Ghi đè authValue mặc định
 * @param {string[]}           [options.initialEntries=['/']] — Route khởi đầu cho MemoryRouter
 * @returns {import('@testing-library/react').RenderResult}
 */
export function renderWithProviders(ui, { authValue = {}, initialEntries = ['/'] } = {}) {
  const mergedAuth = { ...defaultAuthValue, ...authValue };

  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <AuthContext.Provider value={mergedAuth}>{ui}</AuthContext.Provider>
    </MemoryRouter>,
  );
}
