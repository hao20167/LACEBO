import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AuthContext } from '@/contexts/AuthContext.jsx';
import HelloWorld from './HelloWorld.jsx';

// Mock AuthContext value mẫu — dùng lại cho các test component khác
export const mockAuthValue = {
  user: { id: 1, username: 'test_user', email: 'test@example.com' },
  token: 'mock-jwt-token',
  isAuthenticated: true,
  isLoading: false,
  login: vi.fn(),
  register: vi.fn(),
  logout: vi.fn(),
};

describe('HelloWorld', () => {
  it('renders the hello world heading', () => {
    render(<HelloWorld />);
    expect(screen.getByRole('heading', { name: /hello world/i })).toBeInTheDocument();
  });
});

describe('HelloWorld (với AuthContext wrapper)', () => {
  it('render đúng khi có AuthProvider bao ngoài', () => {
    render(
      <MemoryRouter>
        <AuthContext.Provider value={mockAuthValue}>
          <HelloWorld />
        </AuthContext.Provider>
      </MemoryRouter>,
    );
    expect(screen.getByRole('heading', { name: /hello world/i })).toBeInTheDocument();
  });
});
