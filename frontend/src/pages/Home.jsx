import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Terminal, 
  Cpu, 
  CheckCircle2, 
  ArrowRight, 
  GitCompare, 
  Sparkles, 
  BookOpen, 
  Database, 
  ShieldCheck, 
  Layers,
  Code2,
  TrendingUp,
  Award
} from 'lucide-react';

const Home = () => {
  const steps = [
    { num: '01', title: 'Learn Intuition & Math', desc: 'Master foundational principles, loss functions, and derivations without overwhelming black-box jargon.' },
    { num: '02', title: 'Implement From Scratch', desc: 'Write the core algorithm using raw NumPy matrices, defining your own fit() and predict() methods.' },
    { num: '03', title: 'Execute in Secure Sandbox', desc: 'Run your Python code in an AST-analyzed, isolated execution environment with strict resource bounds.' },
    { num: '04', title: 'Benchmark Against Sklearn', desc: 'Execute standard Scikit-learn models side-by-side under the exact same dataset and test parameters.' },
    { num: '05', title: 'Automated Tolerance Verdict', desc: 'Verify accuracy within mathematical tolerance thresholds (e.g. Δ <= 0.05) to achieve verified status.' },
    { num: '06', title: 'Save & Track ML Progress', desc: 'Save experiment metrics, visualize performance, and build your verified machine learning portfolio.' },
  ];

  const algorithms = [
    { name: 'Linear Regression', category: 'Regression', difficulty: 'Beginner', slug: 'linear-regression' },
    { name: 'Polynomial Regression', category: 'Regression', difficulty: 'Intermediate', slug: 'polynomial-regression' },
    { name: 'Logistic Regression', category: 'Classification', difficulty: 'Beginner', slug: 'logistic-regression' },
    { name: 'K-Nearest Neighbors', category: 'Classification', difficulty: 'Beginner', slug: 'knn' },
    { name: 'Decision Trees', category: 'Classification', difficulty: 'Intermediate', slug: 'decision-tree' },
    { name: 'Random Forest', category: 'Classification', difficulty: 'Advanced', slug: 'random-forest' },
    { name: 'Support Vector Machine', category: 'Classification', difficulty: 'Intermediate', slug: 'svm' },
    { name: 'Naive Bayes', category: 'Classification', difficulty: 'Beginner', slug: 'naive-bayes' },
    { name: 'K-Means Clustering', category: 'Clustering', difficulty: 'Beginner', slug: 'k-means' },
  ];

  return (
    <div className="space-y-24 pb-20">
      {/* Hero Section */}
      <section className="relative pt-12 pb-8 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-brand-500/10 via-transparent to-transparent pointer-events-none"></div>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-brand-500/10 border border-brand-500/30 text-brand-400 text-xs font-semibold mb-6">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Interactive Machine Learning Engineering Laboratory</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white leading-tight mb-6 max-w-4xl mx-auto">
            Stop Treating Machine Learning Like a{' '}
            <span className="bg-gradient-to-r from-brand-400 via-cyan-400 to-indigo-400 bg-clip-text text-transparent">
              Black Box
            </span>
            .
          </h1>

          <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed mb-10">
            Learn the theory, code algorithms from scratch using raw Python and NumPy, and automatically verify your implementation against Scikit-learn side-by-side.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/lab/linear-regression"
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 shadow-lg shadow-brand-500/30 flex items-center justify-center space-x-2 transition-all transform hover:-translate-y-0.5"
            >
              <span>Start Learning</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/algorithms"
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl font-semibold text-sm text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 flex items-center justify-center space-x-2 transition-all"
            >
              <Code2 className="w-4 h-4 text-brand-400" />
              <span>Explore Algorithms</span>
            </Link>
          </div>

          {/* Visual Showcase Card: Comparison Preview */}
          <div className="mt-16 max-w-4xl mx-auto rounded-2xl border border-slate-800 bg-dark-900/90 shadow-2xl p-4 sm:p-6 text-left">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <span className="w-3 h-3 rounded-full bg-rose-500/80"></span>
                <span className="w-3 h-3 rounded-full bg-amber-500/80"></span>
                <span className="w-3 h-3 rounded-full bg-emerald-500/80"></span>
                <span className="text-xs font-mono text-slate-400 ml-2">ML Laboratory Live Benchmarking Engine</span>
              </div>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-mono font-semibold">
                Tolerance Test: PASS (Δ = 0.01)
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Scratch card */}
              <div className="p-4 rounded-xl bg-dark-950/80 border border-cyan-500/30">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-xs font-bold uppercase text-cyan-400 font-mono">From Scratch (Your Code)</span>
                  <span className="text-[10px] bg-cyan-500/20 text-cyan-300 px-2 py-0.5 rounded font-mono">NumPy</span>
                </div>
                <div className="space-y-1.5 text-xs font-mono">
                  <div className="flex justify-between text-slate-300"><span>Test Prediction:</span><span className="text-white font-bold">75.20</span></div>
                  <div className="flex justify-between text-slate-300"><span>R² Score:</span><span className="text-emerald-400 font-bold">0.942</span></div>
                  <div className="flex justify-between text-slate-300"><span>MSE:</span><span>0.058</span></div>
                  <div className="flex justify-between text-slate-300"><span>Time:</span><span className="text-slate-400">18.4 ms</span></div>
                </div>
              </div>

              {/* Built-in card */}
              <div className="p-4 rounded-xl bg-dark-950/80 border border-brand-500/30">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-xs font-bold uppercase text-brand-400 font-mono">Built-In (Industry Reference)</span>
                  <span className="text-[10px] bg-brand-500/20 text-brand-300 px-2 py-0.5 rounded font-mono">Scikit-learn</span>
                </div>
                <div className="space-y-1.5 text-xs font-mono">
                  <div className="flex justify-between text-slate-300"><span>Test Prediction:</span><span className="text-white font-bold">75.31</span></div>
                  <div className="flex justify-between text-slate-300"><span>R² Score:</span><span className="text-emerald-400 font-bold">0.951</span></div>
                  <div className="flex justify-between text-slate-300"><span>MSE:</span><span>0.051</span></div>
                  <div className="flex justify-between text-slate-300"><span>Time:</span><span className="text-slate-400">6.2 ms</span></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* What is ML Laboratory? Section */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <span className="text-xs font-bold text-brand-400 tracking-wider uppercase">Educational Mission</span>
            <h2 className="text-3xl font-bold text-white tracking-tight mt-2 mb-4">
              A Platform Built For Real Understanding, Not Just Fitting Models
            </h2>
            <p className="text-sm text-slate-300 leading-relaxed mb-4">
              Most ML tutorials tell you to import a library and call <code className="text-brand-400 bg-slate-800 px-1.5 py-0.5 rounded font-mono">model.fit()</code>. When production models behave unexpectedly or interviewers ask for the underlying mathematics, students are left unprepared.
            </p>
            <p className="text-sm text-slate-300 leading-relaxed mb-6">
              ML Laboratory reverses this. You build the gradient steps, matrix transformations, distance formulas, and tree splits yourself. Then our testing harness executes both implementations simultaneously on the same test dataset to evaluate numerical equivalence.
            </p>

            <div className="grid grid-cols-2 gap-3 font-mono text-xs">
              <div className="flex items-center space-x-2 text-slate-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Zero Black Boxes</span>
              </div>
              <div className="flex items-center space-x-2 text-slate-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Automated Validation</span>
              </div>
              <div className="flex items-center space-x-2 text-slate-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>AST-Protected Sandbox</span>
              </div>
              <div className="flex items-center space-x-2 text-slate-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Interactive Charts</span>
              </div>
            </div>
          </div>

          {/* Workflow Diagram */}
          <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4 font-mono">The 6-Step Mastery Workflow</h3>
            <div className="space-y-3">
              {steps.map((step) => (
                <div key={step.num} className="flex items-start space-x-3 p-2.5 rounded-lg hover:bg-slate-800/50 transition-colors">
                  <span className="text-xs font-mono font-bold text-brand-400 bg-brand-500/10 px-2 py-0.5 rounded border border-brand-500/20">
                    {step.num}
                  </span>
                  <div>
                    <h4 className="text-xs font-bold text-white">{step.title}</h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Supported Algorithms Catalog Grid */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <span className="text-xs font-bold text-brand-400 tracking-wider uppercase">Interactive Catalog</span>
          <h2 className="text-3xl font-bold text-white tracking-tight mt-1">Supported Machine Learning Algorithms</h2>
          <p className="text-xs text-slate-400 mt-2">Every algorithm includes full documentation, starter code, test suites, and Scikit-learn benchmarks.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
                  <span className="text-[10px] text-slate-400 font-medium">
                    {algo.difficulty}
                  </span>
                </div>
                <h3 className="text-base font-bold text-white mb-2">{algo.name}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Implement from first principles using NumPy, evaluate with standard metrics, and compare against Scikit-learn.
                </p>
              </div>

              <div className="flex items-center space-x-2 pt-4 mt-4 border-t border-slate-800/80">
                <Link
                  to={`/docs/${algo.slug}`}
                  className="flex-1 text-center py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 transition-colors"
                >
                  Read Docs
                </Link>
                <Link
                  to={`/lab/${algo.slug}`}
                  className="flex-1 text-center py-1.5 rounded-lg text-xs font-semibold text-white bg-brand-600 hover:bg-brand-500 transition-colors"
                >
                  Open Lab
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Call to Action Banner */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-gradient-to-r from-brand-900/60 via-indigo-950/60 to-dark-900 border border-brand-500/30 p-8 sm:p-12 text-center relative overflow-hidden shadow-2xl">
          <h2 className="text-3xl font-extrabold text-white tracking-tight mb-4">
            Ready to Master Machine Learning from Scratch?
          </h2>
          <p className="text-sm text-slate-300 max-w-xl mx-auto mb-8">
            Create your account today, inspect the mathematical intuition, write your implementation, and earn your verified algorithm badges.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link
              to="/register"
              className="px-8 py-3 rounded-xl font-bold text-sm text-white bg-brand-600 hover:bg-brand-500 shadow-lg shadow-brand-500/30 transition-all"
            >
              Get Started for Free
            </Link>
            <Link
              to="/lab/linear-regression"
              className="px-8 py-3 rounded-xl font-semibold text-sm text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-all"
            >
              Try Linear Regression Lab
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
