import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCcw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: string | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    (this as any).state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
    try {
      const parsedError = JSON.parse(error.message);
      (this as any).setState({ errorInfo: JSON.stringify(parsedError, null, 2) });
    } catch (e) {
      (this as any).setState({ errorInfo: error.message });
    }
  }

  render() {
    if ((this as any).state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
          <div className="max-w-2xl w-full bg-white rounded-[2.5rem] shadow-2xl border border-rose-100 p-8 md:p-12 text-center">
            <div className="w-20 h-20 bg-rose-50 text-rose-600 rounded-3xl flex items-center justify-center mx-auto mb-8">
              <AlertTriangle size={40} />
            </div>
            
            <h1 className="text-3xl font-black text-slate-900 tracking-tighter mb-4">
              Something went wrong
            </h1>
            
            <p className="text-slate-500 font-medium mb-8 leading-relaxed">
              We encountered an unexpected error. This might be due to a temporary connection issue or a configuration problem.
            </p>

            {(this as any).state.errorInfo && (
              <div className="bg-slate-900 rounded-2xl p-6 mb-8 text-left overflow-auto max-h-64">
                <pre className="text-xs font-mono text-emerald-400 leading-relaxed">
                  {(this as any).state.errorInfo}
                </pre>
              </div>
            )}

            <div className="flex flex-wrap justify-center gap-4">
              <button
                onClick={() => window.location.reload()}
                className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-black text-sm uppercase tracking-widest transition-all hover:scale-105 flex items-center gap-2"
              >
                <RefreshCcw size={18} /> Reload Page
              </button>
              <a
                href="/"
                onClick={() => (this as any).setState({ hasError: false })}
                className="bg-white text-slate-900 border border-slate-200 px-8 py-4 rounded-2xl font-black text-sm uppercase tracking-widest transition-all hover:bg-slate-50 flex items-center gap-2"
              >
                <Home size={18} /> Back to Home
              </a>
            </div>
            
            <div className="mt-12 pt-8 border-t border-slate-100">
              <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">
                If the problem persists, please contact support
              </p>
            </div>
          </div>
        </div>
      );
    }

    return (this as any).props.children;
  }
}
