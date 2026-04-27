import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function Login() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await login(username, password);
            navigate('/worlds');
        } catch (err) {
            setError(err.response?.data?.error || 'Login failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-[70vh]">
            <div className="bg-dark-900 border border-dark-700 rounded-2xl p-8 w-full max-w-md">
                <h2 className="text-2xl font-bold text-center mb-6 text-dark-100">Login to LACEBO</h2>
                {error && <div className="bg-red-900/30 border border-red-700 text-red-300 text-sm rounded-lg p-3 mb-4">{error}</div>}
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm text-dark-400 mb-1">Username</label>
                        <input type="text" value={username} onChange={e => setUsername(e.target.value)} required
                            className="w-full bg-dark-800 border border-dark-600 rounded-lg px-4 py-2.5 text-dark-100 focus:outline-none focus:border-primary-500 transition" />
                    </div>
                    <div>
                        <label className="block text-sm text-dark-400 mb-1">Password</label>
                        <input type="password" value={password} onChange={e => setPassword(e.target.value)} required
                            className="w-full bg-dark-800 border border-dark-600 rounded-lg px-4 py-2.5 text-dark-100 focus:outline-none focus:border-primary-500 transition" />
                    </div>
                    <button type="submit" disabled={loading}
                        className="w-full bg-primary-600 hover:bg-primary-500 text-white py-2.5 rounded-lg font-medium transition disabled:opacity-50">
                        {loading ? 'Logging in...' : 'Login'}
                    </button>
                </form>
                <p className="text-center text-sm text-dark-400 mt-4">
                    Don't have an account? <Link to="/register" className="text-primary-400 hover:underline">Register</Link>
                </p>
            </div>
        </div>
    );
}