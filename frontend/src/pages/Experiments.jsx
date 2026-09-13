import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { experimentsAPI } from '../services/api';
import { History, Trash2, ArrowRight, CheckCircle2, XCircle, FlaskConical, Calendar, Loader2 } from 'lucide-react';

const Experiments = () => {
  const [experiments, setExperiments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterAlgo, setFilterAlgo] = useState('');

  const fetchExperiments = async () => {
    setLoading(true);
    try {
      const res = await experimentsAPI.getAll({ algorithm_slug: filterAlgo || undefined });
      setExperiments(res.data.experiments || []);
    } catch (err) {
      console.error('Failed to load experiments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExperiments();
  }, [filterAlgo]);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this experiment record?')) return;
    try {
      await experimentsAPI.delete(id);
      setExperiments((prev) => prev.filter((e) => e._id !== id));
    } catch (err) {
      alert('Failed to delete experiment');
    }
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Header */}
      <div className="glass-panel rounded-2xl p-6 sm:p-8 border border-slate-800 bg-dark-900/90 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-brand-400 text-xs font-mono font-bold uppercase mb-1">
            <History className="w-4 h-4" />
            <span>Experiment History</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Saved Laboratory Experiments
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1">
            Review past comparison runs, tolerance test metrics, and experimental notes.
          </p>
        </div>

        <div>
          <Link
            to="/lab/linear-regression"
            className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-brand-600 hover:bg-brand-500 shadow-sm transition-all inline-flex items-center space-x-1.5"
          >
            <FlaskConical className="w-4 h-4" />
            <span>Open Laboratory</span>
          </Link>
        </div>
      </div>

      {/* Experiments List */}
      {loading ? (
        <div className="min-h-[300px] flex flex-col items-center justify-center space-y-3">
          <Loader2 className="w-8 h-8 text-brand-500 animate-spin" />
          <p className="text-xs text-slate-400 font-mono">Loading saved experiments...</p>
        </div>
      ) : experiments.length === 0 ? (
        <div className="glass-panel rounded-2xl p-12 text-center border border-slate-800">
          <History className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-white mb-1">No experiments logged yet</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto mb-4">
            Run a comparison test in the Laboratory and click "Save Experiment" to record your model's metrics and code.
          </p>
          <Link
            to="/lab/linear-regression"
            className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-brand-600 hover:bg-brand-500 transition-colors inline-block"
          >
            Launch Laboratory
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {experiments.map((exp) => {
            const passed = exp.status === 'passed';
            return (
              <div
                key={exp._id}
                className="glass-panel rounded-xl p-5 border border-slate-800 bg-dark-900/90 shadow-lg flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold uppercase text-white font-mono">
                      {exp.algorithm_slug.replace('-', ' ')}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase flex items-center space-x-1 ${
                        passed
                          ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                          : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                      }`}
                    >
                      {passed ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                      <span>{exp.status}</span>
                    </span>
                  </div>

                  {exp.notes && (
                    <p className="text-xs text-slate-300 italic mb-3 bg-slate-950/60 p-2.5 rounded-lg border border-slate-800">
                      "{exp.notes}"
                    </p>
                  )}

                  {/* Metrics snippet */}
                  <div className="p-3 rounded-lg bg-slate-950/40 border border-slate-800/80 font-mono text-xs space-y-1 mb-4">
                    <div className="flex justify-between text-slate-400">
                      <span>Primary Metric:</span>
                      <span className="text-cyan-400 font-bold">
                        {exp.verdict?.primary_metric}: {exp.verdict?.scratch_metric}
                      </span>
                    </div>
                    {exp.verdict?.difference !== undefined && (
                      <div className="flex justify-between text-slate-400">
                        <span>Tolerance Delta Δ:</span>
                        <span className="text-slate-300">{exp.verdict.difference}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-1 text-slate-500 text-[11px] font-mono">
                    <Calendar className="w-3 h-3" />
                    <span>{new Date(exp.created_at).toLocaleDateString()}</span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleDelete(exp._id)}
                      className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-rose-400 transition-colors"
                      title="Delete experiment"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    <Link
                      to={`/lab/${exp.algorithm_slug}`}
                      className="text-xs font-semibold text-brand-400 hover:underline flex items-center space-x-1"
                    >
                      <span>Re-open in Lab</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Experiments;
