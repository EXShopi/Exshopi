import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, Sparkles, Search, ArrowRight, ShoppingBag, 
  Zap, ShieldCheck, CheckCircle2, Store, MessageSquare,
  ChevronRight, Filter, AlertCircle
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatAEDPlain } from '../lib/currency';

interface AISearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AISearchModal({ isOpen, onClose }: AISearchModalProps) {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      setQuery('');
      setResults(null);
      setError(null);
    }
  }, [isOpen]);

  const handleAISearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!query.trim() || isSearching) return;

    setIsSearching(true);
    setError(null);
    setResults(null);

    try {
      const response = await fetch('/api/ai-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query })
      });

      if (!response.ok) throw new Error('Failed to process AI search');
      
      const data = await response.json();
      setResults(data);
    } catch (err) {
      console.error('AI Search Error:', err);
      setError('Sorry, I couldn\'t process your search right now. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

  const suggestions = [
    "I'm looking for a new iPhone under 4000 AED",
    "Best gaming laptops for professional use",
    "Used MacBook Pro in excellent condition",
    "Red coffee machine for my kitchen",
    "Powerful vacuum cleaner with long battery life"
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[2000] flex items-start justify-center pt-20 px-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/80 backdrop-blur-md"
          />

          {/* Modal Content */}
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="relative w-full max-w-4xl bg-white rounded-[3rem] shadow-[0_50px_100px_rgba(0,0,0,0.3)] border border-white/20 overflow-hidden flex flex-col max-h-[80vh]"
          >
            {/* Header / Search Input */}
            <div className="p-8 lg:p-12 border-b border-slate-100 bg-gradient-to-br from-slate-50 to-white relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8">
                <button 
                  onClick={onClose}
                  className="p-3 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-2xl transition-all"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="max-w-2xl mx-auto text-center space-y-6">
                <div className="inline-flex items-center gap-3 px-4 py-2 bg-violet-100 text-violet-600 rounded-full text-[10px] font-black uppercase tracking-widest animate-pulse">
                  <Sparkles size={14} /> Powered by EXSHOPI AI
                </div>
                <h2 className="text-3xl lg:text-4xl font-black text-slate-900 tracking-tight">
                  What are you looking for today?
                </h2>
                <p className="text-slate-500 font-medium">
                  Search naturally. Try "I want a new iPhone under 4000 AED" or "Best gaming laptops".
                </p>

                <form onSubmit={handleAISearch} className="relative group mt-8">
                  <div className="absolute inset-0 bg-violet-500/20 blur-2xl rounded-full opacity-0 group-focus-within:opacity-100 transition-opacity"></div>
                  <div className="relative flex items-center gap-3 h-16 bg-white border-2 border-violet-500 rounded-[2rem] px-5 shadow-xl transition-all">
                    <Search size={24} className="text-violet-500 shrink-0" />
                    <input
                      ref={inputRef}
                      type="text"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Describe your perfect product..."
className="flex-1 px-2 py-2 bg-transparent text-lg flex-1 h-full px-2 bg-transparent text-lg font-bold text-slate-900 outline-none placeholder:text-slate-300 leading-none-bold text-slate-900 outline-none placeholder:text-slate-300"                    />
                    <button 
                      type="submit"
                      disabled={isSearching || !query.trim()}
                      className="hh-12 px-8 bg-slate-800 text-white rounded-full font-black uppercase tracking-widest text-sm hover:bg-slate-900 disabled:opacity-50 flex items-center justify-center gap-2 shrink-0-12 px-8 bg-slate-400 text-white rounded-full font-black uppercase tracking-widest text-sm hover:bg-slate-500 disabled:opacity-50 flex items-center justify-center gap-2 shrink-0x-10 py-4 bg-slate-900 text-white rounded-[1.5rem] font-black uppercase tracking-widest text-xs hover:bg-violet-600 disabled:opacity-50 disabled:hover:bg-slate-900 transition-all flex items-center gap-3 group/btn"
                    >
                      {isSearching ? (
                        <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                      ) : (
                       <div className="flex items-center justify-center gap-2 leading-none">
  <Sparkles size={16} className="shrink-0" />
  <span className="leading-none">AI Search</span>
</div>
                        
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>

            {/* Results Area */}
            <div className="flex-1 overflow-y-auto p-8 lg:p-12 bg-white">
              <AnimatePresence mode="wait">
                {isSearching ? (
                  <motion.div 
                    key="searching"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-col items-center justify-center py-20 gap-6"
                  >
                    <div className="relative">
                      <div className="w-20 h-20 border-4 border-violet-100 border-t-violet-600 rounded-full animate-spin"></div>
                      <Sparkles size={32} className="absolute inset-0 m-auto text-violet-600 animate-pulse" />
                    </div>
                    <div className="text-center space-y-2">
                      <p className="text-lg font-black text-slate-900">Consulting EXSHOPI AI...</p>
                      <p className="text-sm text-slate-400 font-medium">Analyzing your request and searching our premium catalog</p>
                    </div>
                  </motion.div>
                ) : results ? (
                  <motion.div 
                    key="results"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-12"
                  >
                    {/* AI Reasoning */}
                    <div className="bg-violet-50 rounded-[2rem] p-8 border border-violet-100 flex gap-6 items-start">
                      <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-violet-600 shadow-sm shrink-0">
                        <MessageSquare size={24} />
                      </div>
                      <div className="space-y-2">
                        <p className="text-[10px] font-black text-violet-400 uppercase tracking-widest">AI Assistant</p>
                        <p className="text-lg font-bold text-slate-800 leading-relaxed">
                          {results.filters.reasoning}
                        </p>
                        <div className="flex flex-wrap gap-2 mt-4">
                          {results.filters.category && (
                            <span className="px-3 py-1 bg-white border border-violet-100 text-violet-600 text-[10px] font-black rounded-lg uppercase tracking-widest">
                              Category: {results.filters.category}
                            </span>
                          )}
                          {results.filters.brand && (
                            <span className="px-3 py-1 bg-white border border-violet-100 text-violet-600 text-[10px] font-black rounded-lg uppercase tracking-widest">
                              Brand: {results.filters.brand}
                            </span>
                          )}
                          {(results.filters.minPrice || results.filters.maxPrice) && (
                            <span className="px-3 py-1 bg-white border border-violet-100 text-violet-600 text-[10px] font-black rounded-lg uppercase tracking-widest">
                              Price: {results.filters.minPrice || 0} - {results.filters.maxPrice || 'Any'} AED
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Product Grid */}
                    <div className="space-y-6">
                      <div className="flex items-center justify-between">
                        <h3 className="text-xl font-black text-slate-900 flex items-center gap-3">
                          <ShoppingBag size={24} className="text-violet-600" />
                          Found {results.count} Matches
                        </h3>
                        <Link 
                          to={`/products?search=${encodeURIComponent(results.filters.searchTerms)}`}
                          onClick={onClose}
                          className="text-xs font-black text-violet-600 hover:text-violet-700 flex items-center gap-2 uppercase tracking-widest group"
                        >
                          View All Results <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                        </Link>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {results.results.map((product: any) => (
                          <Link
                            key={product.id}
                            to={`/product/${product.id}`}
                            onClick={onClose}
                            className="group flex gap-6 p-6 bg-slate-50 hover:bg-white rounded-[2rem] border border-transparent hover:border-slate-200 hover:shadow-xl transition-all duration-500"
                          >
                            <div className="w-32 h-32 bg-white rounded-2xl border border-slate-100 overflow-hidden shrink-0">
                              <img 
                                src={product.image} 
                                alt={product.title} 
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                              />
                            </div>
                            <div className="flex-1 min-w-0 flex flex-col justify-between py-1">
                              <div>
                                <div className="flex items-center gap-2 mb-2">
                                  <span className="px-2 py-0.5 bg-white text-slate-500 text-[8px] font-black rounded uppercase tracking-widest border border-slate-100">
                                    {product.brand}
                                  </span>
                                  {product.condition === 'Used' && (
                                    <span className="px-2 py-0.5 bg-amber-50 text-amber-600 text-[8px] font-black rounded uppercase tracking-widest border border-amber-100">
                                      Pre-Owned
                                    </span>
                                  )}
                                </div>
                                <h4 className="text-sm font-bold text-slate-900 line-clamp-2 group-hover:text-violet-600 transition-colors">
                                  {product.title}
                                </h4>
                              </div>
                              <div className="flex items-center justify-between mt-4">
                                <div className="flex flex-col">
                                  <span className="text-lg font-black text-slate-900">{formatAEDPlain(product.salePrice || product.price)}</span>
                                  {product.salePrice && (
                                    <span className="text-[10px] text-slate-400 line-through font-bold">{formatAEDPlain(product.price)}</span>
                                  )}
                                </div>
                                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-slate-300 group-hover:bg-violet-600 group-hover:text-white transition-all shadow-sm">
                                  <ChevronRight size={20} />
                                </div>
                              </div>
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                ) : error ? (
                  <motion.div 
                    key="error"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex flex-col items-center justify-center py-20 gap-6 text-center"
                  >
                    <div className="w-20 h-20 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center">
                      <AlertCircle size={40} />
                    </div>
                    <div className="space-y-2">
                      <p className="text-lg font-black text-slate-900">Oops! Something went wrong</p>
                      <p className="text-sm text-slate-400 font-medium max-w-md mx-auto">{error}</p>
                    </div>
                    <button 
                      onClick={() => handleAISearch()}
                      className="px-8 py-3 bg-slate-900 text-white rounded-xl font-black uppercase tracking-widest text-xs hover:bg-violet-600 transition-all"
                    >
                      Try Again
                    </button>
                  </motion.div>
                ) : (
                  <motion.div 
                    key="initial"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="space-y-12"
                  >
                    {/* Suggestions */}
                    <div className="space-y-6">
                      <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        <Sparkles size={14} /> Try these suggestions
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {suggestions.map((s, i) => (
                          <button
                            key={i}
                            onClick={() => {
                              setQuery(s);
                              // Trigger search immediately
                              const fakeEvent = { preventDefault: () => {} } as any;
                              setTimeout(() => handleAISearch(fakeEvent), 100);
                            }}
                            className="text-left p-6 bg-slate-50 hover:bg-violet-50 rounded-[2rem] border border-transparent hover:border-violet-100 transition-all group flex items-center justify-between"
                          >
                            <span className="text-sm font-bold text-slate-700 group-hover:text-violet-900">{s}</span>
                            <ArrowRight size={18} className="text-slate-200 group-hover:text-violet-400 group-hover:translate-x-1 transition-all" />
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Trust Badges */}
                    <div className="grid grid-cols-3 gap-8 pt-12 border-t border-slate-100">
                      <div className="flex flex-col items-center text-center gap-4">
                        <div className="w-12 h-12 bg-emerald-50 text-emerald-500 rounded-2xl flex items-center justify-center">
                          <CheckCircle2 size={24} />
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs font-black text-slate-900 uppercase tracking-widest">Verified Data</p>
                          <p className="text-[10px] text-slate-400 font-medium">Real-time inventory from official vendors</p>
                        </div>
                      </div>
                      <div className="flex flex-col items-center text-center gap-4">
                        <div className="w-12 h-12 bg-blue-50 text-blue-500 rounded-2xl flex items-center justify-center">
                          <ShieldCheck size={24} />
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs font-black text-slate-900 uppercase tracking-widest">Secure Search</p>
                          <p className="text-[10px] text-slate-400 font-medium">Privacy-focused AI processing</p>
                        </div>
                      </div>
                      <div className="flex flex-col items-center text-center gap-4">
                        <div className="w-12 h-12 bg-violet-50 text-violet-600 rounded-2xl flex items-center justify-center">
                          <Zap size={24} />
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs font-black text-slate-900 uppercase tracking-widest">Instant Results</p>
                          <p className="text-[10px] text-slate-400 font-medium">Semantic matching across 10,000+ items</p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
