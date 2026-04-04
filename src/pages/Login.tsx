import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Shield, Mail, Lock, User, AlertCircle } from 'lucide-react';

export const Login: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: ''
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (isLogin) {
        await login(formData.email, formData.password);
      } else {
        await register(formData.email, formData.password, formData.name);
      }
      navigate('/');
    } catch (err: unknown) {
      setError((err as Error)?.message || 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden">
      {/* Decorative 3D mesh background effects */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/20 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-600/20 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute top-[20%] right-[10%] w-[20%] h-[20%] bg-sky-500/10 rounded-full blur-[80px] pointer-events-none"></div>

      <div className="max-w-md w-full relative z-10">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="p-4 bg-slate-900/80 rounded-2xl border border-blue-500/30 shadow-[0_0_30px_rgba(37,99,235,0.3)]">
              <Shield className="h-12 w-12 text-blue-400" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">RedTeam Automation</h1>
          <p className="text-blue-200/70">Next-Gen Vulnerability Engine</p>
        </div>

        <div className="glass-card p-8">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-white text-center">
              {isLogin ? 'Sign In' : 'Create Account'}
            </h2>
            <p className="text-slate-400 text-center mt-2 text-sm">
              {isLogin ? 'Welcome back! Please sign in to continue.' : 'Join our platform to start hunting bugs.'}
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-900/30 border border-red-500/50 rounded-md flex items-center">
              <AlertCircle className="h-5 w-5 text-red-400 mr-2 flex-shrink-0" />
              <span className="text-red-200 text-sm">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {!isLogin && (
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-slate-300 mb-1">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-5 w-5 text-slate-500" />
                  <input
                    type="text"
                    id="name"
                    name="name"
                    required={!isLogin}
                    value={formData.name}
                    onChange={handleInputChange}
                    className="sharp-input pl-10 w-full py-2.5"
                    placeholder="Enter your full name"
                  />
                </div>
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-5 w-5 text-slate-500" />
                <input
                  type="email"
                  id="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleInputChange}
                  className="sharp-input pl-10 w-full py-2.5"
                  placeholder="Enter your email"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-300 mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-5 w-5 text-slate-500" />
                <input
                  type="password"
                  id="password"
                  name="password"
                  required
                  value={formData.password}
                  onChange={handleInputChange}
                  className="sharp-input pl-10 w-full py-2.5"
                  placeholder="Enter your password"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="sharp-btn w-full py-3 mt-4 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  {isLogin ? 'Signing In...' : 'Creating Account...'}
                </div>
              ) : (
                isLogin ? 'Sign In' : 'Create Account'
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors"
            >
              {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
            </button>
          </div>
        </div>

        <div className="mt-8 text-center">
          <p className="text-slate-500 text-sm">
            By {isLogin ? 'signing in' : 'creating an account'}, you agree to our{' '}
            <Link to="/terms" className="text-blue-400 hover:text-blue-300 transition-colors">Terms of Service</Link>{' '}
            and{' '}
            <Link to="/privacy" className="text-blue-400 hover:text-blue-300 transition-colors">Privacy Policy</Link>
          </p>
        </div>
      </div>
    </div>
  );
};