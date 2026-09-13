import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { codeAPI } from '../services/api';
import { FileCode, Trash2, ArrowRight, Calendar, Loader2 } from 'lucide-react';

const SavedCode = () => {
  const [savedCodes, setSavedCodes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCodes = async () => {
      try {
        const res = await codeAPI.getSaved();
        setSavedCodes(res.data.saved_codes || []);
      } catch (err) {
        console.error('Failed to load saved codes:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchCodes();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this saved implementation?')) return;
    try {
      await codeAPI.deleteSaved(id);
      setSavedCodes((prev) => prev.filter((c) => c._id !== id));
    } catch (err) {
      alert('Failed to delete code.');
    }
  };

  return (
    <div className="space-y-8 pb-16">
      <div className="glass-panel rounded-2xl p-6 sm:p-8 border border-slate-800 bg-dark-900/90 shadow-xl">
        <div className="flex items-center space-x-2 text-brand-400 text-xs font-mono font-bold uppercase mb-1">
          <FileCode className="w-4 h-4" />
          <span>Implementation Vault</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          My Saved Implementations
        </h1>
        <p className="text-xs sm:text-sm text-slate-300 mt-1">
          Access your saved algorithm variations, gradient descent versions, and customized classes.
        </p>
      </div>

      {loading ? (
        <div className="min-h-[300px] flex flex-col items-center justify-center space-y-3">
          <Loader2 className="w-8 h-8 text-brand-500 animate-spin" />
          <p className="text-xs text-slate-400 font-mono">Loading saved implementations...</p>
        </div>
      ) : savedCodes.length === 0 ? (
        <div className="glass-panel rounded-2xl p-12 text-center border border-slate-800">
          <FileCode className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-white mb-1">No saved implementations</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto mb-4">
            Click "Save" in the Laboratory IDE header to store your code versions.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {savedCodes.map((item) => (
            <div
              key={item._id}
              className="glass-panel rounded-xl p-5 border border-slate-800 bg-dark-900/90 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-brand-500/10 text-brand-400">
                    {item.implementation_type}
                  </span>
                  <span className="text-[11px] text-slate-500 font-mono flex items-center space-x-1">
                    <Calendar className="w-3 h-3" />
                    <span>{new Date(item.created_at).toLocaleDateString()}</span>
                  </span>
                </div>

                <h4 className="text-base font-bold text-white mb-1">{item.name}</h4>
                <span className="text-xs text-slate-400 font-mono capitalize">
                  {item.algorithm_slug.replace('-', ' ')}
                </span>

                <div className="mt-3 p-2.5 rounded-lg bg-dark-950 font-mono text-[11px] text-slate-400 overflow-hidden line-clamp-3">
                  {item.code}
                </div>
              </div>

              <div className="pt-4 mt-4 border-t border-slate-800/80 flex items-center justify-between">
                <button
                  onClick={() => handleDelete(item._id)}
                  className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-rose-400 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <Link
                  to={`/lab/${item.algorithm_slug}`}
                  className="text-xs font-semibold text-brand-400 hover:underline flex items-center space-x-1"
                >
                  <span>Load in Editor</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SavedCode;
