import { render, screen } from '@testing-library/react';
import HelloWorld from './HelloWorld.jsx';

describe('HelloWorld', () => {
  it('renders the hello world heading', () => {
    render(<HelloWorld />);
    expect(screen.getByRole('heading', { name: /hello world/i })).toBeInTheDocument();
  });
});
