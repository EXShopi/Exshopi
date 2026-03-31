import React, { useState } from 'react';
import { LegalPage } from '../components/LegalPage';
import { ChevronDown, ChevronUp, Search, HelpCircle, MessageCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

export function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      question: "How do I track my order?",
      answer: "You can track your order by clicking on the 'Track Order' link in the footer or by visiting your account dashboard. Simply enter your order ID and email address to see the real-time status of your delivery."
    },
    {
      question: "What are the delivery charges?",
      answer: "We offer free delivery on all orders over AED 200 within the UAE. For orders below AED 200, a flat delivery fee of AED 15 applies to all major cities."
    },
    {
      question: "How can I return an item?",
      answer: "We have a hassle-free 15-day return policy. You can initiate a return from your account dashboard or by contacting our support team. The item must be in its original packaging and unused."
    },
    {
      question: "What payment methods do you accept?",
      answer: "We currently support verified Cash on Delivery (COD) across active UAE delivery areas. Your phone number is verified before the order is confirmed."
    },
    {
      question: "Are the products genuine?",
      answer: "Yes, 100%. EXSHOPI only works with verified vendors and official brand distributors. Every product sold on our platform is guaranteed to be authentic and comes with a manufacturer warranty where applicable."
    },
    {
      question: "How long does delivery take?",
      answer: "For major cities like Dubai, Abu Dhabi, and Sharjah, we offer same-day or next-day delivery. For other locations in the UAE, delivery typically takes 2-3 business days."
    },
    {
      question: "Can I cancel my order?",
      answer: "You can cancel your order at any time before it is shipped. Once the order is out for delivery, you may need to follow our return process if you no longer wish to keep the item."
    },
    {
      question: "How do I contact customer support?",
      answer: "Our support team is available 24/7. You can reach us via live chat on our website, email us at exshopi@exshopi.com, or call us at +971 52 260 8063."
    }
  ];

  return (
    <LegalPage title="Frequently Asked Questions" lastUpdated="March 24, 2026">
      <div className="space-y-12">
        {/* Search Bar */}
        <div className="relative">
          <input 
            type="text" 
            placeholder="Search for answers..." 
            className="w-full px-8 py-6 rounded-3xl bg-slate-100 border border-slate-200 focus:border-violet-500 focus:bg-white outline-none transition-all text-lg font-medium pl-16 shadow-inner"
          />
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" size={24} />
        </div>

        {/* FAQ List */}
        <div className="space-y-4">
          {faqs.map((faq, i) => (
            <div 
              key={i} 
              className={`rounded-3xl border transition-all duration-300 ${
                openIndex === i 
                  ? 'bg-white border-violet-200 shadow-xl shadow-violet-500/5' 
                  : 'bg-slate-50 border-slate-100 hover:border-violet-200'
              }`}
            >
              <button 
                onClick={() => setOpenIndex(openIndex === i ? null : i)}
                className="w-full px-8 py-6 flex items-center justify-between text-left group"
              >
                <span className={`text-lg font-bold tracking-tight transition-colors ${
                  openIndex === i ? 'text-violet-600' : 'text-slate-900 group-hover:text-violet-600'
                }`}>
                  {faq.question}
                </span>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                  openIndex === i ? 'bg-violet-600 text-white rotate-180' : 'bg-white text-slate-400 group-hover:bg-violet-50 group-hover:text-violet-600'
                }`}>
                  {openIndex === i ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </div>
              </button>
              
              <div className={`overflow-hidden transition-all duration-300 ease-in-out ${
                openIndex === i ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'
              }`}>
                <div className="px-8 pb-8 pt-2 text-slate-600 leading-relaxed font-medium border-t border-slate-100 mx-8">
                  {faq.answer}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Still have questions? */}
        <div className="p-10 rounded-[2.5rem] bg-violet-600 text-white text-center space-y-6 shadow-2xl shadow-violet-500/20">
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto">
            <HelpCircle size={32} />
          </div>
          <h2 className="text-3xl font-black tracking-tight">Still have questions?</h2>
          <p className="text-violet-100 max-w-md mx-auto">If you couldn't find the answer you were looking for, please don't hesitate to reach out to our team.</p>
          <div className="pt-4">
            <Link to="/contact" className="inline-flex items-center gap-2 bg-white text-violet-600 px-10 py-5 rounded-2xl font-black text-sm uppercase tracking-widest transition-all hover:scale-105 shadow-xl shadow-black/10">
              <MessageCircle size={20} />
              Contact Support
            </Link>
          </div>
        </div>
      </div>
    </LegalPage>
  );
}
