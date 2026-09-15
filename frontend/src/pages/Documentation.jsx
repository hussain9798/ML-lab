import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { documentationAPI, algorithmsAPI, API_BASE_URL } from '../services/api';
import { BlockMath, InlineMath } from 'react-katex';
import 'katex/dist/katex.min.css';
import { 
  BookOpen, 
  FlaskConical, 
  Clock, 
  Sparkles, 
  ChevronRight, 
  ArrowRight, 
  Lightbulb, 
  CheckCircle2, 
  AlertCircle,
  HelpCircle,
  Code2,
  FileText,
  Loader2
} from 'lucide-react';

const Documentation = () => {
  const { slug } = useParams();
  const currentSlug = slug || 'linear-regression';
  const navigate = useNavigate();

  const [doc, setDoc] = useState(null);
  const [docList, setDocList] = useState([]);
  const [loading, setLoading] = useState(true);

  const isBracketMath = (value) => /\\(?:frac|boxed|mathbf|hat|infty|sigma|sum|log|left|right|begin|end|partial)|[=^_]/.test(value);

  const normalizeMath = (math) => math
    .replace(/\\left(?![\[\](){}|])/g, '')
    .replace(/\\right(?![\[\](){}|])/g, '')
    .replace(/\r/g, '')
    .trim();

  const renderMathBlock = (math, key) => (
    <div key={key} className="p-5 rounded-xl bg-dark-950 border border-slate-800 text-center text-cyan-200 overflow-x-auto shadow-inner">
      <BlockMath math={normalizeMath(math)} throwOnError={false} />
    </div>
  );

  const renderInlineContent = (text) => text.split(/(\$\$[\s\S]+?\$\$|\$[^$\n]+\$|\\\[[\s\S]+?\\\]|\\\([\s\S]+?\\\)|\[[\s\S]+?\])/g).map((part, index) => {
    if (part.startsWith('$$') && part.endsWith('$$')) {
      return renderMathBlock(part.slice(2, -2), index);
    }
    if (part.startsWith('\\[') && part.endsWith('\\]')) {
      return renderMathBlock(part.slice(2, -2), index);
    }
    if (part.startsWith('[') && part.endsWith(']') && isBracketMath(part.slice(1, -1))) {
      return renderMathBlock(part.slice(1, -1), index);
    }
    if (part.startsWith('$') && part.endsWith('$') && part.length > 2) {
      return <InlineMath key={index} math={part.slice(1, -1)} throwOnError={false} />;
    }
    if (part.startsWith('\\(') && part.endsWith('\\)')) {
      return <InlineMath key={index} math={part.slice(2, -2).trim()} throwOnError={false} />;
    }
    return <React.Fragment key={index}>{part}</React.Fragment>;
  });

  const renderHeadingBlock = (block, level) => {
    const lines = block.split('\n');
    const heading = lines.shift().replace(/^#{1,3}\s+/, '');
    const Heading = level === 1 ? 'h2' : level === 2 ? 'h3' : 'h4';
    const className = level === 1
      ? 'text-2xl font-bold text-white tracking-tight pt-4 border-b border-slate-800 pb-2'
      : level === 2
        ? 'text-lg font-bold text-cyan-400 tracking-tight pt-3'
        : 'text-sm font-semibold text-brand-300 pt-2 uppercase tracking-wide';

    return (
      <React.Fragment>
        <Heading className={className}>{heading}</Heading>
        {lines.length > 0 && (
          <p className="text-slate-300 leading-relaxed whitespace-pre-line">
            {renderInlineContent(lines.join('\n'))}
          </p>
        )}
      </React.Fragment>
    );
  };

  const parseTableRow = (line) => line.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map((cell) => cell.trim());

  const isTableSeparator = (line) => {
    const cells = parseTableRow(line);
    return cells.length > 0 && cells.every((cell) => /^:?-{3,}:?$/.test(cell));
  };

  const renderTable = (block, key) => {
    const rows = block.split('\n').filter((line) => line.trim().includes('|'));
    if (rows.length < 2 || !isTableSeparator(rows[1])) return null;

    const headers = parseTableRow(rows[0]);
    const bodyRows = rows.slice(2).map(parseTableRow);

    return (
      <div key={key} className="overflow-x-auto rounded-xl border border-slate-800">
        <table className="w-full min-w-[520px] text-left text-xs border-collapse">
          <thead className="bg-slate-800/80 text-slate-200">
            <tr>
              {headers.map((header, index) => (
                <th key={index} className="px-4 py-3 font-bold border-b border-slate-700">
                  {renderInlineContent(header)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800 bg-dark-950/40 text-slate-300">
            {bodyRows.map((row, rowIndex) => (
              <tr key={rowIndex} className="hover:bg-slate-800/40">
                {headers.map((_, cellIndex) => (
                  <td key={cellIndex} className="px-4 py-3 align-top">
                    {renderInlineContent(row[cellIndex] || '')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  useEffect(() => {
    const fetchDocs = async () => {
      setLoading(true);
      try {
        const [docRes, listRes] = await Promise.all([
          documentationAPI.getBySlug(currentSlug),
          documentationAPI.getAll()
        ]);
        setDoc(docRes.data.documentation);
        setDocList(listRes.data.documentation || []);
      } catch (err) {
        console.error('Failed to load documentation:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDocs();
  }, [currentSlug]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-3">
        <Loader2 className="w-8 h-8 text-brand-500 animate-spin" />
        <p className="text-xs text-slate-400 font-mono">Loading documentation & formulas...</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pb-16">
      {/* Sidebar: All Documentation Articles */}
      <aside className="lg:col-span-3 space-y-4">
        <div className="glass-panel rounded-xl p-4 border border-slate-800 bg-dark-900/90 sticky top-20">
          <div className="flex items-center space-x-2 text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
            <BookOpen className="w-4 h-4 text-brand-400" />
            <span>Curriculum Guide</span>
          </div>

          <div className="space-y-1">
            {docList.map((item) => {
              const active = item.algorithm_slug === currentSlug;
              return (
                <Link
                  key={item.algorithm_slug}
                  to={`/docs/${item.algorithm_slug}`}
                  className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                    active
                      ? 'bg-brand-500/15 text-brand-400 border border-brand-500/30 font-semibold'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <span className="truncate">{item.title}</span>
                  <span className="text-[10px] text-slate-500 font-mono">{item.difficulty}</span>
                </Link>
              );
            })}
          </div>

          <div className="pt-4 mt-4 border-t border-slate-800/80">
            <Link
              to={`/lab/${currentSlug}`}
              className="w-full py-2 px-3 rounded-lg text-xs font-bold text-white bg-brand-600 hover:bg-brand-500 shadow-sm transition-all flex items-center justify-center space-x-2"
            >
              <FlaskConical className="w-3.5 h-3.5" />
              <span>Open in Laboratory →</span>
            </Link>
          </div>
        </div>
      </aside>

      {/* Main Documentation Body */}
      <main className="lg:col-span-9 space-y-6">
        {doc ? (
          <div className="glass-panel rounded-2xl p-6 sm:p-10 border border-slate-800 bg-dark-900/90 shadow-2xl space-y-8">
            {/* Header */}
            <div className="border-b border-slate-800 pb-6">
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-brand-500/15 text-brand-400 border border-brand-500/30">
                  {doc.category}
                </span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                  {doc.difficulty}
                </span>
                <div className="flex items-center space-x-1 text-xs text-slate-400 font-mono ml-auto">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{doc.reading_time_min || 8} min read</span>
                </div>
              </div>

              <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                {doc.title}
              </h1>
              <p className="text-sm text-slate-300 mt-2 leading-relaxed">
                {doc.summary}
              </p>
            </div>

            {doc.pdf_url && (
              <section className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white">Reference PDF</h3>
                  <a
                    href={`${API_BASE_URL}${doc.pdf_url.replace('/api', '')}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-brand-400 hover:underline"
                  >
                    Open PDF
                  </a>
                </div>
                <iframe
                  title={`${doc.title} reference PDF`}
                  src={`${API_BASE_URL}${doc.pdf_url.replace('/api', '')}`}
                  className="w-full h-[520px] rounded-xl border border-slate-800 bg-white"
                />
              </section>
            )}

            {/* Intuition Box */}
            {doc.intuition && (
              <div className="p-5 rounded-xl bg-brand-950/30 border border-brand-500/30 flex items-start space-x-3 text-slate-200">
                <Lightbulb className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400 mb-1">
                    The Intuition Behind It
                  </h4>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-sans">
                    {doc.intuition}
                  </p>
                </div>
              </div>
            )}

            {/* Markdown / Formatted Educational Content */}
            <div className="prose prose-invert prose-slate max-w-none text-xs sm:text-sm leading-relaxed text-slate-300 space-y-6">
              {doc.content.split('\n\n').map((block, idx) => {
                const table = renderTable(block, idx);
                if (table) return table;

                // Header level 1
                if (block.startsWith('# ')) {
                  return (
                    <React.Fragment key={idx}>{renderHeadingBlock(block, 1)}</React.Fragment>
                  );
                }
                // Header level 2
                if (block.startsWith('## ')) {
                  return (
                    <React.Fragment key={idx}>{renderHeadingBlock(block, 2)}</React.Fragment>
                  );
                }
                // Header level 3
                if (block.startsWith('### ')) {
                  return (
                    <React.Fragment key={idx}>{renderHeadingBlock(block, 3)}</React.Fragment>
                  );
                }
                // Math Block
                if (block.startsWith('$$') && block.endsWith('$$')) {
                  return renderMathBlock(block.slice(2, -2), idx);
                }
                // Legacy articles may use a standalone [ ... ] math block.
                if (block.trim().startsWith('[') && block.trim().endsWith(']') && isBracketMath(block.trim().slice(1, -1))) {
                  return renderMathBlock(block.trim().slice(1, -1), idx);
                }
                // Divider
                if (block.trim() === '---') {
                  return <hr key={idx} className="border-slate-800 my-6" />;
                }
                // Regular Paragraph
                return (
                  <p key={idx} className="text-slate-300 leading-relaxed whitespace-pre-line">
                    {renderInlineContent(block)}
                  </p>
                );
              })}
            </div>

            {/* Prominent Footer: Open in Laboratory Button */}
            <div className="pt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900/50 -mx-6 -mb-6 p-6 rounded-b-2xl">
              <div>
                <h4 className="text-sm font-bold text-white">Understand the concept?</h4>
                <p className="text-xs text-slate-400">Implement {doc.title} from scratch and verify against Scikit-learn.</p>
              </div>

              <Link
                to={`/lab/${currentSlug}`}
                className="w-full sm:w-auto px-6 py-3 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 shadow-lg shadow-brand-500/25 flex items-center justify-center space-x-2 transition-all"
              >
                <span>Open in Laboratory</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        ) : (
          <div className="glass-panel rounded-2xl p-12 text-center border border-slate-800">
            <p className="text-slate-400 text-sm">Documentation not found for "{currentSlug}".</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default Documentation;
