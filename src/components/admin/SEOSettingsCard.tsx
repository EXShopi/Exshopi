import React from "react";
import { Sparkles } from "lucide-react";
import type { ProductSeoFields, SeoPreviewData } from "../../types/seo";
import type { SeoFieldStatus } from "../../types/seo";

type SEOSettingsCardProps = {
  value: ProductSeoFields & { searchTags?: string; sellerNotes?: string };
  onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onGenerateSeo: () => void;
  onGenerateSlug: () => void;
  preview: SeoPreviewData;
  quality: {
    title: SeoFieldStatus;
    description: SeoFieldStatus;
    slug: SeoFieldStatus;
    keywords: SeoFieldStatus;
  };
  slugMessage?: string;
  slugState?: "idle" | "checking" | "available" | "duplicate";
};

const STATUS_STYLES: Record<SeoFieldStatus, string> = {
  good: "bg-emerald-50 text-emerald-700 border-emerald-200",
  short: "bg-amber-50 text-amber-700 border-amber-200",
  long: "bg-rose-50 text-rose-700 border-rose-200",
  invalid: "bg-rose-50 text-rose-700 border-rose-200",
};

const STATUS_LABELS: Record<SeoFieldStatus, string> = {
  good: "Good",
  short: "Needs work",
  long: "Too long",
  invalid: "Invalid",
};

function StatusBadge({ status }: { status: SeoFieldStatus }) {
  return (
    <span
      className={`inline-flex rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] ${STATUS_STYLES[status]}`}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}

export default function SEOSettingsCard({
  value,
  onChange,
  onGenerateSeo,
  onGenerateSlug,
  preview,
  quality,
  slugMessage,
  slugState = "idle",
}: SEOSettingsCardProps) {
  return (
    <div className="space-y-6 rounded-[1.75rem] border border-slate-200 bg-white p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900">SEO Settings</h2>
          <p className="mt-2 text-sm font-medium text-slate-500">
            Manage search metadata, social sharing fields, and the product’s public URL.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={onGenerateSlug}
            className="rounded-2xl border border-slate-200 px-4 py-3 text-xs font-black uppercase tracking-widest text-slate-700 transition hover:border-violet-300 hover:text-violet-700"
          >
            Generate Slug
          </button>
          <button
            type="button"
            onClick={onGenerateSeo}
            className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-xs font-black uppercase tracking-widest text-white transition hover:bg-violet-600"
          >
            <Sparkles size={14} />
            Generate SEO Automatically
          </button>
        </div>
      </div>

      <div className="space-y-5">
        <div>
          <label className="mb-2 block text-sm font-bold text-slate-700">SEO Slug</label>
          <input
            type="text"
            name="slug"
            value={value.slug || ""}
            onChange={onChange}
            placeholder="seo-friendly-product-slug"
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
          />
          <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
            <StatusBadge status={quality.slug} />
            <span
              className={`text-[11px] font-black uppercase tracking-[0.18em] ${
                slugState === "duplicate"
                  ? "text-rose-600"
                  : slugState === "available"
                  ? "text-emerald-600"
                  : "text-slate-400"
              }`}
            >
              {slugMessage || preview.url}
            </span>
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm font-bold text-slate-700">SEO Title</label>
          <input
            type="text"
            name="metaTitle"
            value={value.metaTitle || ""}
            onChange={onChange}
            placeholder="Premium product title for Google search results"
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
          />
          <div className="mt-2 flex items-center justify-between">
            <StatusBadge status={quality.title} />
            <span className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">
              {(value.metaTitle || preview.title).trim().length}/60
            </span>
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm font-bold text-slate-700">SEO Description</label>
          <textarea
            name="metaDescription"
            value={value.metaDescription || ""}
            onChange={onChange}
            rows={5}
            placeholder="Write a clear description that explains the product and encourages clicks."
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
          />
          <div className="mt-2 flex items-center justify-between">
            <StatusBadge status={quality.description} />
            <span className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">
              {(value.metaDescription || preview.description).trim().length}/160
            </span>
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm font-bold text-slate-700">SEO Keywords</label>
          <input
            type="text"
            name="metaKeywords"
            value={value.metaKeywords || ""}
            onChange={onChange}
            placeholder="refurbished laptops UAE, used MacBook Dubai, cheap iPhone UAE"
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
          />
          <div className="mt-2 flex items-center justify-between">
            <StatusBadge status={quality.keywords} />
            <span className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">
              Comma separated keywords
            </span>
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm font-bold text-slate-700">Canonical URL</label>
          <input
            type="text"
            name="canonicalUrl"
            value={value.canonicalUrl || ""}
            onChange={onChange}
            placeholder={preview.url}
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
          />
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-bold text-slate-700">OG Title</label>
            <input
              type="text"
              name="ogTitle"
              value={value.ogTitle || ""}
              onChange={onChange}
              placeholder="Social share title"
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-bold text-slate-700">OG Image</label>
            <input
              type="text"
              name="ogImage"
              value={value.ogImage || ""}
              onChange={onChange}
              placeholder="https://..."
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
            />
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm font-bold text-slate-700">OG Description</label>
          <textarea
            name="ogDescription"
            value={value.ogDescription || ""}
            onChange={onChange}
            rows={4}
            placeholder="Social share description"
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-bold text-slate-700">Search Tags</label>
          <input
            type="text"
            name="searchTags"
            value={value.searchTags || ""}
            onChange={onChange}
            placeholder="laptop, refurbished, apple, dubai"
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-bold text-slate-700">Seller Notes</label>
          <textarea
            name="sellerNotes"
            value={value.sellerNotes || ""}
            onChange={onChange}
            rows={5}
            placeholder="Internal notes for admin review"
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
          />
        </div>
      </div>

      <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5">
        <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">Google Preview</p>
        <div className="mt-4 space-y-1">
          <p className="text-lg font-medium leading-6 text-[#1a0dab]">{preview.title}</p>
          <p className="text-sm font-medium text-emerald-700">{preview.url}</p>
          <p className="text-sm leading-6 text-slate-600">{preview.description}</p>
        </div>
      </div>
    </div>
  );
}
