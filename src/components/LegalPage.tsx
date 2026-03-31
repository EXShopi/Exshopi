import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

interface LegalPageProps {
  title: string;
  lastUpdated: string;
  children: React.ReactNode;
}

export function LegalPage({ title, lastUpdated, children }: LegalPageProps) {
  return (
    <div className="min-h-screen bg-slate-50 pt-24 pb-20">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <Link to="/" className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-violet-600 transition-colors mb-8">
            <ArrowLeft size={16} /> Back to Home
          </Link>
          
          <div className="glass p-8 md:p-12 rounded-[2rem] border border-slate-200/50 shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
            <h1 className="text-3xl md:text-4xl font-black text-slate-900 mb-4 tracking-tight">{title}</h1>
            <p className="text-sm font-medium text-slate-500 mb-12">Last Updated: {lastUpdated}</p>
            
            <div className="prose prose-slate prose-violet max-w-none prose-headings:font-bold prose-headings:tracking-tight prose-a:font-bold prose-a:text-violet-600 hover:prose-a:text-violet-700">
              {children}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
