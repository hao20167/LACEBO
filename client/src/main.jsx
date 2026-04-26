import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext.jsx';
import App from './App.jsx';
import './index.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {/*
     * BrowserRouter: Cung cấp context routing cho toàn bộ app.
     * AuthProvider: Bọc bên trong Router để các trang có thể dùng
     *   cả useNavigate() và useAuth() cùng lúc.
     */}
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
);
