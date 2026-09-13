import React, { useState, useEffect } from 'react';
import { X, Maximize2, Minimize2 } from 'lucide-react';

const Modal = ({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  size = 'md', // 'sm', 'md', 'lg', 'xl', '2xl', 'full'
  allowFullScreen = true,
  defaultFullScreen = false 
}) => {
  const [isFullScreen, setIsFullScreen] = useState(defaultFullScreen || size === 'full');

  useEffect(() => {
    setIsFullScreen(defaultFullScreen || size === 'full');
  }, [isOpen, defaultFullScreen, size]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    '2xl': 'max-w-6xl',
    full: 'w-[98vw] max-w-[1600px] h-[94vh]',
  };

  const isFull = isFullScreen || size === 'full';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-xs">
      <div 
        className={`bg-dark-900 border border-slate-800 rounded-2xl w-full overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150 flex flex-col transition-all ${
          isFull 
            ? 'w-[98vw] max-w-[1600px] h-[94vh]' 
            : `${sizeClasses[size] || 'max-w-md'} max-h-[90vh]`
        }`}
      >
        {/* Modal Header */}
        <div className="px-6 py-3.5 border-b border-slate-800 flex items-center justify-between bg-dark-950/60 shrink-0">
          <div className="flex items-center space-x-2">
            <h3 className="text-base font-bold text-white tracking-tight">{title}</h3>
            {isFull && (
              <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                Full Display
              </span>
            )}
          </div>
          <div className="flex items-center space-x-1">
            {allowFullScreen && (
              <button
                type="button"
                onClick={() => setIsFullScreen(!isFullScreen)}
                title={isFullScreen ? "Standard view" : "Full screen display"}
                className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
              >
                {isFullScreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              title="Close"
              className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 flex-1 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
};

export default Modal;
