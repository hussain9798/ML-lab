import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AlertCircle, KeyRound, Loader2, Terminal } from 'lucide-react';
import { authAPI } from '../services/api';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [challenge, setChallenge] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const requestReset = async (event) => {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const response = await authAPI.forgotPassword(email);
      setChallenge(response.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Could not send reset code.');
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (event) => {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await authAPI.resetPassword({
        email: challenge.email,
        temp_token: challenge.temp_token,
        otp,
        password,
      });
      navigate('/login', { replace: true, state: { message: 'Password reset successfully.' } });
    } catch (err) {
      setError(err.response?.data?.error || 'Could not reset password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[75vh] flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full glass-panel rounded-2xl p-8 border border-slate-800 shadow-2xl bg-dark-900/90">
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-brand-600 to-cyan-500 flex items-center justify-center mx-auto mb-3">
            <Terminal className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-white">Reset Password</h2>
          <p className="text-xs text-slate-400 mt-1">Recover your account with an email verification code</p>
        </div>
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}
        {!challenge ? (
          <form onSubmit={requestReset} className="space-y-4">
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="w-full px-3.5 py-2 rounded-lg bg-dark-950 border border-slate-700 text-sm text-white" />
            <button type="submit" disabled={loading} className="w-full py-2.5 rounded-lg text-sm font-bold text-white bg-brand-600 disabled:opacity-50">
              {loading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : <><KeyRound className="w-4 h-4 inline mr-2" />Send Reset Code</>}
            </button>
          </form>
        ) : (
          <form onSubmit={resetPassword} className="space-y-4">
            <p className="p-3 rounded-lg bg-brand-500/10 border border-brand-500/30 text-brand-200 text-xs">
              Enter the 6-digit code sent to <strong>{challenge.email}</strong>.
            </p>
            <input type="text" inputMode="numeric" pattern="[0-9]{6}" maxLength={6} required value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))} placeholder="6-digit code" className="w-full px-3.5 py-2 rounded-lg bg-dark-950 border border-slate-700 text-sm text-white text-center tracking-[0.35em]" />
            <input type="password" minLength={6} required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="New password (at least 6 characters)" className="w-full px-3.5 py-2 rounded-lg bg-dark-950 border border-slate-700 text-sm text-white" />
            <button type="submit" disabled={loading} className="w-full py-2.5 rounded-lg text-sm font-bold text-white bg-brand-600 disabled:opacity-50">
              {loading ? 'Resetting...' : 'Reset Password'}
            </button>
          </form>
        )}
        <div className="mt-6 text-center text-xs text-slate-400">
          <Link to="/login" className="text-brand-400 hover:underline font-semibold">Back to sign in</Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
