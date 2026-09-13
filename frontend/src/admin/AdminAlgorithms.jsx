import React, { useState, useEffect } from 'react';
import { adminAPI } from '../services/api';
import Modal from '../components/Modal';
import { 
  Code2, 
  Plus, 
  Edit, 
  Trash2, 
  Check, 
  X, 
  Eye, 
  EyeOff, 
  ShieldCheck, 
  Loader2,
  AlertCircle 
} from 'lucide-react';

const AdminAlgorithms = () => {
  const [algorithms, setAlgorithms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingAlgo, setEditingAlgo] = useState(null);

  // Form fields
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    category: 'Regression',
    difficulty: 'Beginner',
    description: '',
    status: 'published',
    validation_tolerance: 0.05,
    sample_dataset: 'house_prices',
    scratch_starter: '',
    builtin_starter: '',
  });

  const fetchAlgorithms = async () => {
    setLoading(true);
    try {
      const res = await adminAPI.getAlgorithms();
      setAlgorithms(res.data.algorithms || []);
    } catch (err) {
      console.error('Failed to load algorithms:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlgorithms();
  }, []);

  const handleOpenAddModal = () => {
    setEditingAlgo(null);
    setFormData({
      name: '',
      slug: '',
      category: 'Regression',
      difficulty: 'Beginner',
      description: '',
      status: 'published',
      validation_tolerance: 0.05,
      sample_dataset: 'house_prices',
      scratch_starter: `# Write your from-scratch Python class here\nimport numpy as np\n\nclass MyModel:\n    def __init__(self):\n        pass\n\n    def fit(self, X, y):\n        pass\n\n    def predict(self, X):\n        pass\n`,
      builtin_starter: `# Standard Scikit-learn reference implementation\nfrom sklearn.linear_model import LinearRegression\n\nmodel = LinearRegression()\nmodel.fit(X_train, y_train)\npredictions = model.predict(X_test)\n`,
    });
    setModalOpen(true);
  };

  const handleOpenEditModal = (algo) => {
    setEditingAlgo(algo);
    setFormData({
      name: algo.name,
      slug: algo.slug,
      category: algo.category,
      difficulty: algo.difficulty,
      description: algo.description,
      status: algo.status,
      validation_tolerance: algo.validation_tolerance || 0.05,
      sample_dataset: algo.sample_dataset || 'house_prices',
      scratch_starter: algo.starter_code?.scratch || '',
      builtin_starter: algo.starter_code?.builtin || '',
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      name: formData.name,
      slug: formData.slug || formData.name.toLowerCase().replace(/\s+/g, '-'),
      category: formData.category,
      difficulty: formData.difficulty,
      description: formData.description,
      status: formData.status,
      validation_tolerance: parseFloat(formData.validation_tolerance),
      sample_dataset: formData.sample_dataset,
      starter_code: {
        scratch: formData.scratch_starter,
        builtin: formData.builtin_starter,
      }
    };

    try {
      if (editingAlgo) {
        await adminAPI.updateAlgorithm(editingAlgo._id, payload);
      } else {
        await adminAPI.createAlgorithm(payload);
      }
      setModalOpen(false);
      fetchAlgorithms();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to save algorithm.');
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete algorithm "${name}" and its associated documentation?`)) return;
    try {
      await adminAPI.deleteAlgorithm(id);
      fetchAlgorithms();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to delete algorithm.');
    }
  };

  const handleToggleStatus = async (algo) => {
    const newStatus = algo.status === 'published' ? 'draft' : 'published';
    try {
      await adminAPI.updateAlgorithm(algo._id, { status: newStatus });
      setAlgorithms((prev) =>
        prev.map((a) => (a._id === algo._id ? { ...a, status: newStatus } : a))
      );
    } catch (err) {
      alert('Failed to update status.');
    }
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Header */}
      <div className="glass-panel rounded-2xl p-6 sm:p-8 border border-amber-500/30 bg-dark-900/90 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-amber-400 text-xs font-mono font-bold uppercase mb-1">
            <Code2 className="w-4 h-4" />
            <span>Curriculum Management</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Algorithm Catalog Management
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1">
            Add, update, or publish machine learning algorithms and configure starter templates.
          </p>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-900 bg-amber-400 hover:bg-amber-300 shadow-md transition-all flex items-center space-x-1.5 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Algorithm</span>
        </button>
      </div>

      {/* Algorithms Table */}
      {loading ? (
        <div className="min-h-[300px] flex flex-col items-center justify-center space-y-3">
          <Loader2 className="w-8 h-8 text-amber-400 animate-spin" />
          <p className="text-xs text-slate-400 font-mono">Loading algorithms...</p>
        </div>
      ) : (
        <div className="glass-panel rounded-xl border border-slate-800 bg-dark-900/90 shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 bg-slate-950/60">
                  <th className="py-3 px-4">Name</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Difficulty</th>
                  <th className="py-3 px-4">Tolerance</th>
                  <th className="py-3 px-4">Dataset</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {algorithms.map((algo) => (
                  <tr key={algo._id} className="hover:bg-slate-800/40">
                    <td className="py-3 px-4 font-bold text-white">
                      <div>{algo.name}</div>
                      <span className="text-[10px] text-slate-500 font-mono">{algo.slug}</span>
                    </td>
                    <td className="py-3 px-4 text-cyan-400">{algo.category}</td>
                    <td className="py-3 px-4 text-slate-300">{algo.difficulty}</td>
                    <td className="py-3 px-4 text-brand-400 font-bold">±{algo.validation_tolerance}</td>
                    <td className="py-3 px-4 text-slate-400">{algo.sample_dataset}</td>
                    <td className="py-3 px-4">
                      <button
                        onClick={() => handleToggleStatus(algo)}
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase transition-colors flex items-center space-x-1 ${
                          algo.status === 'published'
                            ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'
                            : 'bg-amber-500/20 text-amber-400 hover:bg-amber-500/30'
                        }`}
                      >
                        {algo.status === 'published' ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                        <span>{algo.status}</span>
                      </button>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleOpenEditModal(algo)}
                          className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-white"
                          title="Edit Algorithm"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(algo._id, algo.name)}
                          className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-rose-400"
                          title="Delete Algorithm"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add / Edit Algorithm Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingAlgo ? `Edit Algorithm: ${formData.name || editingAlgo.name}` : 'Add New Algorithm'}
        size="full"
        allowFullScreen={true}
        defaultFullScreen={true}
      >
        <form onSubmit={handleSubmit} className="flex flex-col h-full space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 overflow-y-auto pr-1">
            {/* Left Column: Metadata & Config (5 cols) */}
            <div className="lg:col-span-5 space-y-4 bg-dark-950/40 p-4 rounded-xl border border-slate-800/80">
              <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider font-mono">
                1. Basic Configuration
              </h4>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Algorithm Name</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Ridge Regression"
                    className="w-full px-3 py-2 rounded-lg bg-dark-950 border border-slate-700 text-xs text-white focus:outline-none focus:ring-2 focus:ring-amber-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">URL Slug</label>
                  <input
                    type="text"
                    required
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    placeholder="ridge-regression"
                    className="w-full px-3 py-2 rounded-lg bg-dark-950 border border-slate-700 text-xs text-white focus:outline-none focus:ring-2 focus:ring-amber-400 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-dark-950 border border-slate-700 text-xs text-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-400 cursor-pointer"
                  >
                    <option value="Regression">Regression</option>
                    <option value="Classification">Classification</option>
                    <option value="Clustering">Clustering</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Difficulty</label>
                  <select
                    value={formData.difficulty}
                    onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-dark-950 border border-slate-700 text-xs text-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-400 cursor-pointer"
                  >
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Validation Tolerance (Δ)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.validation_tolerance}
                    onChange={(e) => setFormData({ ...formData, validation_tolerance: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-dark-950 border border-slate-700 text-xs text-white focus:outline-none focus:ring-2 focus:ring-amber-400 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Default Dataset</label>
                  <select
                    value={formData.sample_dataset}
                    onChange={(e) => setFormData({ ...formData, sample_dataset: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-dark-950 border border-slate-700 text-xs text-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-400 cursor-pointer"
                  >
                    <option value="house_prices">House Prices (Regression)</option>
                    <option value="iris">Iris Flower (Classification)</option>
                    <option value="churn">Customer Churn (Binary Classification)</option>
                    <option value="customer_blobs">Customer Blobs (Clustering)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Description</label>
                <textarea
                  rows={4}
                  required
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Comprehensive description of the algorithm and mathematical principles..."
                  className="w-full px-3 py-2 rounded-lg bg-dark-950 border border-slate-700 text-xs text-white focus:outline-none focus:ring-2 focus:ring-amber-400 leading-relaxed"
                />
              </div>

              <div className="p-3 bg-amber-500/10 rounded-lg border border-amber-500/20 text-[11px] text-amber-300/90 space-y-1 font-mono">
                <span className="font-bold block text-amber-400 font-sans">💡 Starter Code Tips:</span>
                <p>• Scratch: Define class with fit(X, y) and predict(X).</p>
                <p>• Builtin: Use standard Scikit-learn model with X_train, y_train.</p>
              </div>
            </div>

            {/* Right Column: Code Editors (7 cols) */}
            <div className="lg:col-span-7 space-y-4 flex flex-col">
              <div className="flex-1 flex flex-col bg-dark-950/40 p-4 rounded-xl border border-slate-800/80">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-emerald-400 flex items-center space-x-1.5">
                    <span>Starter Code: "From Scratch" Mode (NumPy)</span>
                  </label>
                  <span className="text-[10px] text-slate-400 font-mono">Python 3.12</span>
                </div>
                <textarea
                  rows={11}
                  required
                  value={formData.scratch_starter}
                  onChange={(e) => setFormData({ ...formData, scratch_starter: e.target.value })}
                  placeholder="class MyAlgorithm:&#10;    def fit(self, X, y):&#10;        ..."
                  className="w-full flex-1 min-h-[220px] px-3.5 py-2.5 rounded-lg bg-dark-950 border border-slate-700 font-mono text-xs text-emerald-300/90 focus:outline-none focus:ring-2 focus:ring-emerald-400 leading-relaxed resize-y"
                />
              </div>

              <div className="flex-1 flex flex-col bg-dark-950/40 p-4 rounded-xl border border-slate-800/80">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-cyan-400 flex items-center space-x-1.5">
                    <span>Starter Code: "Built-in Library" Mode (Scikit-learn)</span>
                  </label>
                  <span className="text-[10px] text-slate-400 font-mono">Benchmark Reference</span>
                </div>
                <textarea
                  rows={7}
                  required
                  value={formData.builtin_starter}
                  onChange={(e) => setFormData({ ...formData, builtin_starter: e.target.value })}
                  placeholder="from sklearn... import ...&#10;model = ...()&#10;model.fit(X_train, y_train)"
                  className="w-full flex-1 min-h-[150px] px-3.5 py-2.5 rounded-lg bg-dark-950 border border-slate-700 font-mono text-xs text-cyan-300/90 focus:outline-none focus:ring-2 focus:ring-cyan-400 leading-relaxed resize-y"
                />
              </div>
            </div>
          </div>

          {/* Sticky Modal Footer */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-800 shrink-0">
            <div className="text-xs text-slate-400 font-mono">
              {editingAlgo ? `Editing: ${editingAlgo.slug}` : 'Creating new algorithm entry'}
            </div>
            <div className="flex space-x-2">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="px-4 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2 rounded-lg text-xs font-bold text-slate-900 bg-amber-400 hover:bg-amber-300 shadow-md transition-colors"
              >
                {editingAlgo ? 'Save Algorithm Changes' : 'Create Algorithm'}
              </button>
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default AdminAlgorithms;
