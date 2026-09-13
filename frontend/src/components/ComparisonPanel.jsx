import React from 'react';
import { CheckCircle2, XCircle, AlertTriangle, Zap, Check, HelpCircle, ArrowRight } from 'lucide-react';

const ComparisonPanel = ({ 
  scratchResult, 
  builtinResult, 
  verdict, 
  category = 'regression',
  primaryMetric = 'r2_score',
  onSaveExperiment
}) => {
  if (!scratchResult && !builtinResult) {
    return (
      <div className="glass-panel rounded-xl p-8 border border-slate-800 text-center">
        <div className="w-12 h-12 rounded-full bg-slate-800/80 border border-slate-700 flex items-center justify-center mx-auto mb-3 text-slate-400">
          <HelpCircle className="w-6 h-6" />
        </div>
        <h3 className="text-base font-semibold text-white mb-1">No Comparison Run Yet</h3>
        <p className="text-xs text-slate-400 max-w-md mx-auto">
          Write your implementation in the editor and click <span className="text-brand-400 font-semibold font-mono">Test & Compare</span> to benchmark your algorithm side-by-side against Scikit-learn.
        </p>
      </div>
    );
  }

  const sMetrics = scratchResult?.metrics || {};
  const bMetrics = builtinResult?.metrics || {};

  const passed = verdict?.passed;

  return (
    <div className="space-y-4">
      {/* Automated Validation Verdict Banner */}
      {verdict && (
        <div
          className={`p-4 rounded-xl border flex items-start space-x-3 transition-all ${
            passed
              ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200'
              : 'bg-rose-950/40 border-rose-500/40 text-rose-200'
          }`}
        >
          {passed ? (
            <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0 mt-0.5" />
          ) : (
            <XCircle className="w-6 h-6 text-rose-400 shrink-0 mt-0.5" />
          )}
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold tracking-tight">
                {passed ? 'Validation Passed — Implementation Verified!' : 'Validation Warning — Needs Improvement'}
              </h4>
              {onSaveExperiment && (
                <button
                  onClick={onSaveExperiment}
                  className="text-xs px-2.5 py-1 rounded bg-white/10 hover:bg-white/20 text-white font-medium transition-colors"
                >
                  Save Experiment
                </button>
              )}
            </div>
            <p className="text-xs mt-1 text-slate-300 leading-relaxed font-sans">
              {verdict.message}
            </p>
            {verdict.difference !== undefined && verdict.difference !== null && (
              <div className="mt-2 text-[11px] font-mono text-slate-400 flex items-center space-x-3">
                <span>Calculated Δ: {verdict.difference}</span>
                <span>•</span>
                <span>Allowed Tolerance: {verdict.tolerance}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Side-by-Side 2-Column Comparison Table */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Column 1: FROM SCRATCH */}
        <div className="glass-panel rounded-xl p-5 border border-slate-800 bg-dark-900/90 relative">
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800">
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400"></span>
              <h4 className="text-xs font-bold uppercase tracking-wider text-white">From Scratch</h4>
            </div>
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                scratchResult?.success
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                  : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
              }`}
            >
              {scratchResult?.success ? 'Executed' : 'Error'}
            </span>
          </div>

          <div className="space-y-3 font-mono text-xs">
            {/* Sample Prediction */}
            <div className="flex justify-between items-center py-1.5 border-b border-slate-800/60">
              <span className="text-slate-400 font-sans">Test Prediction:</span>
              <span className="font-bold text-cyan-300 text-sm">
                {scratchResult?.sample_prediction !== undefined && scratchResult?.sample_prediction !== null
                  ? String(scratchResult.sample_prediction)
                  : '--'}
              </span>
            </div>

            {/* Regression Metrics */}
            {category === 'regression' && (
              <>
                <div className="flex justify-between items-center py-1 border-b border-slate-800/40">
                  <span className="text-slate-400 font-sans">R² Score:</span>
                  <span className="font-semibold text-white">{sMetrics.r2_score ?? '--'}</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-slate-800/40">
                  <span className="text-slate-400 font-sans">MSE:</span>
                  <span className="text-slate-300">{sMetrics.mse ?? '--'}</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-slate-800/40">
                  <span className="text-slate-400 font-sans">MAE:</span>
                  <span className="text-slate-300">{sMetrics.mae ?? '--'}</span>
                </div>
              </>
            )}

            {/* Classification Metrics */}
            {category === 'classification' && (
              <>
                <div className="flex justify-between items-center py-1 border-b border-slate-800/40">
                  <span className="text-slate-400 font-sans">Accuracy:</span>
                  <span className="font-semibold text-white">
                    {sMetrics.accuracy !== undefined ? `${(sMetrics.accuracy * 100).toFixed(1)}%` : '--'}
                  </span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-slate-800/40">
                  <span className="text-slate-400 font-sans">Precision:</span>
                  <span className="text-slate-300">{sMetrics.precision ?? '--'}</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-slate-800/40">
                  <span className="text-slate-400 font-sans">F1 Score:</span>
                  <span className="text-slate-300">{sMetrics.f1_score ?? '--'}</span>
                </div>
              </>
            )}

            {/* Clustering Metrics */}
            {category === 'clustering' && (
              <>
                <div className="flex justify-between items-center py-1 border-b border-slate-800/40">
                  <span className="text-slate-400 font-sans">Inertia (WCSS):</span>
                  <span className="font-semibold text-white">{sMetrics.inertia ?? '--'}</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-slate-800/40">
                  <span className="text-slate-400 font-sans">Clusters Formed:</span>
                  <span className="text-slate-300">{sMetrics.n_clusters ?? '--'}</span>
                </div>
              </>
            )}

            {/* Execution Time */}
            <div className="flex justify-between items-center pt-2">
              <span className="text-slate-400 font-sans">Execution Time:</span>
              <span className="text-emerald-400">
                {scratchResult?.execution_time_ms ? `${scratchResult.execution_time_ms} ms` : '--'}
              </span>
            </div>
          </div>
        </div>

        {/* Column 2: BUILT-IN (Scikit-learn) */}
        <div className="glass-panel rounded-xl p-5 border border-slate-800 bg-dark-900/90 relative">
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800">
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-brand-500"></span>
              <h4 className="text-xs font-bold uppercase tracking-wider text-white">Built-in (Scikit-learn)</h4>
            </div>
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                builtinResult?.success
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                  : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
              }`}
            >
              {builtinResult?.success ? 'Baseline Reference' : 'Error'}
            </span>
          </div>

          <div className="space-y-3 font-mono text-xs">
            {/* Sample Prediction */}
            <div className="flex justify-between items-center py-1.5 border-b border-slate-800/60">
              <span className="text-slate-400 font-sans">Reference Prediction:</span>
              <span className="font-bold text-brand-300 text-sm">
                {builtinResult?.sample_prediction !== undefined && builtinResult?.sample_prediction !== null
                  ? String(builtinResult.sample_prediction)
                  : '--'}
              </span>
            </div>

            {/* Regression Metrics */}
            {category === 'regression' && (
              <>
                <div className="flex justify-between items-center py-1 border-b border-slate-800/40">
                  <span className="text-slate-400 font-sans">R² Score:</span>
                  <span className="font-semibold text-white">{bMetrics.r2_score ?? '--'}</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-slate-800/40">
                  <span className="text-slate-400 font-sans">MSE:</span>
                  <span className="text-slate-300">{bMetrics.mse ?? '--'}</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-slate-800/40">
                  <span className="text-slate-400 font-sans">MAE:</span>
                  <span className="text-slate-300">{bMetrics.mae ?? '--'}</span>
                </div>
              </>
            )}

            {/* Classification Metrics */}
            {category === 'classification' && (
              <>
                <div className="flex justify-between items-center py-1 border-b border-slate-800/40">
                  <span className="text-slate-400 font-sans">Accuracy:</span>
                  <span className="font-semibold text-white">
                    {bMetrics.accuracy !== undefined ? `${(bMetrics.accuracy * 100).toFixed(1)}%` : '--'}
                  </span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-slate-800/40">
                  <span className="text-slate-400 font-sans">Precision:</span>
                  <span className="text-slate-300">{bMetrics.precision ?? '--'}</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-slate-800/40">
                  <span className="text-slate-400 font-sans">F1 Score:</span>
                  <span className="text-slate-300">{bMetrics.f1_score ?? '--'}</span>
                </div>
              </>
            )}

            {/* Clustering Metrics */}
            {category === 'clustering' && (
              <>
                <div className="flex justify-between items-center py-1 border-b border-slate-800/40">
                  <span className="text-slate-400 font-sans">Inertia (WCSS):</span>
                  <span className="font-semibold text-white">{bMetrics.inertia ?? '--'}</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-slate-800/40">
                  <span className="text-slate-400 font-sans">Clusters Formed:</span>
                  <span className="text-slate-300">{bMetrics.n_clusters ?? '--'}</span>
                </div>
              </>
            )}

            {/* Execution Time */}
            <div className="flex justify-between items-center pt-2">
              <span className="text-slate-400 font-sans">Execution Time:</span>
              <span className="text-emerald-400">
                {builtinResult?.execution_time_ms ? `${builtinResult.execution_time_ms} ms` : '--'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ComparisonPanel;
