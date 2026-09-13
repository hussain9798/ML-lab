import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { progressAPI, experimentsAPI } from '../services/api';
import MetricsCard from '../components/MetricsCard';
import { 
  CheckCircle2, 
  Clock, 
  CircleDashed, 
  Award, 
  FlaskConical, 
  History, 
  ArrowRight, 
  BookOpen, 
  Code2, 
  ChevronRight,
  Loader2 
} from 'lucide-react';

const Dashboard = () => {
  const { user } = useAuth();
  const [progress, setProgress] = useState(null);
  const [recentExperiments, setRecentExperiments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [progRes, expRes] = await Promise.all([
          progressAPI.getProgress(),
          experimentsAPI.getAll({ limit: 5 })
        ]);
        setProgress(progRes.data);
        setRecentExperiments(expRes.data.experiments || []);
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-3">
        <Loader2 className="w-8 h-8 text-brand-500 animate-spin" />
        <p className="text-xs text-slate-400 font-mono">Loading your ML learning dashboard...</p>
      </div>
    );
  }

  const overallPct = progress?.overall_percentage || 0;
  const algos = progress?.algorithm_progress || [];

  // Find the first in-progress or not-started algorithm for "Continue Learning"
  const continueAlgo = algos.find((a) => a.status === 'In Progress') || algos.find((a) => a.status === 'Not Started') || algos[0];

  return (
    <div className="space-y-8 pb-16">
      {/* Welcome Banner */}
      <div className="glass-panel rounded-2xl p-6 sm:p-8 border border-slate-800 bg-gradient-to-r from-dark-900 via-dark-850 to-brand-950/40 relative overflow-hidden">
        <div className="max-w-2xl">
          <span className="text-xs font-mono font-bold text-brand-400 uppercase tracking-wider">Student Laboratory Dashboard</span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mt-1 mb-2">
            Welcome back, {user?.name}! 👋
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Track your progress across machine learning algorithms from first principles. Complete code implementations, verify with Scikit-learn, and earn your verified milestones.
          </p>
        </div>

        {/* Continue Learning CTA Pill */}
        {continueAlgo && (
          <div className="mt-6 inline-flex flex-col sm:flex-row items-start sm:items-center gap-3 p-3 rounded-xl bg-slate-900/80 border border-slate-700/80">
            <div className="flex items-center space-x-2">
              <span className="text-xs text-slate-400 font-medium">Continue Learning:</span>
              <span className="text-xs font-bold text-white font-mono">{continueAlgo.name}</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-brand-500/15 text-brand-400 border border-brand-500/30">
                {continueAlgo.status}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <Link
                to={`/docs/${continueAlgo.slug}`}
                className="text-xs px-2.5 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
              >
                Read Docs
              </Link>
              <Link
                to={`/lab/${continueAlgo.slug}`}
                className="text-xs px-3 py-1 rounded-md bg-brand-600 hover:bg-brand-500 text-white font-semibold transition-colors flex items-center space-x-1"
              >
                <span>Open in Lab</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Stats Cards Row */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <MetricsCard
          title="Overall Progress"
          value={`${overallPct}%`}
          subtitle="All algorithms"
          icon={Award}
          badge={overallPct >= 50 ? 'Great Progress' : 'In Training'}
          badgeType={overallPct >= 50 ? 'success' : 'info'}
        />
        <MetricsCard
          title="Completed"
          value={progress?.completed_count ?? 0}
          subtitle="Verified by test"
          icon={CheckCircle2}
          badge="Verified"
          badgeType="success"
        />
        <MetricsCard
          title="In Progress"
          value={progress?.in_progress_count ?? 0}
          subtitle="Currently coding"
          icon={Clock}
          badge="Active"
          badgeType="warning"
        />
        <MetricsCard
          title="Tests Passed"
          value={progress?.tests_passed_count ?? 0}
          subtitle="Tolerance met"
          icon={FlaskConical}
          badge="Pass"
          badgeType="success"
        />
        <MetricsCard
          title="Total Experiments"
          value={progress?.total_experiments ?? 0}
          subtitle="Saved runs"
          icon={History}
        />
      </div>

      {/* Progress Bar Visual */}
      <div className="glass-panel p-5 rounded-xl border border-slate-800">
        <div className="flex justify-between items-center text-xs font-semibold mb-2">
          <span className="text-slate-300">Curriculum Completion</span>
          <span className="text-brand-400 font-mono">{overallPct}% Completed</span>
        </div>
        <div className="w-full h-3 rounded-full bg-slate-800 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-brand-500 to-cyan-400 transition-all duration-500 rounded-full"
            style={{ width: `${overallPct}%` }}
          ></div>
        </div>
      </div>

      {/* Algorithm Progress Checklist Grid */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="text-base font-bold text-white tracking-tight">Machine Learning Curriculum</h3>
            <p className="text-xs text-slate-400">Implement algorithms from scratch and pass the side-by-side benchmark</p>
          </div>
          <Link to="/algorithms" className="text-xs text-brand-400 hover:underline flex items-center space-x-1">
            <span>Explore All</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {algos.map((algo) => {
            const m = algo.milestones || {};
            const isCompleted = algo.status === 'Completed';
            return (
              <div
                key={algo.slug}
                className={`glass-panel rounded-xl p-5 border flex flex-col justify-between transition-all ${
                  isCompleted
                    ? 'border-emerald-500/30 bg-emerald-950/10'
                    : 'border-slate-800 hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                      {algo.category}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        isCompleted
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : algo.status === 'In Progress'
                          ? 'bg-amber-500/20 text-amber-400'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {algo.status}
                    </span>
                  </div>

                  <h4 className="text-base font-bold text-white mb-3">{algo.name}</h4>

                  {/* Milestones Checklist */}
                  <div className="space-y-1.5 text-xs font-mono">
                    <div className="flex items-center space-x-2">
                      <span className={m.doc_read ? 'text-emerald-400 font-bold' : 'text-slate-600'}>
                        {m.doc_read ? '✓' : '○'}
                      </span>
                      <span className={m.doc_read ? 'text-slate-200' : 'text-slate-500'}>Documentation Read</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={m.scratch_done ? 'text-emerald-400 font-bold' : 'text-slate-600'}>
                        {m.scratch_done ? '✓' : '○'}
                      </span>
                      <span className={m.scratch_done ? 'text-slate-200' : 'text-slate-500'}>Scratch Implemented</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={m.test_passed ? 'text-emerald-400 font-bold' : 'text-slate-600'}>
                        {m.test_passed ? '✓' : '○'}
                      </span>
                      <span className={m.test_passed ? 'text-slate-200' : 'text-slate-500'}>Benchmark Passed</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={m.compared ? 'text-emerald-400 font-bold' : 'text-slate-600'}>
                        {m.compared ? '✓' : '○'}
                      </span>
                      <span className={m.compared ? 'text-slate-200' : 'text-slate-500'}>Comparison Verified</span>
                    </div>
                  </div>
                </div>

                <div className="pt-4 mt-4 border-t border-slate-800/80 flex items-center space-x-2">
                  <Link
                    to={`/docs/${algo.slug}`}
                    className="flex-1 text-center py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 transition-colors"
                  >
                    Read Docs
                  </Link>
                  <Link
                    to={`/lab/${algo.slug}`}
                    className="flex-1 text-center py-1.5 rounded-lg text-xs font-semibold text-white bg-brand-600 hover:bg-brand-500 transition-colors"
                  >
                    Open Lab
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Experiments Table */}
      {recentExperiments.length > 0 && (
        <div className="glass-panel rounded-xl border border-slate-800 p-5 bg-dark-900/90 shadow-xl">
          <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-800">
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">Recent Experiments</h3>
              <p className="text-xs text-slate-400">Previous comparison runs and test results</p>
            </div>
            <Link to="/experiments" className="text-xs text-brand-400 hover:underline">
              View All
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="text-slate-400 border-b border-slate-800">
                  <th className="py-2.5 px-3">Algorithm</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Primary Metric</th>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {recentExperiments.map((exp) => (
                  <tr key={exp._id} className="hover:bg-slate-800/40">
                    <td className="py-2.5 px-3 font-bold text-white capitalize">
                      {exp.algorithm_slug.replace('-', ' ')}
                    </td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] uppercase font-bold ${
                          exp.status === 'passed'
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : 'bg-rose-500/20 text-rose-400'
                        }`}
                      >
                        {exp.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-300">
                      {exp.verdict?.primary_metric
                        ? `${exp.verdict.primary_metric}: ${exp.verdict.scratch_metric}`
                        : '--'}
                    </td>
                    <td className="py-2.5 px-3 text-slate-400 text-[11px]">
                      {exp.created_at ? new Date(exp.created_at).toLocaleDateString() : '--'}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <Link
                        to={`/lab/${exp.algorithm_slug}`}
                        className="text-brand-400 hover:text-brand-300 font-sans font-medium hover:underline"
                      >
                        Re-open Lab →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
