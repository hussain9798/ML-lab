import React, { useRef } from 'react';
import Editor, { loader } from '@monaco-editor/react';
import * as monaco from 'monaco-editor';

loader.config({ monaco });
import { 
  Play, 
  RotateCcw, 
  Save, 
  GitCompare, 
  Loader2, 
  Code, 
  Sparkles, 
  FileCode,
  Check
} from 'lucide-react';

const CodeEditor = ({
  algorithmName = 'Linear Regression',
  mode = 'scratch', // 'scratch' or 'builtin'
  onModeChange,
  code = '',
  onChange,
  onRun,
  onTestAndCompare,
  onReset,
  onSave,
  isRunning = false,
  isTesting = false,
  allowedLibraries = ['numpy', 'pandas', 'scikit-learn']
}) => {
  const editorRef = useRef(null);

  const handleEditorDidMount = (editor, monaco) => {
    editorRef.current = editor;
  };

  const lineCount = code.split('\n').length;
  const charCount = code.length;

  return (
    <div className="flex flex-col h-full bg-dark-900 border border-slate-800 rounded-xl overflow-hidden shadow-2xl">
      {/* IDE Header Bar */}
      <div className="bg-dark-850 px-4 py-3 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
        {/* Left: Algorithm & Mode Selector */}
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <FileCode className="w-5 h-5 text-brand-400" />
            <span className="font-bold text-white tracking-tight">{algorithmName}</span>
          </div>

          <div className="h-4 w-px bg-slate-700 hidden sm:block"></div>

          {/* Core requirement: Choose dropdown in editor header */}
          <div className="flex items-center space-x-2">
            <span className="text-xs text-slate-400 font-medium">Mode:</span>
            <div className="relative inline-block">
              <select
                value={mode}
                onChange={(e) => onModeChange && onModeChange(e.target.value)}
                className="bg-slate-800 border border-slate-700 text-brand-400 font-medium text-xs rounded-lg px-3 py-1.5 pr-8 focus:outline-none focus:ring-2 focus:ring-brand-500 appearance-none cursor-pointer hover:bg-slate-750 transition-colors"
              >
                <option value="scratch">From Scratch (NumPy)</option>
                <option value="builtin">Built-in Library (Scikit-learn)</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-400">
                <span className="text-[10px]">▼</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center space-x-2">
          {/* Reset Code */}
          <button
            onClick={onReset}
            disabled={isRunning || isTesting}
            title="Reset to default starter code"
            className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors disabled:opacity-50"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Reset</span>
          </button>

          {/* Save Code */}
          <button
            onClick={onSave}
            disabled={isRunning || isTesting}
            title="Save your implementation version"
            className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Save</span>
          </button>

          {/* Run Code (Sandbox Execution) */}
          <button
            onClick={onRun}
            disabled={isRunning || isTesting}
            className="flex items-center space-x-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-slate-700 hover:bg-slate-600 border border-slate-600 rounded-lg shadow-sm transition-all disabled:opacity-50"
          >
            {isRunning ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Running...</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current text-emerald-400" />
                <span>Run Code</span>
              </>
            )}
          </button>

          {/* Flagship Button: Run Test & Compare */}
          <button
            onClick={onTestAndCompare}
            disabled={isRunning || isTesting}
            className="flex items-center space-x-2 px-4 py-1.5 text-xs font-bold text-white bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 shadow-md shadow-brand-500/25 rounded-lg transition-all disabled:opacity-50"
          >
            {isTesting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Testing & Comparing...</span>
              </>
            ) : (
              <>
                <GitCompare className="w-3.5 h-3.5" />
                <span>Test & Compare</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Allowed Libraries Badge Bar */}
      <div className="bg-dark-900/60 px-4 py-1.5 border-b border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
        <div className="flex items-center space-x-2">
          <span className="text-slate-500 font-mono">Environment:</span>
          <div className="flex items-center space-x-1">
            {allowedLibraries.map((lib) => (
              <span key={lib} className="px-1.5 py-0.5 rounded bg-slate-800/80 text-slate-300 font-mono text-[10px] border border-slate-700/50">
                {lib}
              </span>
            ))}
          </div>
        </div>

        <div className="flex items-center space-x-3 text-slate-400 font-mono">
          <span>Python 3.12</span>
          <span>•</span>
          <span>UTF-8</span>
        </div>
      </div>

      {/* Monaco Code Editor */}
      <div className="flex-1 min-h-[380px] relative">
        <Editor
          height="100%"
          language="python"
          theme="vs-dark"
          value={code}
          onChange={(value) => onChange && onChange(value || '')}
          onMount={handleEditorDidMount}
          loading={
            <div className="flex flex-col items-center justify-center h-full space-y-2 bg-dark-900 text-slate-400">
              <Loader2 className="w-6 h-6 animate-spin text-brand-400" />
              <span className="text-xs font-mono">Initializing Monaco IDE...</span>
            </div>
          }
          options={{
            fontSize: 13,
            fontFamily: "'Fira Code', 'JetBrains Mono', Consolas, monospace",
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            lineNumbers: 'on',
            roundedSelection: false,
            cursorStyle: 'line',
            automaticLayout: true,
            tabSize: 4,
            insertSpaces: true,
            padding: { top: 12, bottom: 12 },
            renderLineHighlight: 'all',
            scrollbar: {
              verticalScrollbarSize: 8,
              horizontalScrollbarSize: 8,
            }
          }}
        />
      </div>

      {/* Status Bar */}
      <div className="bg-dark-950 px-4 py-1.5 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400 font-mono">
        <div className="flex items-center space-x-4">
          <span className="flex items-center space-x-1 text-emerald-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            <span className="text-[11px]">Sandbox Ready</span>
          </span>
          <span className="text-[11px] text-slate-400">
            Lines: {lineCount} | Chars: {charCount}
          </span>
        </div>

        <div className="flex items-center space-x-2 text-[11px] text-slate-400">
          <span>{mode === 'scratch' ? 'Scratch Mode (Implementation)' : 'Library Mode (Scikit-learn)'}</span>
        </div>
      </div>
    </div>
  );
};

export default CodeEditor;
