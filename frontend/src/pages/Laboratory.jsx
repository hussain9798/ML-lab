import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  algorithmsAPI, 
  codeAPI, 
  testsAPI, 
  experimentsAPI, 
  datasetsAPI 
} from '../services/api';
import CodeEditor from '../components/CodeEditor';
import OutputPanel from '../components/OutputPanel';
import ComparisonPanel from '../components/ComparisonPanel';
import VisualizationPanel from '../components/VisualizationPanel';
import Modal from '../components/Modal';
import { 
  FlaskConical, 
  Database, 
  GitCompare, 
  Terminal, 
  BookOpen, 
  CheckCircle2, 
  Save, 
  Sparkles, 
  Layers, 
  Loader2,
  AlertCircle
} from 'lucide-react';

const Laboratory = () => {
  const { slug } = useParams();
  const currentSlug = slug || 'linear-regression';
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  // Algorithm state
  const [algorithm, setAlgorithm] = useState(null);
  const [allAlgorithms, setAllAlgorithms] = useState([]);
  const [loading, setLoading] = useState(true);

  // Editor state
  const [mode, setMode] = useState('scratch'); // 'scratch' or 'builtin'
  const [scratchCode, setScratchCode] = useState('');
  const [builtinCode, setBuiltinCode] = useState('');

  // Execution state
  const [isRunning, setIsRunning] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [stdout, setStdout] = useState('');
  const [stderr, setStderr] = useState('');
  const [execTimeMs, setExecTimeMs] = useState(null);

  // Comparison & Test results
  const [comparisonResults, setComparisonResults] = useState(null);
  const [activeBottomTab, setActiveBottomTab] = useState('terminal'); // 'terminal', 'comparison', 'visuals'

  // Modals state
  const [saveCodeModalOpen, setSaveCodeModalOpen] = useState(false);
  const [codeName, setCodeName] = useState('');
  const [saveExpModalOpen, setSaveExpModalOpen] = useState(false);
  const [expNotes, setExpNotes] = useState('');
  const [notification, setNotification] = useState(null);

  // Load algorithm details
  useEffect(() => {
    const fetchAlgorithm = async () => {
      setLoading(true);
      try {
        const [algoRes, allRes] = await Promise.all([
          algorithmsAPI.getBySlug(currentSlug),
          algorithmsAPI.getAll()
        ]);
        const algo = algoRes.data.algorithm;
        setAlgorithm(algo);
        setAllAlgorithms(allRes.data.algorithms || []);

        // Populate starter codes
        const sCode = algo.starter_code?.scratch || '';
        const bCode = algo.starter_code?.builtin || '';
        setScratchCode(sCode);
        setBuiltinCode(bCode);

        // Reset previous outputs
        setStdout('');
        setStderr('');
        setExecTimeMs(null);
        setComparisonResults(null);
      } catch (err) {
        console.error('Failed to load algorithm:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAlgorithm();
  }, [currentSlug]);

  const showNotification = (msg, type = 'success') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 3500);
  };

  // Switch between From Scratch and Built-in Library mode
  const handleModeChange = (newMode) => {
    setMode(newMode);
  };

  // Run Code in Sandbox
  const handleRunCode = async () => {
    setIsRunning(true);
    setStderr('');
    const activeCode = mode === 'scratch' ? scratchCode : builtinCode;
    try {
      const res = await codeAPI.execute(activeCode, currentSlug);
      setStdout(res.data.stdout || '');
      setStderr(res.data.stderr || '');
      setExecTimeMs(res.data.execution_time_ms);
      setActiveBottomTab('terminal');
      if (!res.data.success && res.data.error) {
        showNotification(res.data.error, 'error');
      } else {
        showNotification('Code executed successfully in sandbox.');
      }
    } catch (err) {
      setStderr(err.response?.data?.stderr || err.message || 'Execution error');
      showNotification('Execution failed.', 'error');
    } finally {
      setIsRunning(false);
    }
  };

  // Flagship: Run Test & Compare against Scikit-learn
  const handleTestAndCompare = async () => {
    setIsTesting(true);
    setComparisonResults(null);
    try {
      const res = await testsAPI.runComparison({
        algorithm_slug: currentSlug,
        scratch_code: scratchCode,
        dataset_id: algorithm?.sample_dataset,
        tolerance: algorithm?.validation_tolerance,
      });

      setComparisonResults(res.data);
      if (res.data.stdout) setStdout(res.data.stdout);
      if (res.data.stderr) setStderr(res.data.stderr);

      // Automatically switch to comparison view
      setActiveBottomTab('comparison');

      const verdict = res.data.verdict;
      if (verdict?.passed) {
        showNotification('✅ Validation Passed! Implementation matches Scikit-learn.', 'success');
      } else {
        showNotification('❌ Tolerance difference exceeded. Review metrics.', 'warning');
      }
    } catch (err) {
      const errMsg = err.response?.data?.error || err.message || 'Comparison test failed.';
      setStderr(errMsg);
      showNotification(errMsg, 'error');
    } finally {
      setIsTesting(false);
    }
  };

  // Reset to default starter code
  const handleResetCode = () => {
    if (window.confirm('Reset code to default starter template? Unsaved changes will be lost.')) {
      if (mode === 'scratch') {
        setScratchCode(algorithm?.starter_code?.scratch || '');
      } else {
        setBuiltinCode(algorithm?.starter_code?.builtin || '');
      }
      showNotification('Starter code reset.');
    }
  };

  // Save Code modal handler
  const handleSaveCodeSubmit = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    try {
      await codeAPI.save({
        name: codeName || `${algorithm.name} Implementation`,
        code: mode === 'scratch' ? scratchCode : builtinCode,
        algorithm_slug: currentSlug,
        implementation_type: mode,
      });
      setSaveCodeModalOpen(false);
      setCodeName('');
      showNotification('Code implementation saved successfully!');
    } catch (err) {
      showNotification(err.response?.data?.error || 'Failed to save code.', 'error');
    }
  };

  // Save Experiment modal handler
  const handleSaveExperimentSubmit = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    try {
      await experimentsAPI.create({
        algorithm_slug: currentSlug,
        code: scratchCode,
        metrics: comparisonResults?.scratch_result?.metrics,
        scratch_result: comparisonResults?.scratch_result,
        builtin_result: comparisonResults?.builtin_result,
        verdict: comparisonResults?.verdict,
        notes: expNotes,
        dataset_id: algorithm?.sample_dataset,
      });
      setSaveExpModalOpen(false);
      setExpNotes('');
      showNotification('Experiment logged to your history!');
    } catch (err) {
      showNotification(err.response?.data?.error || 'Failed to log experiment.', 'error');
    }
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-3">
        <Loader2 className="w-8 h-8 text-brand-500 animate-spin" />
        <p className="text-xs text-slate-400 font-mono">Loading ML Laboratory environment...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-16">
      {/* Toast Notification */}
      {notification && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl shadow-2xl text-xs font-semibold flex items-center space-x-2 border transition-all animate-in slide-in-from-bottom-5 ${
            notification.type === 'error'
              ? 'bg-rose-950/90 text-rose-200 border-rose-500/50'
              : notification.type === 'warning'
              ? 'bg-amber-950/90 text-amber-200 border-amber-500/50'
              : 'bg-emerald-950/90 text-emerald-200 border-emerald-500/50'
          }`}
        >
          <span>{notification.msg}</span>
        </div>
      )}

      {/* Top Laboratory Bar: Algorithm Switcher & Context Info */}
      <div className="glass-panel rounded-xl px-5 py-3.5 border border-slate-800 bg-dark-900/90 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-lg bg-brand-600/20 border border-brand-500/30 flex items-center justify-center text-brand-400">
            <FlaskConical className="w-5 h-5" />
          </div>

          <div>
            <div className="flex items-center space-x-2">
              {/* Algorithm Quick Selector Dropdown */}
              <select
                value={currentSlug}
                onChange={(e) => navigate(`/lab/${e.target.value}`)}
                className="bg-slate-800 border border-slate-700 text-white font-bold text-sm rounded-lg px-2.5 py-1 focus:outline-none focus:ring-2 focus:ring-brand-500 cursor-pointer"
              >
                {allAlgorithms.map((a) => (
                  <option key={a.slug} value={a.slug}>
                    {a.name} ({a.category})
                  </option>
                ))}
              </select>
              <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-brand-500/10 text-brand-400 border border-brand-500/20">
                {algorithm?.category}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">
              {algorithm?.description}
            </p>
          </div>
        </div>

        {/* Action Links */}
        <div className="flex items-center space-x-3">
          <Link
            to={`/docs/${currentSlug}`}
            className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-750 border border-slate-700 rounded-lg transition-colors"
          >
            <BookOpen className="w-3.5 h-3.5 text-brand-400" />
            <span>Read Docs</span>
          </Link>
          <div className="text-[11px] text-slate-400 font-mono hidden sm:flex items-center space-x-1 bg-slate-800/60 px-2.5 py-1 rounded-lg border border-slate-700/50">
            <span>Tolerance:</span>
            <span className="text-brand-400 font-bold">±{algorithm?.validation_tolerance}</span>
          </div>
        </div>
      </div>

      {/* Main Monaco IDE Code Editor */}
      <div className="h-[460px]">
        <CodeEditor
          algorithmName={algorithm?.name}
          mode={mode}
          onModeChange={handleModeChange}
          code={mode === 'scratch' ? scratchCode : builtinCode}
          onChange={(val) => {
            if (mode === 'scratch') setScratchCode(val);
            else setBuiltinCode(val);
          }}
          onRun={handleRunCode}
          onTestAndCompare={handleTestAndCompare}
          onReset={handleResetCode}
          onSave={() => setSaveCodeModalOpen(true)}
          isRunning={isRunning}
          isTesting={isTesting}
          allowedLibraries={algorithm?.allowed_libraries || ['numpy', 'pandas', 'scikit-learn']}
        />
      </div>

      {/* Bottom Output & Comparison Workspace */}
      <div className="space-y-4">
        {/* Workspace View Switcher Tabs */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setActiveBottomTab('terminal')}
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeBottomTab === 'terminal'
                  ? 'bg-brand-500/15 text-brand-400 border border-brand-500/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Terminal className="w-3.5 h-3.5" />
              <span>Terminal & Console</span>
            </button>

            <button
              onClick={() => setActiveBottomTab('comparison')}
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all relative ${
                activeBottomTab === 'comparison'
                  ? 'bg-brand-500/15 text-brand-400 border border-brand-500/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <GitCompare className="w-3.5 h-3.5" />
              <span>Scratch vs. Built-in Comparison</span>
              {comparisonResults && (
                <span className={`w-2 h-2 rounded-full ${comparisonResults.verdict?.passed ? 'bg-emerald-400' : 'bg-rose-400'}`}></span>
              )}
            </button>

            <button
              onClick={() => setActiveBottomTab('visuals')}
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeBottomTab === 'visuals'
                  ? 'bg-brand-500/15 text-brand-400 border border-brand-500/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Visual Analysis</span>
            </button>
          </div>

          {comparisonResults && (
            <button
              onClick={() => setSaveExpModalOpen(true)}
              className="flex items-center space-x-1 text-xs px-3 py-1 rounded-lg text-slate-300 bg-slate-800 hover:bg-slate-750 border border-slate-700 transition-colors font-medium"
            >
              <Save className="w-3.5 h-3.5 text-brand-400" />
              <span>Save Experiment</span>
            </button>
          )}
        </div>

        {/* Tab 1: Terminal Console */}
        {activeBottomTab === 'terminal' && (
          <OutputPanel
            stdout={stdout}
            stderr={stderr}
            executionTimeMs={execTimeMs}
            onClear={() => {
              setStdout('');
              setStderr('');
              setExecTimeMs(null);
            }}
          />
        )}

        {/* Tab 2: Comparison & Verdict */}
        {activeBottomTab === 'comparison' && (
          <ComparisonPanel
            scratchResult={comparisonResults?.scratch_result}
            builtinResult={comparisonResults?.builtin_result}
            verdict={comparisonResults?.verdict}
            category={algorithm?.category?.toLowerCase()}
            primaryMetric={algorithm?.metrics?.[0]}
            onSaveExperiment={() => setSaveExpModalOpen(true)}
          />
        )}

        {/* Tab 3: Visual Results */}
        {activeBottomTab === 'visuals' && (
          <VisualizationPanel
            visualizations={comparisonResults?.visualizations}
            category={algorithm?.category?.toLowerCase()}
          />
        )}
      </div>

      {/* Save Code Implementation Modal */}
      <Modal
        isOpen={saveCodeModalOpen}
        onClose={() => setSaveCodeModalOpen(false)}
        title="Save Implementation"
      >
        <form onSubmit={handleSaveCodeSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Implementation Name
            </label>
            <input
              type="text"
              required
              placeholder="e.g. My Linear Regression (Gradient Descent)"
              value={codeName}
              onChange={(e) => setCodeName(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-dark-950 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <p className="text-[11px] text-slate-400">
            This will save your current code into your personal library for {algorithm?.name}.
          </p>

          <div className="flex justify-end space-x-2 pt-2">
            <button
              type="button"
              onClick={() => setSaveCodeModalOpen(false)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 rounded-lg text-xs font-bold text-white bg-brand-600 hover:bg-brand-500"
            >
              Save Implementation
            </button>
          </div>
        </form>
      </Modal>

      {/* Save Experiment Modal */}
      <Modal
        isOpen={saveExpModalOpen}
        onClose={() => setSaveExpModalOpen(false)}
        title="Save Experiment Record"
      >
        <form onSubmit={handleSaveExperimentSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Experiment Notes / Hypothesis
            </label>
            <textarea
              rows={3}
              placeholder="e.g. Achieved 0.942 R2 with 1000 epochs. Tested normal equation vs gradient descent."
              value={expNotes}
              onChange={(e) => setExpNotes(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-dark-950 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div className="p-3 rounded-lg bg-slate-800/60 text-[11px] text-slate-300 font-mono space-y-1">
            <div>Status: <span className={comparisonResults?.verdict?.passed ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>{comparisonResults?.verdict?.passed ? 'PASSED' : 'FAILED'}</span></div>
            <div>Primary Metric: {comparisonResults?.verdict?.primary_metric} = {comparisonResults?.verdict?.scratch_metric}</div>
          </div>

          <div className="flex justify-end space-x-2 pt-2">
            <button
              type="button"
              onClick={() => setSaveExpModalOpen(false)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 rounded-lg text-xs font-bold text-white bg-brand-600 hover:bg-brand-500"
            >
              Save Experiment
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Laboratory;
