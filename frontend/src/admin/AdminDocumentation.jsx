import React, { useState, useEffect } from 'react';
import { adminAPI } from '../services/api';
import Modal from '../components/Modal';
import { BookOpen, Plus, Edit, Trash2, Eye, EyeOff, Loader2 } from 'lucide-react';

const AdminDocumentation = () => {
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingDoc, setEditingDoc] = useState(null);
  const [pdfFile, setPdfFile] = useState(null);

  const [formData, setFormData] = useState({
    title: '',
    algorithm_slug: '',
    category: 'Regression',
    difficulty: 'Beginner',
    reading_time_min: 8,
    status: 'published',
    summary: '',
    intuition: '',
    content: ''
  });

  const fetchDocs = async () => {
    setLoading(true);
    try {
      const res = await adminAPI.getDocs();
      setDocs(res.data.documentation || []);
    } catch (err) {
      console.error('Failed to load docs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocs();
  }, []);

  const handleOpenAddModal = () => {
    setEditingDoc(null);
    setPdfFile(null);
    setFormData({
      title: '',
      algorithm_slug: '',
      category: 'Regression',
      difficulty: 'Beginner',
      reading_time_min: 8,
      status: 'published',
      summary: '',
      intuition: '',
      content: `# Overview\nExplain intuition here.\n\n## Mathematical Concepts\nFormula: $$\\hat{y} = w^T x + b$$\n\n## Step-by-Step Working\n1. Initialize parameters\n2. Fit model\n3. Predict`
    });
    setModalOpen(true);
  };

  const handleOpenEditModal = (d) => {
    setEditingDoc(d);
    setPdfFile(null);
    setFormData({
      title: d.title,
      algorithm_slug: d.algorithm_slug,
      category: d.category,
      difficulty: d.difficulty,
      reading_time_min: d.reading_time_min || 8,
      status: d.status || 'published',
      summary: d.summary || '',
      intuition: d.intuition || '',
      content: d.content || ''
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      let savedDoc;
      if (editingDoc) {
        const response = await adminAPI.updateDoc(editingDoc._id, formData);
        savedDoc = response.data.documentation;
      } else {
        const response = await adminAPI.createDoc(formData);
        savedDoc = response.data.documentation;
      }
      if (pdfFile && savedDoc?._id) {
        await adminAPI.uploadDocPdf(savedDoc._id, pdfFile);
      }
      setModalOpen(false);
      setPdfFile(null);
      fetchDocs();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to save documentation.');
    }
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Header */}
      <div className="glass-panel rounded-2xl p-6 sm:p-8 border border-amber-500/30 bg-dark-900/90 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-amber-400 text-xs font-mono font-bold uppercase mb-1">
            <BookOpen className="w-4 h-4" />
            <span>Documentation Center</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Documentation Manager
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1">
            Create and publish comprehensive educational articles, LaTeX derivations, and interview guides.
          </p>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-900 bg-amber-400 hover:bg-amber-300 shadow-md transition-all flex items-center space-x-1.5 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>New Article</span>
        </button>
      </div>

      {/* Articles Table */}
      {loading ? (
        <div className="min-h-[300px] flex flex-col items-center justify-center space-y-3">
          <Loader2 className="w-8 h-8 text-amber-400 animate-spin" />
          <p className="text-xs text-slate-400 font-mono">Loading documentation...</p>
        </div>
      ) : (
        <div className="glass-panel rounded-xl border border-slate-800 bg-dark-900/90 shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 bg-slate-950/60">
                  <th className="py-3 px-4">Title</th>
                  <th className="py-3 px-4">Algorithm Slug</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Read Time</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {docs.map((item) => (
                  <tr key={item._id} className="hover:bg-slate-800/40">
                    <td className="py-3 px-4 font-bold text-white">{item.title}</td>
                    <td className="py-3 px-4 text-cyan-400">{item.algorithm_slug}</td>
                    <td className="py-3 px-4 text-slate-300">{item.category}</td>
                    <td className="py-3 px-4 text-slate-400">{item.reading_time_min} mins</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-500/20 text-emerald-400">
                        {item.status || 'published'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleOpenEditModal(item)}
                        className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-white"
                        title="Edit Article"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Documentation Editor Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingDoc ? `Edit Documentation: ${editingDoc.title}` : 'Create Documentation Article'}
        size="full"
        allowFullScreen={true}
        defaultFullScreen={true}
      >
        <form onSubmit={handleSubmit} className="flex flex-col h-full space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 overflow-y-auto pr-1">
            {/* Left Column: Metadata & Concepts (4 cols) */}
            <div className="lg:col-span-4 space-y-4 bg-dark-950/40 p-4 rounded-xl border border-slate-800/80">
              <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider font-mono">
                Article Metadata
              </h4>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Article Title</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Linear Regression"
                  className="w-full px-3 py-2 rounded-lg bg-dark-950 border border-slate-700 text-xs text-white focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Algorithm Slug</label>
                <input
                  type="text"
                  required
                  value={formData.algorithm_slug}
                  onChange={(e) => setFormData({ ...formData, algorithm_slug: e.target.value })}
                  placeholder="linear-regression"
                  className="w-full px-3 py-2 rounded-lg bg-dark-950 border border-slate-700 text-xs text-white focus:outline-none focus:ring-2 focus:ring-amber-400 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Summary</label>
                <textarea
                  rows={3}
                  required
                  value={formData.summary}
                  onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                  placeholder="Brief overview for the curriculum card..."
                  className="w-full px-3 py-2 rounded-lg bg-dark-950 border border-slate-700 text-xs text-white focus:outline-none focus:ring-2 focus:ring-amber-400 leading-relaxed"
                />
                <div className="mt-4 p-3 rounded-lg border border-slate-700 bg-slate-900/60">
                  <label className="block text-xs font-bold text-white mb-1">Attach PDF Reference</label>
                  <input
                    type="file"
                    accept="application/pdf,.pdf"
                    onChange={(e) => setPdfFile(e.target.files?.[0] || null)}
                    className="w-full text-xs text-slate-300 file:mr-3 file:rounded file:border-0 file:bg-amber-400 file:px-3 file:py-1.5 file:text-xs file:font-bold file:text-slate-900"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">PDF only, maximum 15 MB. It will be available on the published article.</p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Intuition & Mental Model</label>
                <textarea
                  rows={4}
                  value={formData.intuition}
                  onChange={(e) => setFormData({ ...formData, intuition: e.target.value })}
                  placeholder="Intuitive explanation and real-world analogy..."
                  className="w-full px-3 py-2 rounded-lg bg-dark-950 border border-slate-700 text-xs text-white focus:outline-none focus:ring-2 focus:ring-amber-400 leading-relaxed"
                />
              </div>

              <div className="p-3 bg-slate-800/60 rounded-lg border border-slate-700/60 text-[11px] text-slate-300 font-mono space-y-1">
                <span className="font-bold text-amber-400 block font-sans">LaTeX & Markdown Syntax:</span>
                <div>Inline Math: <code className="text-amber-300">$x^2$</code></div>
                <div>Display Math: <code className="text-amber-300">$$y = mx + c$$</code></div>
                <div>Code Blocks: <code className="text-amber-300">```python ... ```</code></div>
              </div>
            </div>

            {/* Right Column: Full Markdown Editor (8 cols) */}
            <div className="lg:col-span-8 flex flex-col bg-dark-950/40 p-4 rounded-xl border border-slate-800/80">
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-white flex items-center space-x-1.5">
                  <span className="text-amber-400">Documentation Content (Markdown & LaTeX Formulas)</span>
                </label>
                <span className="text-[10px] text-slate-400 font-mono">Supports $$math$$ & GitHub Markdown</span>
              </div>
              <textarea
                rows={22}
                required
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                placeholder="# Mathematical Concepts&#10;&#10;$$\hat{y} = \theta^T x$$&#10;&#10;## Key Algorithm Steps&#10;1. Compute gradient..."
                className="w-full flex-1 min-h-[440px] px-4 py-3 rounded-lg bg-dark-950 border border-slate-700 font-mono text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-400 leading-relaxed resize-y"
              />
            </div>
          </div>

          {/* Sticky Footer */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-800 shrink-0">
            <div className="text-xs text-slate-400 font-mono">
              {editingDoc ? `Editing doc for: ${editingDoc.algorithm_slug}` : 'Creating new documentation article'}
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
                Save Documentation
              </button>
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default AdminDocumentation;
