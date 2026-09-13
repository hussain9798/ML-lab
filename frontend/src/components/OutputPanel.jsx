import React, { useState } from 'react';
import { Terminal, Clock, Trash2, Copy, Check, AlertTriangle } from 'lucide-react';

const OutputPanel = ({ 
  stdout = '', 
  stderr = '', 
  executionTimeMs = null, 
  error = null,
  onClear 
}) => {
  const [activeTab, setActiveTab] = useState('stdout'); // 'stdout' or 'stderr'
  const [copied, setCopied] = useState(false);

  React.useEffect(() => {
    if (stderr && stderr.trim() && (!stdout || !stdout.trim())) {
      setActiveTab('stderr');
    } else if (stdout && stdout.trim()) {
      setActiveTab('stdout');
    }
  }, [stdout, stderr]);

  const handleCopy = () => {
    const textToCopy = activeTab === 'stdout' ? stdout : stderr;
    if (textToCopy) {
      navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const hasStderr = Boolean(stderr && stderr.trim());
  const hasError = Boolean(error);

  return (
    <div className="flex flex-col h-full bg-dark-950 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
      {/* Console Header Bar */}
      <div className="bg-dark-900 px-4 py-2 border-b border-slate-800 flex items-center justify-between">
        {/* Left Tabs */}
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-1.5 text-slate-400 mr-2">
            <Terminal className="w-4 h-4 text-brand-400" />
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">Terminal</span>
          </div>

          <div className="flex bg-slate-800/80 p-0.5 rounded-lg border border-slate-700/60">
            <button
              onClick={() => setActiveTab('stdout')}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                activeTab === 'stdout'
                  ? 'bg-slate-700 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Output
            </button>
            <button
              onClick={() => setActiveTab('stderr')}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors flex items-center space-x-1 ${
                activeTab === 'stderr'
                  ? 'bg-slate-700 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>Errors</span>
              {hasStderr && (
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
              )}
            </button>
          </div>
        </div>

        {/* Right Info: Timing & Actions */}
        <div className="flex items-center space-x-3">
          {executionTimeMs !== null && (
            <div className="flex items-center space-x-1.5 text-xs text-slate-400 font-mono bg-slate-800/60 px-2 py-0.5 rounded border border-slate-700/40">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>{executionTimeMs >= 1000 ? `${(executionTimeMs / 1000).toFixed(2)}s` : `${executionTimeMs}ms`}</span>
            </div>
          )}

          <button
            onClick={handleCopy}
            title="Copy Output"
            className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>

          {onClear && (
            <button
              onClick={onClear}
              title="Clear Console"
              className="p-1.5 text-slate-400 hover:text-rose-400 rounded hover:bg-slate-800 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Output Console Body */}
      <div className="flex-1 p-4 font-mono text-xs overflow-y-auto max-h-[280px] bg-dark-950 text-slate-200 leading-relaxed select-text">
        {activeTab === 'stdout' ? (
          stdout ? (
            <pre className="whitespace-pre-wrap break-words">{stdout}</pre>
          ) : (
            <div className="text-slate-600 italic flex items-center space-x-2 py-4 justify-center">
              <span>Ready. Click "Run Code" or "Test & Compare" to execute in sandbox.</span>
            </div>
          )
        ) : (
          stderr ? (
            <pre className="whitespace-pre-wrap break-words text-rose-400">{stderr}</pre>
          ) : (
            <div className="text-slate-600 italic py-4 text-center">
              No errors reported.
            </div>
          )
        )}
      </div>
    </div>
  );
};

export default OutputPanel;
