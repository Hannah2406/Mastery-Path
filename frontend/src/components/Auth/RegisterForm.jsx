import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';

export default function RegisterForm({ onSwitchToLogin }) {
  const { register } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    setLoading(true);
    try {
      await register(email, password);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full">
      <h2 className="font-heading text-xl font-semibold text-[#1F2937] mb-5">Register</h2>
      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="bg-[#FEE2E2] border border-[#EF4444]/30 text-[#B91C1C] p-3 rounded-xl text-sm">
            {error}
          </div>
        )}
        <div>
          <label className="block text-sm font-medium text-[#1F2937] mb-1.5">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-3 bg-[#FBFBFF] border border-[#E9E7F5] rounded-xl text-[#1F2937] placeholder-[#6B7280] focus:outline-none focus:ring-2 focus:ring-[#7C5CFF]/40 focus:border-[#7C5CFF]/50"
            placeholder="you@example.com"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-[#1F2937] mb-1.5">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-3 bg-[#FBFBFF] border border-[#E9E7F5] rounded-xl text-[#1F2937] placeholder-[#6B7280] focus:outline-none focus:ring-2 focus:ring-[#7C5CFF]/40 focus:border-[#7C5CFF]/50"
            placeholder="••••••••"
            required
            minLength={6}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-[#1F2937] mb-1.5">Confirm Password</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full px-4 py-3 bg-[#FBFBFF] border border-[#E9E7F5] rounded-xl text-[#1F2937] placeholder-[#6B7280] focus:outline-none focus:ring-2 focus:ring-[#7C5CFF]/40 focus:border-[#7C5CFF]/50"
            placeholder="••••••••"
            required
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-[#FF6FAE] hover:bg-[#F2559A] text-white py-3 px-4 rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg shadow-[#FF6FAE]/20"
        >
          {loading ? 'Creating account...' : 'Register'}
        </button>
      </form>
      <p className="mt-5 text-center text-sm text-[#6B7280]">
        Already have an account?{' '}
        <button onClick={onSwitchToLogin} className="text-[#7C5CFF] hover:text-[#6B4CE6] font-medium">
          Login
        </button>
      </p>
    </div>
  );
}
