import React from "react";
import { Link } from "react-router-dom";
import SEOHead from "../components/seo/SEOHead";
import { BLOG_POSTS } from "../lib/blog";

export default function BlogIndex() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10 md:px-6">
      <SEOHead
        title="ExShopi Blog | UAE Buying Guides, Reviews & Shopping Tips"
        description="Read ExShopi blog posts covering refurbished laptops UAE, used MacBook Dubai shopping tips, mobile buying guides, and premium marketplace advice."
        keywords="ExShopi blog, refurbished laptops UAE, used MacBook Dubai, electronics buying guide UAE"
        pathname="/blog"
        type="website"
      />

      <div className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-xs font-black uppercase tracking-[0.22em] text-slate-400">SEO Traffic Engine</p>
        <h1 className="mt-3 text-4xl font-black text-slate-950">ExShopi Blog</h1>
        <p className="mt-4 max-w-3xl text-base leading-7 text-slate-600">
          Buying guides, comparison articles, and UAE-focused marketplace content designed to attract organic traffic and help shoppers convert with confidence.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link to="/" className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-800 transition hover:text-blue-600">
            Homepage
          </Link>
          <Link to="/category/electronics/laptops" className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-800 transition hover:text-blue-600">
            Laptop category
          </Link>
          <Link to="/refurbished-laptops-uae" className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-800 transition hover:text-blue-600">
            Refurbished Laptops UAE
          </Link>
        </div>
      </div>

      <div className="mt-8 grid gap-6 md:grid-cols-2">
        {BLOG_POSTS.map((post) => (
          <article key={post.slug} className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">{post.category}</p>
            <h2 className="mt-3 text-2xl font-black text-slate-900">{post.title}</h2>
            <p className="mt-3 text-sm leading-7 text-slate-600">{post.excerpt}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {post.keywords.map((keyword) => (
                <span key={keyword} className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600">
                  {keyword}
                </span>
              ))}
            </div>
            <Link
              to={`/blog/${post.slug}`}
              className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-600"
            >
              Read Article
            </Link>
          </article>
        ))}
      </div>
    </div>
  );
}
