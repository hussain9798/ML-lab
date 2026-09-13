import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Terminal, LogIn, AlertCircle, Loader2 } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [challenge, setChallenge] = useState(null);
  const [otp, setOtp] = useState('');

  const { login, verifyOtp, resendOtp } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/dashboard';
  const getErrorMessage = (err, fallback) => {
    const message = err.response?.data?.error;
    return typeof message === 'string' ? message : fallback;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const result = await login(email, password);
      if (result.requires_otp) {
        setChallenge(result);
      } else {
        navigate(from, { replace: true });
      }
    } catch (err) {
      setError(getErrorMessage(err, 'Invalid email or password.'));
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const authenticatedUser = await verifyOtp(challenge, otp);
      navigate(
        authenticatedUser.role === 'admin' ? '/admin/dashboard' : from,
        { replace: true }
      );
    } catch (err) {
      setError(getErrorMessage(err, 'Invalid verification code.'));
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setError(null);
    try {
      const res = await resendOtp(challenge);
      setChallenge((current) => ({ ...current, ...res.data }));
      setOtp('');
    } catch (err) {
      setError(getErrorMessage(err, 'Could not resend verification code.'));
    }
  };

  return (
    <div className="min-h-[75vh] flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full glass-panel rounded-2xl p-8 border border-slate-800 shadow-2xl bg-dark-900/90">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-brand-600 to-cyan-500 flex items-center justify-center mx-auto mb-3 shadow-lg shadow-brand-500/25">
            <Terminal className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Welcome Back</h2>
          <p className="text-xs text-slate-400 mt-1">Sign in to access your ML Laboratory experiments</p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        {challenge ? (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div className="p-3 rounded-lg bg-brand-500/10 border border-brand-500/30 text-brand-200 text-xs">
              A 6-digit verification code was sent to <strong>{challenge.email}</strong>.
            </div>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]{6}"
              maxLength={6}
              required
              autoFocus
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
              placeholder="Enter 6-digit code"
              className="w-full px-3.5 py-2 rounded-lg bg-dark-950 border border-slate-700 text-sm text-white tracking-[0.35em] text-center focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
            <button type="submit" disabled={loading} className="w-full py-2.5 rounded-lg text-sm font-bold text-white bg-brand-600 hover:bg-brand-500 disabled:opacity-50">
              {loading ? 'Verifying...' : 'Verify & Sign In'}
            </button>
            <button type="button" onClick={handleResendOtp} className="w-full text-xs text-brand-400 hover:underline">
              Resend code
            </button>
          </form>
        ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Email Address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full px-3.5 py-2 rounded-lg bg-dark-950 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3.5 py-2 rounded-lg bg-dark-950 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-lg text-sm font-bold text-white bg-brand-600 hover:bg-brand-500 shadow-md shadow-brand-500/25 transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <LogIn className="w-4 h-4" />
                <span>Sign In</span>
              </>
            )}
          </button>
        </form>
        )}

        <div className="mt-6 text-center text-xs text-slate-400">
          <Link to="/forgot-password" className="text-brand-400 hover:underline font-semibold">
            Forgot password?
          </Link>
          <span className="mx-2 text-slate-600">|</span>
          Don't have an account yet?{' '}
          <Link to="/register" className="text-brand-400 hover:underline font-semibold">
            Create Account
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
