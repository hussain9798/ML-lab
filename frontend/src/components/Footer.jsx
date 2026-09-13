import React from 'react';
import { Terminal, Heart, Cpu, ShieldCheck, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="bg-dark-900 border-t border-slate-800/80 text-slate-400 text-sm mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand Info */}
          <div className="space-y-3 md:col-span-1">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center">
                <Terminal className="w-4 h-4 text-white" />
              </div>
              <span className="text-lg font-bold text-white tracking-tight">ML Laboratory</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Interactive laboratory to master Machine Learning algorithms from scratch and benchmark against Scikit-learn.
            </p>
            <div className="flex items-center space-x-2 text-xs text-emerald-400 font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Isolated Execution Sandbox Ready</span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white font-semibold text-xs tracking-wider uppercase mb-3">Algorithms</h4>
            <ul className="space-y-2 text-xs">
              <li><Link to="/lab/linear-regression" className="hover:text-brand-400 transition-colors">Linear Regression</Link></li>
              <li><Link to="/lab/logistic-regression" className="hover:text-brand-400 transition-colors">Logistic Regression</Link></li>
              <li><Link to="/lab/knn" className="hover:text-brand-400 transition-colors">K-Nearest Neighbors</Link></li>
              <li><Link to="/lab/decision-tree" className="hover:text-brand-400 transition-colors">Decision Trees</Link></li>
              <li><Link to="/lab/k-means" className="hover:text-brand-400 transition-colors">K-Means Clustering</Link></li>
            </ul>
          </div>

          {/* Platform Features */}
          <div>
            <h4 className="text-white font-semibold text-xs tracking-wider uppercase mb-3">Workflow</h4>
            <ul className="space-y-2 text-xs">
              <li><Link to="/docs/linear-regression" className="hover:text-brand-400 transition-colors">1. Learn Intuition & Math</Link></li>
              <li><Link to="/lab/linear-regression" className="hover:text-brand-400 transition-colors">2. Implement from Scratch</Link></li>
              <li><Link to="/lab/linear-regression" className="hover:text-brand-400 transition-colors">3. Automated Test Runner</Link></li>
              <li><Link to="/lab/linear-regression" className="hover:text-brand-400 transition-colors">4. Side-by-Side Verification</Link></li>
              <li><Link to="/datasets" className="hover:text-brand-400 transition-colors">5. Dataset Playground</Link></li>
            </ul>
          </div>

          {/* Technology & Security */}
          <div>
            <h4 className="text-white font-semibold text-xs tracking-wider uppercase mb-3">Security & Architecture</h4>
            <ul className="space-y-2 text-xs">
              <li className="flex items-center space-x-1.5"><ShieldCheck className="w-3.5 h-3.5 text-brand-400" /><span>AST Sandboxed Python Execution</span></li>
              <li className="flex items-center space-x-1.5"><Cpu className="w-3.5 h-3.5 text-cyan-400" /><span>Scikit-learn Verification Baseline</span></li>
              <li className="flex items-center space-x-1.5"><Sparkles className="w-3.5 h-3.5 text-amber-400" /><span>Dynamic Admin Content System</span></li>
            </ul>
          </div>
        </div>

        <div className="pt-6 border-t border-slate-800/60 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400">
          <p>© 2025 ML Laboratory. Built for machine learning education.</p>
          <div className="flex items-center space-x-4 mt-4 sm:mt-0">
            <span className="flex items-center">
              Crafted with <Heart className="w-3 h-3 text-rose-500 mx-1 fill-current" /> for ML practitioners
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
