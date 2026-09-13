import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { adminAPI } from '../services/api';
import MetricsCard from '../components/MetricsCard';
import { 
  ShieldCheck, 
  Users, 
  Code2, 
  BookOpen, 
  History, 
  CheckCircle2, 
  Plus, 
  ArrowRight,
  Loader2 
} from 'lucide-react';

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        const res = await adminAPI.getStats();
        setStats(res.data.stats);
        setRecentActivity(res.data.recent_activity || []);
      } catch (err) {
        console.error('Failed to load admin stats:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAdminData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-3">
        <Loader2 className="w-8 h-8 text-amber-400 animate-spin" />
        <p className="text-xs text-slate-400 font-mono">Loading administrator metrics...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-16">
      {/* Admin Header */}
      <div className="glass-panel rounded-2xl p-6 sm:p-8 border border-amber-500/30 bg-dark-900/90 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-amber-400 text-xs font-mono font-bold uppercase mb-1">
              <ShieldCheck className="w-4 h-4" />
              <span>Administration Control Center</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Platform Overview
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1">
              Manage algorithms, curriculum documentation, test tolerances, and platform users.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <Link
              to="/admin/algorithms"
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-900 bg-amber-400 hover:bg-amber-300 shadow-md transition-all flex items-center space-x-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Add Algorithm</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <MetricsCard
          title="Total Users"
          value={stats?.total_users ?? 0}
          subtitle="Registered accounts"
          icon={Users}
        />
        <MetricsCard
          title="Algorithms"
          value={stats?.total_algorithms ?? 0}
          subtitle={`${stats?.published_algorithms || 0} published`}
          icon={Code2}
          badge="Live"
          badgeType="success"
        />
        <MetricsCard
          title="Documentation"
          value={stats?.total_documentation ?? 0}
          subtitle="Curriculum guides"
          icon={BookOpen}
        />
        <MetricsCard
          title="Experiments"
          value={stats?.total_experiments ?? 0}
          subtitle="Executed runs"
          icon={History}
        />
        <MetricsCard
          title="Tests Passed"
          value={stats?.tests_passed ?? 0}
          subtitle="Tolerance met"
          icon={CheckCircle2}
          badge="Verified"
          badgeType="success"
        />
      </div>

      {/* Admin Navigation Quick-Links */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link
          to="/admin/algorithms"
          className="glass-panel p-5 rounded-xl border border-slate-800 hover:border-amber-500/40 transition-all flex items-center justify-between"
        >
          <div>
            <h4 className="text-sm font-bold text-white mb-1">Algorithm Management</h4>
            <p className="text-xs text-slate-400">Configure starter code, tolerances & metrics</p>
          </div>
          <ArrowRight className="w-4 h-4 text-amber-400" />
        </Link>

        <Link
          to="/admin/documentation"
          className="glass-panel p-5 rounded-xl border border-slate-800 hover:border-amber-500/40 transition-all flex items-center justify-between"
        >
          <div>
            <h4 className="text-sm font-bold text-white mb-1">Documentation Editor</h4>
            <p className="text-xs text-slate-400">Write explanations, formulas & interview Qs</p>
          </div>
          <ArrowRight className="w-4 h-4 text-amber-400" />
        </Link>

        <Link
          to="/admin/users"
          className="glass-panel p-5 rounded-xl border border-slate-800 hover:border-amber-500/40 transition-all flex items-center justify-between"
        >
          <div>
            <h4 className="text-sm font-bold text-white mb-1">User Management</h4>
            <p className="text-xs text-slate-400">View user progress and manage roles</p>
          </div>
          <ArrowRight className="w-4 h-4 text-amber-400" />
        </Link>
      </div>

      {/* Recent Platform Activity */}
      <div className="glass-panel rounded-xl border border-slate-800 p-5 bg-dark-900/90 shadow-xl">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4 font-mono">
          Recent Laboratory Executions Across Platform
        </h3>

        {recentActivity.length === 0 ? (
          <p className="text-xs text-slate-500 italic py-4">No recent activity found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400">
                  <th className="py-2.5 px-3">Student</th>
                  <th className="py-2.5 px-3">Algorithm</th>
                  <th className="py-2.5 px-3">Verdict</th>
                  <th className="py-2.5 px-3">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {recentActivity.map((act) => (
                  <tr key={act._id} className="hover:bg-slate-800/40">
                    <td className="py-2.5 px-3 font-semibold text-white">{act.user_name}</td>
                    <td className="py-2.5 px-3 text-cyan-400 capitalize">{act.algorithm_slug?.replace('-', ' ')}</td>
                    <td className="py-2.5 px-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        act.status === 'passed' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                      }`}>
                        {act.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-400 text-[11px]">
                      {act.created_at ? new Date(act.created_at).toLocaleString() : '--'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
