import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { algorithmsAPI } from '../services/api';
import { 
  Code2, 
  Search, 
  Filter, 
  FlaskConical, 
  BookOpen, 
  Sparkles, 
  CheckCircle2, 
  ChevronRight,
  Loader2 
} from 'lucide-react';

const AlgorithmCatalog = () => {
  const [algorithms, setAlgorithms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedDifficulty, setSelectedDifficulty] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchAlgorithms = async () => {
      setLoading(true);
      try {
        const res = await algorithmsAPI.getAll({
          category: selectedCategory !== 'All' ? selectedCategory : undefined,
          difficulty: selectedDifficulty !== 'All' ? selectedDifficulty : undefined,
          search: searchQuery || undefined,
        });
        setAlgorithms(res.data.algorithms || []);
      } catch (err) {
        console.error('Failed to load algorithms:', err);
      } finally {
        setLoading(false);
      }
    };

    const debounce = setTimeout(fetchAlgorithms, 200);
    return () => clearTimeout(debounce);
  }, [selectedCategory, selectedDifficulty, searchQuery]);

  const categories = ['All', 'Regression', 'Classification', 'Clustering'];
  const difficulties = ['All', 'Beginner', 'Intermediate', 'Advanced'];

  return (
    <div className="space-y-8 pb-16">
      {/* Page Header */}
      <div className="glass-panel rounded-2xl p-6 sm:p-8 border border-slate-800 bg-dark-900/90 shadow-xl">
        <div className="max-w-2xl">
          <div className="flex items-center space-x-2 text-brand-400 text-xs font-mono font-bold uppercase mb-1">
            <Code2 className="w-4 h-4" />
            <span>Algorithm Directory</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Explore ML Algorithms
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-2 leading-relaxed">
            Browse our catalog of verified machine learning algorithms. Inspect mathematical derivations in documentation, implement from scratch in the laboratory, and test against Scikit-learn.
          </p>
        </div>

        {/* Filter and Search Bar */}
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-12 gap-3 pt-6 border-t border-slate-800">
          {/* Search Input */}
          <div className="sm:col-span-6 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search algorithms by name or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-dark-950 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          {/* Category Filter */}
          <div className="sm:col-span-3">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-dark-950 border border-slate-700 text-xs text-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              {categories.map((c) => (
                <option key={c} value={c}>{c === 'All' ? 'All Categories' : c}</option>
              ))}
            </select>
          </div>

          {/* Difficulty Filter */}
          <div className="sm:col-span-3">
            <select
              value={selectedDifficulty}
              onChange={(e) => setSelectedDifficulty(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-dark-950 border border-slate-700 text-xs text-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              {difficulties.map((d) => (
                <option key={d} value={d}>{d === 'All' ? 'All Difficulties' : d}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Algorithms Grid */}
      {loading ? (
        <div className="min-h-[300px] flex flex-col items-center justify-center space-y-3">
          <Loader2 className="w-8 h-8 text-brand-500 animate-spin" />
          <p className="text-xs text-slate-400 font-mono">Filtering algorithms...</p>
        </div>
      ) : algorithms.length === 0 ? (
        <div className="glass-panel rounded-2xl p-12 text-center border border-slate-800">
          <p className="text-slate-400 text-sm">No algorithms found matching your filter criteria.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {algorithms.map((algo) => (
            <div
              key={algo.slug}
              className="glass-panel rounded-xl p-5 border border-slate-800 glass-panel-hover flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-brand-500/10 text-brand-400 border border-brand-500/20">
                    {algo.category}
                  </span>
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                      algo.difficulty === 'Beginner'
                        ? 'bg-emerald-500/15 text-emerald-400'
                        : algo.difficulty === 'Intermediate'
                        ? 'bg-amber-500/15 text-amber-400'
                        : 'bg-rose-500/15 text-rose-400'
                    }`}
                  >
                    {algo.difficulty}
                  </span>
                </div>

                <h3 className="text-base font-bold text-white mb-2">{algo.name}</h3>
                <p className="text-xs text-slate-400 leading-relaxed line-clamp-3 mb-4">
                  {algo.description}
                </p>

                {/* Allowed Libraries & Metrics Tags */}
                <div className="flex flex-wrap gap-1 mb-4">
                  {algo.allowed_libraries?.map((lib) => (
                    <span key={lib} className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                      {lib}
                    </span>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800/80 flex items-center space-x-2">
                <Link
                  to={`/docs/${algo.slug}`}
                  className="flex-1 text-center py-2 rounded-lg text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 transition-colors flex items-center justify-center space-x-1"
                >
                  <BookOpen className="w-3.5 h-3.5 text-slate-400" />
                  <span>Docs</span>
                </Link>
                <Link
                  to={`/lab/${algo.slug}`}
                  className="flex-1 text-center py-2 rounded-lg text-xs font-semibold text-white bg-brand-600 hover:bg-brand-500 shadow-sm transition-colors flex items-center justify-center space-x-1"
                >
                  <FlaskConical className="w-3.5 h-3.5" />
                  <span>Open Lab</span>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AlgorithmCatalog;
