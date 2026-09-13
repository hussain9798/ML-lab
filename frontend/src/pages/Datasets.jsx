import React, { useState, useEffect } from 'react';
import { datasetsAPI } from '../services/api';
import { 
  Database, 
  Upload, 
  FileSpreadsheet, 
  Table, 
  Layers, 
  BarChart, 
  AlertCircle, 
  CheckCircle2, 
  Loader2 
} from 'lucide-react';

const Datasets = () => {
  const [datasets, setDatasets] = useState([]);
  const [selectedDatasetId, setSelectedDatasetId] = useState('house_prices');
  const [previewData, setPreviewData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);

  useEffect(() => {
    const fetchDatasets = async () => {
      try {
        const res = await datasetsAPI.getAll();
        setDatasets(res.data.datasets || []);
      } catch (err) {
        console.error('Failed to load datasets:', err);
      }
    };
    fetchDatasets();
  }, []);

  useEffect(() => {
    const fetchPreview = async () => {
      if (!selectedDatasetId) return;
      setLoading(true);
      try {
        const res = await datasetsAPI.getPreview(selectedDatasetId);
        setPreviewData(res.data);
      } catch (err) {
        console.error('Failed to preview dataset:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchPreview();
  }, [selectedDatasetId]);

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      setUploadError('Only .csv files are supported.');
      return;
    }

    setUploading(true);
    setUploadError(null);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await datasetsAPI.upload(formData);
      setPreviewData(res.data.analysis);
      setSelectedDatasetId(null);
    } catch (err) {
      setUploadError(err.response?.data?.error || 'Failed to parse CSV.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Header */}
      <div className="glass-panel rounded-2xl p-6 sm:p-8 border border-slate-800 bg-dark-900/90 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="max-w-xl">
            <div className="flex items-center space-x-2 text-brand-400 text-xs font-mono font-bold uppercase mb-1">
              <Database className="w-4 h-4" />
              <span>Dataset Playground</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Explore & Upload Datasets
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-2 leading-relaxed">
              Inspect tabular structures, descriptive statistics, and missing values for regression, classification, and clustering benchmarks.
            </p>
          </div>

          {/* Upload CSV button */}
          <div>
            <label className="cursor-pointer inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-brand-600 hover:bg-brand-500 shadow-sm transition-all">
              <Upload className="w-4 h-4" />
              <span>{uploading ? 'Parsing CSV...' : 'Upload Custom CSV'}</span>
              <input
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                className="hidden"
                disabled={uploading}
              />
            </label>
          </div>
        </div>

        {uploadError && (
          <div className="mt-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-rose-400" />
            <span>{uploadError}</span>
          </div>
        )}
      </div>

      {/* Dataset Selection Pills */}
      <div className="flex flex-wrap gap-2">
        {datasets.map((d) => (
          <button
            key={d.id}
            onClick={() => setSelectedDatasetId(d.id)}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all flex items-center space-x-2 ${
              selectedDatasetId === d.id
                ? 'bg-brand-600 text-white shadow-md shadow-brand-500/25 border border-brand-500'
                : 'bg-dark-900 text-slate-400 hover:text-white border border-slate-800 hover:border-slate-700'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>{d.name}</span>
            <span className="text-[10px] font-mono opacity-80 uppercase">({d.category})</span>
          </button>
        ))}
      </div>

      {/* Preview Section */}
      {loading ? (
        <div className="min-h-[400px] flex flex-col items-center justify-center space-y-3">
          <Loader2 className="w-8 h-8 text-brand-500 animate-spin" />
          <p className="text-xs text-slate-400 font-mono">Loading dataset statistics...</p>
        </div>
      ) : previewData ? (
        <div className="space-y-6">
          {/* Summary Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="glass-panel p-4 rounded-xl border border-slate-800">
              <span className="text-xs text-slate-400 font-mono">Total Observations</span>
              <div className="text-2xl font-bold text-white font-mono mt-1">
                {previewData.total_rows}
              </div>
            </div>
            <div className="glass-panel p-4 rounded-xl border border-slate-800">
              <span className="text-xs text-slate-400 font-mono">Total Features</span>
              <div className="text-2xl font-bold text-brand-400 font-mono mt-1">
                {previewData.total_columns}
              </div>
            </div>
            <div className="glass-panel p-4 rounded-xl border border-slate-800">
              <span className="text-xs text-slate-400 font-mono">Target Variable</span>
              <div className="text-sm font-bold text-cyan-300 font-mono mt-2 truncate">
                {previewData.target || 'None (Unsupervised)'}
              </div>
            </div>
            <div className="glass-panel p-4 rounded-xl border border-slate-800">
              <span className="text-xs text-slate-400 font-mono">Category</span>
              <div className="text-sm font-bold text-emerald-400 uppercase font-mono mt-2">
                {previewData.category || 'Tabular'}
              </div>
            </div>
          </div>

          {/* Column Statistics Table */}
          <div className="glass-panel rounded-xl border border-slate-800 p-5 bg-dark-900/90 shadow-xl">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 font-mono">
              Column Data Types & Descriptive Statistics
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400">
                    <th className="py-2.5 px-3">Column Name</th>
                    <th className="py-2.5 px-3">Type</th>
                    <th className="py-2.5 px-3">Missing</th>
                    <th className="py-2.5 px-3">Mean</th>
                    <th className="py-2.5 px-3">Std</th>
                    <th className="py-2.5 px-3">Min</th>
                    <th className="py-2.5 px-3">Max</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {previewData.columns?.map((col) => (
                    <tr key={col.name} className="hover:bg-slate-800/40">
                      <td className="py-2.5 px-3 font-bold text-white">
                        {col.name}
                        {col.name === previewData.target && (
                          <span className="ml-2 text-[10px] bg-cyan-500/20 text-cyan-300 px-1.5 py-0.5 rounded">
                            Target
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-slate-400">{col.type}</td>
                      <td className="py-2.5 px-3 text-slate-300">{col.null_count} ({col.null_pct}%)</td>
                      <td className="py-2.5 px-3 text-slate-300">{col.mean ?? '--'}</td>
                      <td className="py-2.5 px-3 text-slate-300">{col.std ?? '--'}</td>
                      <td className="py-2.5 px-3 text-slate-300">{col.min ?? '--'}</td>
                      <td className="py-2.5 px-3 text-slate-300">{col.max ?? '--'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Tabular Records Preview (Top 15 Rows) */}
          <div className="glass-panel rounded-xl border border-slate-800 p-5 bg-dark-900/90 shadow-xl">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 font-mono">
              Data Preview (First 15 Rows)
            </h3>
            <div className="overflow-x-auto max-h-96">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 sticky top-0 bg-dark-900">
                    {previewData.columns?.map((c) => (
                      <th key={c.name} className="py-2.5 px-3">{c.name}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {previewData.preview?.map((row, rIdx) => (
                    <tr key={rIdx} className="hover:bg-slate-800/40">
                      {previewData.columns?.map((c) => (
                        <td key={c.name} className="py-2 px-3 text-slate-300 whitespace-nowrap">
                          {row[c.name] !== null ? String(row[c.name]) : 'NaN'}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default Datasets;
