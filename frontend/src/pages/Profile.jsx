import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { User, Mail, Shield, Save, Check, Loader2 } from 'lucide-react';

const Profile = () => {
  const { user, updateProfile, requestEmailChange, confirmEmailChange, logout } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [emailOtp, setEmailOtp] = useState('');
  const [emailChallenge, setEmailChallenge] = useState(null);
  const [emailSaving, setEmailSaving] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await updateProfile(name);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  const handleEmailRequest = async (e) => {
    e.preventDefault();
    setError(null);
    setEmailSaving(true);
    try {
      const res = await requestEmailChange(email);
      setEmailChallenge(res.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Could not send email verification code.');
    } finally {
      setEmailSaving(false);
    }
  };

  const handleEmailConfirm = async (e) => {
    e.preventDefault();
    setError(null);
    setEmailSaving(true);
    try {
      await confirmEmailChange(emailChallenge, emailOtp);
      logout();
    } catch (err) {
      setError(err.response?.data?.error || 'Could not update email address.');
      setEmailSaving(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto py-8 space-y-6 pb-16">
      <div className="glass-panel rounded-2xl p-6 sm:p-8 border border-slate-800 bg-dark-900/90 shadow-xl">
        <div className="flex items-center space-x-4 mb-6 pb-6 border-b border-slate-800">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-brand-600 to-cyan-500 flex items-center justify-center text-xl font-bold text-white shadow-lg shadow-brand-500/25 uppercase">
            {user?.name?.charAt(0) || 'U'}
          </div>
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">{user?.name}</h2>
            <div className="flex items-center space-x-2 mt-1">
              <span className="text-xs font-mono text-slate-400">{user?.email}</span>
              <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-brand-500/15 text-brand-400 border border-brand-500/30">
                {user?.role}
              </span>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
            {error}
          </div>
        )}

        {saved && (
          <div className="mb-4 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center space-x-2">
            <Check className="w-4 h-4 text-emerald-400" />
            <span>Profile updated successfully!</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Full Name</label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-xl bg-dark-950 border border-slate-700 text-xs text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Email Address</label>
            {!emailChallenge ? (
              <form onSubmit={handleEmailRequest} className="flex gap-2">
                <div className="relative flex-1">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 rounded-xl bg-dark-950 border border-slate-700 text-xs text-white"
                  />
                </div>
                <button type="submit" disabled={emailSaving} className="px-3 rounded-xl text-xs font-bold text-white bg-slate-700 hover:bg-slate-600 disabled:opacity-50">
                  Change
                </button>
              </form>
            ) : (
              <form onSubmit={handleEmailConfirm} className="space-y-2">
                <p className="text-[11px] text-brand-300">Enter the OTP sent to {emailChallenge.email}.</p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]{6}"
                    maxLength={6}
                    required
                    value={emailOtp}
                    onChange={(e) => setEmailOtp(e.target.value.replace(/\D/g, ''))}
                    placeholder="6-digit OTP"
                    className="flex-1 px-3 py-2 rounded-xl bg-dark-950 border border-slate-700 text-xs text-white"
                  />
                  <button type="submit" disabled={emailSaving} className="px-3 rounded-xl text-xs font-bold text-white bg-brand-600 hover:bg-brand-500 disabled:opacity-50">
                    Verify
                  </button>
                </div>
              </form>
            )}
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full py-2.5 rounded-xl text-xs font-bold text-white bg-brand-600 hover:bg-brand-500 shadow-md shadow-brand-500/25 transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Update Profile</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Profile;
