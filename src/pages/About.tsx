import React from 'react';
import { LegalPage } from '../components/LegalPage';
import { Package, ShieldCheck, Truck, Users, Store, Globe } from 'lucide-react';
import { Link } from 'react-router-dom';

export function About() {
  return (
    <LegalPage title="About EXSHOPI" lastUpdated="March 24, 2026">
      <div className="space-y-12">
        <section>
          <p className="text-lg text-slate-600 leading-relaxed">
            EXSHOPI is the UAE's premier multi-vendor marketplace, dedicated to connecting local businesses with shoppers across the Emirates. Experience luxury shopping with same-day delivery, 100% authentic products, and verified Cash on Delivery service across the UAE.
          </p>
        </section>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100">
            <div className="w-12 h-12 bg-violet-100 rounded-xl flex items-center justify-center text-violet-600 mb-4">
              <Globe size={24} />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Our Mission</h3>
            <p className="text-slate-600">To empower local vendors and provide UAE customers with a seamless, secure, and premium shopping destination for all their needs.</p>
          </div>
          <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100">
            <div className="w-12 h-12 bg-violet-100 rounded-xl flex items-center justify-center text-violet-600 mb-4">
              <Users size={24} />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Our Community</h3>
            <p className="text-slate-600">We believe in the power of local businesses. EXSHOPI is more than just a marketplace; it's a community of passionate sellers and discerning buyers.</p>
          </div>
        </div>

        <section className="space-y-6">
          <h2 className="text-2xl font-bold text-slate-900">Why Choose EXSHOPI?</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="flex gap-4">
              <div className="shrink-0 w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center text-emerald-600">
                <ShieldCheck size={20} />
              </div>
              <div>
                <h4 className="font-bold text-slate-900">100% Genuine</h4>
                <p className="text-sm text-slate-500">Every product is verified for authenticity.</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="shrink-0 w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600">
                <Truck size={20} />
              </div>
              <div>
                <h4 className="font-bold text-slate-900">Fast Delivery</h4>
                <p className="text-sm text-slate-500">Same-day delivery available in major UAE cities.</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="shrink-0 w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center text-amber-600">
                <Store size={20} />
              </div>
              <div>
                <h4 className="font-bold text-slate-900">Local Vendors</h4>
                <p className="text-sm text-slate-500">Supporting the UAE's local business ecosystem.</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="shrink-0 w-10 h-10 bg-violet-100 rounded-lg flex items-center justify-center text-violet-600">
                <Package size={20} />
              </div>
              <div>
                <h4 className="font-bold text-slate-900">Easy Returns</h4>
                <p className="text-sm text-slate-500">Hassle-free 15-day return policy.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="space-y-6">
          <h2 className="text-2xl font-bold text-slate-900">Seller Policy</h2>
          <p className="text-slate-600 leading-relaxed">
            We maintain a strict vetting process for all our vendors to ensure the highest quality and authenticity of products. Every seller on EXSHOPI undergoes a thorough verification of their business credentials and product sourcing before they can list on our platform.
          </p>
        </section>

        <section className="p-8 rounded-[2rem] bg-slate-900 text-white text-center space-y-6">
          <h2 className="text-3xl font-black tracking-tight">Ready to start shopping?</h2>
          <p className="text-slate-400 max-w-lg mx-auto">Join thousands of happy customers across the UAE and experience the EXSHOPI difference today.</p>
          <div className="pt-4">
            <Link to="/category/all" className="inline-flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white px-8 py-4 rounded-2xl font-bold transition-all">
              Explore Marketplace
            </Link>
          </div>
        </section>
      </div>
    </LegalPage>
  );
}
