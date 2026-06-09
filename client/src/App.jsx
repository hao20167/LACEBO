import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import PropTypes from 'prop-types';
import { useAuth } from './contexts/AuthContext';
import Navbar from './components/Navbar';
import { AuthCheckSkeleton } from './components/SkeletonLoader';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import WorldList from './pages/WorldList';
import WorldDetail from './pages/WorldDetail';
import EventDetail from './pages/EventDetail';
import CreateWorld from './pages/CreateWorld';
import MyWorlds from './pages/MyWorlds';
import UserProfile from './pages/UserProfile';
import WorldManage from './pages/WorldManage';

function ProtectedRoute({ children }) {
  const { user, isLoading } = useAuth();
  if (isLoading) return <AuthCheckSkeleton />;
  if (!user) return <Navigate to="/login" />;
  return children;
}

ProtectedRoute.propTypes = {
  children: PropTypes.node.isRequired,
};

function AnimatedRoutes() {
  const location = useLocation();
  return (
    <div key={location.pathname} className="page-enter">
      <Routes location={location}>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/worlds" element={<WorldList />} />
        <Route
          path="/worlds/create"
          element={
            <ProtectedRoute>
              <CreateWorld />
            </ProtectedRoute>
          }
        />
        <Route
          path="/worlds/mine"
          element={
            <ProtectedRoute>
              <MyWorlds />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <UserProfile />
            </ProtectedRoute>
          }
        />
        <Route path="/worlds/:id" element={<WorldDetail />} />
        <Route path="/events/:eventId" element={<EventDetail />} />
        <Route
          path="/worlds/:id/manage"
          element={
            <ProtectedRoute>
              <WorldManage />
            </ProtectedRoute>
          }
        />
      </Routes>
    </div>
  );
}

export default function App() {
  return (
    <div className="min-h-screen bg-[#edeff1]">
      <Navbar />
      {/* Offset for desktop sidebar (w-60) and mobile top bar (h-14) */}
      <div className="lg:pl-60">
        <div className="h-14 lg:h-0" />
        <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
          <AnimatedRoutes />
        </main>
      </div>
    </div>
  );
}
