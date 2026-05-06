import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function Home() {
  const { user } = useAuth();

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] text-center">
      <h1 className="text-6xl font-extrabold mb-4">
        <span className="text-primary-400">LACEBO</span>
      </h1>
      <p className="text-xl text-dark-300 mb-2 max-w-2xl">
        A social network for roleplay worlds. Create, join, and experience stories together.
      </p>
      <p className="text-dark-500 mb-8 max-w-xl">
        Build immersive worlds with lore timelines, events, and communities. 
        No coding, no complex graphics — just pure collaborative storytelling.
      </p>
      <div className="flex gap-4">
        <Link to="/worlds" className="bg-primary-600 hover:bg-primary-500 text-white px-8 py-3 rounded-xl font-semibold text-lg transition">
          Explore Worlds
        </Link>
        {!user && (
          <Link to="/register" className="bg-dark-800 hover:bg-dark-700 text-dark-200 px-8 py-3 rounded-xl font-semibold text-lg transition border border-dark-600">
            Get Started
          </Link>
        )}
      </div>
      <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl">
        <div className="bg-dark-900 rounded-xl p-6 border border-dark-700">
          <div className="text-3xl mb-3">🌍</div>
          <h3 className="text-lg font-semibold text-dark-100 mb-2">Create Worlds</h3>
          <p className="text-dark-400 text-sm">Build roleplay worlds with rich lore, timelines, and events for others to explore.</p>
        </div>
        <div className="bg-dark-900 rounded-xl p-6 border border-dark-700">
          <div className="text-3xl mb-3">⚡</div>
          <h3 className="text-lg font-semibold text-dark-100 mb-2">Join Events</h3>
          <p className="text-dark-400 text-sm">Participate in big and small events, create posts, and interact with the community.</p>
        </div>
        <div className="bg-dark-900 rounded-xl p-6 border border-dark-700">
          <div className="text-3xl mb-3">🏆</div>
          <h3 className="text-lg font-semibold text-dark-100 mb-2">Earn Credits</h3>
          <p className="text-dark-400 text-sm">Gain citizen credits through interactions and climb the world leaderboard.</p>
        </div>
      </div>
    </div>
  );
}