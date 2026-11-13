import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChefHat, ArrowRight, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const RegisterPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await register(email, password, fullName);
      navigate('/onboarding');
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-cream-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl border border-cream-200 shadow-premium p-8 sm:p-10">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-forest-800 text-white flex items-center justify-center mx-auto mb-4 shadow-soft">
            <ChefHat className="w-7 h-7" />
          </div>
          <h2 className="font-serif font-bold text-2xl text-forest-950">Join AutoChef AI</h2>
          <p className="text-xs text-forest-600 mt-1">Smart, allergy-safe cooking powered by ML</p>
        </div>

        {error && (
          <div className="mb-6 p-3.5 rounded-xl bg-terracotta-50 border border-terracotta-100 flex items-center gap-2.5 text-xs text-terracotta-600">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-forest-700 mb-1.5">
              Full Name
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-xl border border-cream-300 bg-cream-50/50 text-forest-900 text-sm focus:outline-none focus:ring-2 focus:ring-forest-600 focus:bg-white transition"
              placeholder="Chef Jamie"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-forest-700 mb-1.5">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-xl border border-cream-300 bg-cream-50/50 text-forest-900 text-sm focus:outline-none focus:ring-2 focus:ring-forest-600 focus:bg-white transition"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-forest-700 mb-1.5">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full px-4 py-3 rounded-xl border border-cream-300 bg-cream-50/50 text-forest-900 text-sm focus:outline-none focus:ring-2 focus:ring-forest-600 focus:bg-white transition"
              placeholder="At least 6 characters"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-4 rounded-xl bg-forest-800 text-white font-bold text-sm hover:bg-forest-900 transition shadow-soft flex items-center justify-center gap-2 disabled:opacity-60"
            >
              <span>{loading ? 'Creating Account...' : 'Continue to Personalization'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>

        <div className="mt-8 pt-6 border-t border-cream-100 text-center">
          <p className="text-xs text-forest-600">
            Already have an account?{' '}
            <Link to="/login" className="font-bold text-forest-800 hover:text-forest-600">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
