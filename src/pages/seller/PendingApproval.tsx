import React from 'react';
import { Link } from 'react-router-dom';
import { Clock, CheckCircle2, ArrowLeft, LogOut } from 'lucide-react';
import AuthService from '../../lib/authService';

export function PendingApproval() {
  const handleLogout = async () => {
    await AuthService.signOut();
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8 bg-white p-12 rounded-[40px] shadow-2xl shadow-slate-200 border border-slate-100 text-center">
        <div className="w-20 h-20 bg-amber-100 text-amber-500 rounded-3xl flex items-center justify-center mx-auto mb-8 animate-pulse">
          <Clock size={40} />
        </div>
        <h2 className="text-4xl font-black text-slate-900 tracking-tight">Application Pending</h2>
        <p className="text-slate-500 font-medium mt-4 leading-relaxed">
          Your vendor application has been received and is currently under review by our team. This process usually takes 24-48 hours.
        </p>
        
        <div className="bg-slate-50 p-6 rounded-3xl space-y-4 text-left">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="text-emerald-500" size={18} />
            <span className="text-xs font-black uppercase tracking-widest text-slate-600">Account Created</span>
          </div>
          <div className="flex items-center gap-3">
            <Clock className="text-amber-500" size={18} />
            <span className="text-xs font-black uppercase tracking-widest text-slate-600">Reviewing Documents</span>
          </div>
          <div className="flex items-center gap-3 opacity-40">
            <div className="w-[18px] h-[18px] rounded-full border-2 border-slate-300" />
            <span className="text-xs font-black uppercase tracking-widest text-slate-600">Store Activation</span>
          </div>
        </div>

        <div className="pt-8 space-y-4">
          <Link 
            to="/" 
            className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black text-sm shadow-xl shadow-slate-900/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            <ArrowLeft size={18} />
            Back to Marketplace
          </Link>
          <button 
            onClick={handleLogout}
            className="w-full text-slate-400 font-black uppercase tracking-widest text-[10px] hover:text-rose-500 transition-colors flex items-center justify-center gap-2"
          >
            <LogOut size={14} />
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}
