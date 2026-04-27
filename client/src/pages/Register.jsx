import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function Register() {
    const [form, setForm] = useState({ username: '', email: '', password: '', display_name: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { register } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await register(form);
            navigate('/worlds');
        } catch (err) {
            setError(err.response?.data?.error || 'Registration failed');
        } finally {
            setLoading(false);
        }
    };

    const update = (field) => (e) => setForm({ ...form, [field]: e.target.value });

    return (
        <div className="flex items-center justify-center min-h-[70vh]">
            <div className="bg-dark-900 border border-dark-700 rounded-2xl p-8 w-full max-w-md">
                <h2 className="text-2xl font-bold text-center mb-6 text-dark-100">Join LACEBO</h2>
                {error && <div className="bg-red-900/30 border border-red-700 text-red-300 text-sm rounded-lg p-3 mb-4">{error}</div>}
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm text-dark-400 mb-1">Display Name</label>
                        <input type="text" value={form.display_name} onChange={update('display_name')} required
                            className="w-full bg-dark-800 border border-dark-600 rounded-lg px-4 py-2.5 text-dark-100 focus:outline-none focus:border-primary-500 transition" />
                    </div>
                    <div>
                        <label className="block text-sm text-dark-400 mb-1">Username</label>
                        <input type="text" value={form.username} onChange={update('username')} required
                            className="w-full bg-dark-800 border border-dark-600 rounded-lg px-4 py-2.5 text-dark-100 focus:outline-none focus:border-primary-500 transition" />
                    </div>
                    <div>
                        <label className="block text-sm text-dark-400 mb-1">Email</label>
                        <input type="email" value={form.email} onChange={update('email')} required
                            className="w-full bg-dark-800 border border-dark-600 rounded-lg px-4 py-2.5 text-dark-100 focus:outline-none focus:border-primary-500 transition" />
                    </div>
                    <div>
                        <label className="block text-sm text-dark-400 mb-1">Password</label>
                        <input type="password" value={form.password} onChange={update('password')} required minLength={6}
                            className="w-full bg-dark-800 border border-dark-600 rounded-lg px-4 py-2.5 text-dark-100 focus:outline-none focus:border-primary-500 transition" />
                    </div>
                    <button type="submit" disabled={loading}
                        className="w-full bg-primary-600 hover:bg-primary-500 text-white py-2.5 rounded-lg font-medium transition disabled:opacity-50">
                        {loading ? 'Creating account...' : 'Create Account'}
                    </button>
                </form>
                <p className="text-center text-sm text-dark-400 mt-4">
                    Already have an account? <Link to="/login" className="text-primary-400 hover:underline">Login</Link>
                </p>
            </div>
        </div>
    );
}