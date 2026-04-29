import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import WorldList from './pages/WorldList';
import WorldDetail from './pages/WorldDetail';
import EventDetail from './pages/EventDetail';
import CreateWorld from './pages/CreateWorld';
import MyWorlds from './pages/MyWorlds';
import WorldManage from './pages/WorldManage';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex items-center justify-center min-h-screen"><div className="text-dark-400">Loading...</div></div>;
  if (!user) return <Navigate to="/login" />;
  return children;
}

export default function App() {
  return (
    <div className="min-h-screen bg-dark-950">
      <Navbar />
      <main className="max-w-6xl mx-auto px-4 py-6">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/worlds" element={<WorldList />} />
          <Route path="/worlds/create" element={<ProtectedRoute><CreateWorld /></ProtectedRoute>} />
          <Route path="/worlds/mine" element={<ProtectedRoute><MyWorlds /></ProtectedRoute>} />
          <Route path="/worlds/:id" element={<WorldDetail />} />
          <Route path="/worlds/:id/manage" element={<ProtectedRoute><WorldManage /></ProtectedRoute>} />
          <Route path="/events/:eventId" element={<EventDetail />} />
        </Routes>
      </main>
    </div>
  );
}