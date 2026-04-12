import React from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import SEOHead from "../components/seo/SEOHead";
import { getBlogPostBySlug } from "../lib/blog";

export default function BlogPost() {
  const { slug } = useParams<{ slug: string }>();
  const post = getBlogPostBySlug(slug);

  if (!post) {
    return <Navigate to="/blog" replace />;
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 md:px-6">
      <SEOHead
        title={`${post.title} | ExShopi Blog`}
        description={post.metaDescription}
        keywords={post.keywords.join(", ")}
        pathname={`/blog/${post.slug}`}
        type="article"
      />

      <article className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-xs font-black uppercase tracking-[0.22em] text-slate-400">{post.category}</p>
        <h1 className="mt-3 text-4xl font-black text-slate-950">{post.title}</h1>
        <p className="mt-3 text-sm font-semibold text-slate-500">Published {post.publishedAt}</p>

        <div className="mt-6 space-y-5">
          {post.content.map((paragraph) => (
            <p key={paragraph.slice(0, 32)} className="text-base leading-8 text-slate-700">
              {paragraph}
            </p>
          ))}
        </div>

        <div className="mt-8 rounded-[24px] border border-blue-100 bg-blue-50 p-6">
          <p className="text-sm font-black uppercase tracking-[0.18em] text-blue-700">Internal Links</p>
          <div className="mt-4 flex flex-wrap gap-3">
            {post.relatedLinks.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                className="rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-slate-800 shadow-sm transition hover:text-blue-600"
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </article>
    </div>
  );
}
