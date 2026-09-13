import React, { useState } from 'react';
import { 
  ResponsiveContainer, 
  ComposedChart, 
  Line, 
  Scatter, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  BarChart, 
  Bar 
} from 'recharts';
import { BarChart3, TrendingUp, Grid, ScatterChart as ScatterIcon, Layers } from 'lucide-react';

const VisualizationPanel = ({ visualizations, category = 'regression' }) => {
  if (!visualizations || Object.keys(visualizations).length === 0) {
    return (
      <div className="glass-panel rounded-xl p-8 border border-slate-800 text-center">
        <div className="w-12 h-12 rounded-full bg-slate-800/80 border border-slate-700 flex items-center justify-center mx-auto mb-3 text-slate-400">
          <TrendingUp className="w-6 h-6" />
        </div>
        <h4 className="text-sm font-semibold text-white mb-1">Visual Results Ready</h4>
        <p className="text-xs text-slate-400 max-w-sm mx-auto">
          Run a comparison test to render interactive regression lines, confusion matrices, or cluster plots.
        </p>
      </div>
    );
  }

  const [activeTab, setActiveTab] = useState('chart');

  // Regression charts
  const regPoints = visualizations.regression_points || [];

  // Classification charts
  const metricsComparison = visualizations.metrics_comparison || [];
  const cmScratch = visualizations.confusion_matrix_scratch || [];
  const cmBuiltin = visualizations.confusion_matrix_builtin || [];

  // Clustering charts
  const clusterPoints = visualizations.cluster_points || [];

  return (
    <div className="glass-panel rounded-xl border border-slate-800 p-5 bg-dark-900/90 shadow-xl space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center space-x-2">
          <BarChart3 className="w-4 h-4 text-brand-400" />
          <h4 className="text-xs font-bold uppercase tracking-wider text-white">Visual Analysis</h4>
        </div>

        {category === 'classification' && (
          <div className="flex bg-slate-800 p-0.5 rounded-lg text-xs">
            <button
              onClick={() => setActiveTab('chart')}
              className={`px-3 py-1 rounded-md font-medium transition-colors ${
                activeTab === 'chart' ? 'bg-brand-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Metrics Chart
            </button>
            <button
              onClick={() => setActiveTab('matrix')}
              className={`px-3 py-1 rounded-md font-medium transition-colors ${
                activeTab === 'matrix' ? 'bg-brand-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Confusion Matrix
            </button>
          </div>
        )}
      </div>

      {/* Regression Visualization */}
      {category === 'regression' && regPoints.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
            <span>Feature X vs Actual & Predicted Y</span>
            <span className="text-emerald-400">Cyan: Scratch | Indigo: Built-in | Orange: Actual Points</span>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={regPoints} margin={{ top: 10, right: 20, bottom: 10, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                <XAxis dataKey="x" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                  itemStyle={{ color: '#f8fafc' }}
                />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Scatter name="Actual Data (y_test)" dataKey="actual" fill="#f97316" shape="circle" />
                <Line type="monotone" name="Scratch Model (Line)" dataKey="scratch" stroke="#06b6d4" strokeWidth={2.5} dot={false} />
                <Line type="monotone" name="Built-in Model (Line)" dataKey="builtin" stroke="#6366f1" strokeWidth={2} strokeDasharray="4 4" dot={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Classification Visualization: Bar Chart */}
      {category === 'classification' && activeTab === 'chart' && metricsComparison.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
            <span>Performance Metrics Comparison (0.0 to 1.0)</span>
            <span className="text-cyan-400">Scratch vs Scikit-learn</span>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={metricsComparison} margin={{ top: 10, right: 20, bottom: 10, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                <XAxis dataKey="metric" stroke="#94a3b8" fontSize={11} />
                <YAxis domain={[0, 1]} stroke="#94a3b8" fontSize={11} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                  itemStyle={{ color: '#f8fafc' }}
                />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Bar name="Scratch" dataKey="scratch" fill="#06b6d4" radius={[4, 4, 0, 0]} />
                <Bar name="Built-in (Sklearn)" dataKey="builtin" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Classification Visualization: Confusion Matrices */}
      {category === 'classification' && activeTab === 'matrix' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          {/* Scratch Matrix */}
          <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800">
            <h5 className="text-xs font-bold text-cyan-400 mb-3 uppercase tracking-wider">Scratch Confusion Matrix</h5>
            {cmScratch.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-center text-xs font-mono">
                  <tbody>
                    {cmScratch.map((row, rIdx) => (
                      <tr key={rIdx}>
                        {row.map((val, cIdx) => (
                          <td
                            key={cIdx}
                            className={`p-3 border border-slate-800 font-bold ${
                              rIdx === cIdx ? 'bg-cyan-500/20 text-cyan-300' : 'bg-slate-900 text-slate-400'
                            }`}
                          >
                            {val}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-xs text-slate-500 italic">No matrix generated</p>
            )}
          </div>

          {/* Built-in Matrix */}
          <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800">
            <h5 className="text-xs font-bold text-brand-400 mb-3 uppercase tracking-wider">Built-in Confusion Matrix</h5>
            {cmBuiltin.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-center text-xs font-mono">
                  <tbody>
                    {cmBuiltin.map((row, rIdx) => (
                      <tr key={rIdx}>
                        {row.map((val, cIdx) => (
                          <td
                            key={cIdx}
                            className={`p-3 border border-slate-800 font-bold ${
                              rIdx === cIdx ? 'bg-brand-500/20 text-brand-300' : 'bg-slate-900 text-slate-400'
                            }`}
                          >
                            {val}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-xs text-slate-500 italic">No matrix generated</p>
            )}
          </div>
        </div>
      )}

      {/* Clustering Visualization */}
      {category === 'clustering' && clusterPoints.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
            <span>2D Feature Projection with Cluster Color Mapping</span>
            <span className="text-brand-400">Cluster Assignments</span>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={clusterPoints} margin={{ top: 10, right: 20, bottom: 10, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                <XAxis dataKey="x" stroke="#94a3b8" fontSize={11} />
                <YAxis dataKey="y" stroke="#94a3b8" fontSize={11} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                  itemStyle={{ color: '#f8fafc' }}
                />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Scatter name="Customer Data Points" dataKey="y" fill="#06b6d4" shape="circle" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
};

export default VisualizationPanel;
