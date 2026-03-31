import React, { useState } from 'react';
import { LegalPage } from '../components/LegalPage';
import { Mail, Phone, MapPin, Send, MessageSquare, Clock } from 'lucide-react';

export function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSubmitted(true);
      setFormData({ name: '', email: '', subject: '', message: '' });
    }, 1500);
  };

  return (
    <LegalPage title="Contact Us" lastUpdated="March 24, 2026">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Contact Info */}
        <div className="lg:col-span-5 space-y-8">
          <p className="text-slate-600 leading-relaxed">
            Have a question or need assistance? Our dedicated support team is here to help you. Reach out to us through any of the following channels.
          </p>

          <div className="space-y-6">
            <div className="flex gap-4 p-6 rounded-2xl bg-slate-50 border border-slate-100 group hover:border-violet-200 transition-colors">
              <div className="shrink-0 w-12 h-12 bg-violet-100 rounded-xl flex items-center justify-center text-violet-600 group-hover:bg-violet-600 group-hover:text-white transition-all">
                <Phone size={24} />
              </div>
              <div>
                <h4 className="font-bold text-slate-900">Call Us</h4>
                <p className="text-sm text-slate-500 mb-1">Available 9 AM - 9 PM UAE Time</p>
                <p className="font-black text-violet-600">+971 52 260 8063</p>
              </div>
            </div>

            <div className="flex gap-4 p-6 rounded-2xl bg-slate-50 border border-slate-100 group hover:border-violet-200 transition-colors">
              <div className="shrink-0 w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-all">
                <Mail size={24} />
              </div>
              <div>
                <h4 className="font-bold text-slate-900">Email Us</h4>
                <p className="text-sm text-slate-500 mb-1">We respond within 24 hours</p>
                <p className="font-black text-emerald-600">exshopi@exshopi.com</p>
              </div>
            </div>

            <div className="flex gap-4 p-6 rounded-2xl bg-slate-50 border border-slate-100 group hover:border-violet-200 transition-colors">
              <div className="shrink-0 w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all">
                <MapPin size={24} />
              </div>
              <div>
                <h4 className="font-bold text-slate-900">Visit Us</h4>
                <p className="text-sm text-slate-500 mb-1">Our Corporate Office</p>
                <p className="font-black text-blue-600">Business Bay, Dubai, UAE</p>
              </div>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-violet-50 border border-violet-100 flex items-center gap-4">
            <div className="w-10 h-10 bg-violet-600 rounded-full flex items-center justify-center text-white animate-pulse">
              <MessageSquare size={20} />
            </div>
            <div>
              <p className="text-sm font-bold text-violet-900">Live Chat Available</p>
              <p className="text-xs text-violet-700">Average response time: 2 mins</p>
            </div>
          </div>
        </div>

        {/* Contact Form */}
        <div className="lg:col-span-7">
          <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
            {isSubmitted ? (
              <div className="text-center py-12 space-y-6">
                <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                  <Send size={40} />
                </div>
                <h3 className="text-2xl font-black text-slate-900">Message Sent!</h3>
                <p className="text-slate-500 max-w-sm mx-auto">Thank you for reaching out. Our team will get back to you as soon as possible.</p>
                <button 
                  onClick={() => setIsSubmitted(false)}
                  className="text-violet-600 font-bold hover:underline"
                >
                  Send another message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 ml-1">Full Name</label>
                    <input 
                      required
                      type="text" 
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      placeholder="John Doe" 
                      className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-slate-100 focus:border-violet-500 focus:bg-white outline-none transition-all text-sm font-medium"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 ml-1">Email Address</label>
                    <input 
                      required
                      type="email" 
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      placeholder="john@example.com" 
                      className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-slate-100 focus:border-violet-500 focus:bg-white outline-none transition-all text-sm font-medium"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 ml-1">Subject</label>
                  <input 
                    required
                    type="text" 
                    value={formData.subject}
                    onChange={(e) => setFormData({...formData, subject: e.target.value})}
                    placeholder="How can we help?" 
                    className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-slate-100 focus:border-violet-500 focus:bg-white outline-none transition-all text-sm font-medium"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 ml-1">Message</label>
                  <textarea 
                    required
                    rows={5}
                    value={formData.message}
                    onChange={(e) => setFormData({...formData, message: e.target.value})}
                    placeholder="Tell us more about your inquiry..." 
                    className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-slate-100 focus:border-violet-500 focus:bg-white outline-none transition-all text-sm font-medium resize-none"
                  ></textarea>
                </div>
                <button 
                  disabled={isSubmitting}
                  className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-violet-600 transition-all shadow-xl shadow-slate-900/10 disabled:opacity-50 flex items-center justify-center gap-3"
                >
                  {isSubmitting ? (
                    <>Sending Message...</>
                  ) : (
                    <>
                      Send Message
                      <Send size={18} />
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </LegalPage>
  );
}
