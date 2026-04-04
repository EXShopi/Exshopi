import React, { useEffect, useMemo, useState, useRef } from 'react';
import type { LiveCategory } from '../types/category';

type Props = {
  categories: LiveCategory[];
  parentId?: string | null;
  subSlug?: string | null;
  onChange: (parentId: string | null, subSlug?: string | null) => void;
  popularSlugs?: string[]; // optional list of popular category slugs
  suggestedParentId?: string | null;
  suggestedSubcategorySlug?: string | null;
  className?: string;
};

const RECENT_KEY = 'exshopi.recent.categories.v1';

function shortIconFor(name: string) {
  // simple circular initial as icon (avoid external icon dependencies)
  const initials = name
    .split(/\s+/)
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
  return initials;
}

const CategorySelector: React.FC<Props> = (props) => {
  const { categories = [], parentId, subSlug, onChange, popularSlugs, suggestedParentId, suggestedSubcategorySlug, className } = props;

  const [query, setQuery] = useState('');
  const [activeParent, setActiveParent] = useState<string | null>(parentId || null);
  const [activeSub, setActiveSub] = useState<string | null>(subSlug || null);
  const [recent, setRecent] = useState<Array<{ parentId: string; subSlug?: string; label: string }>>([]);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const parentButtonsRef = useRef<Array<HTMLButtonElement | null>>([]);
  const subButtonsRef = useRef<Array<HTMLButtonElement | null>>([]);

  useEffect(() => setActiveParent(parentId || null), [parentId]);
  useEffect(() => setActiveSub(subSlug || null), [subSlug]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(RECENT_KEY);
      if (raw) setRecent(JSON.parse(raw));
    } catch (e) {
      setRecent([]);
    }
  }, []);

  const saveRecent = (entry: { parentId: string; subSlug?: string; label: string }) => {
    try {
      const copy = [...recent.filter((r) => !(r.parentId === entry.parentId && r.subSlug === entry.subSlug))];
      copy.unshift(entry);
      const limited = copy.slice(0, 8);
      localStorage.setItem(RECENT_KEY, JSON.stringify(limited));
      setRecent(limited);
    } catch (e) {
      // ignore
    }
  };

  const popular = useMemo(() => {
    const defaults = ['electronics', 'fashion', 'home-kitchen'];
    const slugs = popularSlugs && popularSlugs.length ? popularSlugs : defaults;
    return slugs
      .map((s) => categories.find((c) => c.slug === s))
      .filter(Boolean) as LiveCategory[];
  }, [categories, popularSlugs]);

  const filteredParents = useMemo(() => {
    const q = String(query || '').trim().toLowerCase();
    if (!q) return categories;
    return categories.filter((c) => {
      if (c.name.toLowerCase().includes(q)) return true;
      if (c.slug.toLowerCase().includes(q)) return true;
      if (Array.isArray(c.subcategories) && c.subcategories.some((s) => s.name.toLowerCase().includes(q) || s.slug.toLowerCase().includes(q))) return true;
      return false;
    });
  }, [categories, query]);

  const chooseCategory = (parent: LiveCategory, sub?: { name: string; slug: string } | null) => {
    const pId = String(parent.id);
    const sSlug = sub ? String(sub.slug) : null;
    setActiveParent(pId);
    setActiveSub(sSlug);
    onChange(pId, sSlug || undefined);
    saveRecent({ parentId: pId, subSlug: sSlug || undefined, label: `${parent.name}${sSlug ? ` › ${sSlug}` : ''}` });
  };

  const acceptSuggestion = () => {
    if (!suggestedParentId) return;
    const parent = categories.find((c) => c.id === suggestedParentId || c.slug === suggestedParentId);
    if (!parent) return;
    const sub = suggestedSubcategorySlug ? parent.subcategories?.find((s) => s.slug === suggestedSubcategorySlug) : undefined;
    chooseCategory(parent, sub || null);
  };

  // Improved keyboard navigation: handle arrow keys, enter and escape
  useEffect(() => {
    // clear parent button refs when parents change
    parentButtonsRef.current = [];
  }, [filteredParents]);

  useEffect(() => {
    // clear sub refs when active parent changes
    subButtonsRef.current = [];
  }, [activeParent]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    const activeEl = document.activeElement as HTMLElement | null;
    const parentBtns = parentButtonsRef.current.filter(Boolean) as HTMLButtonElement[];
    const subBtns = subButtonsRef.current.filter(Boolean) as HTMLButtonElement[];

    if (e.key === 'Escape') {
      setActiveParent(null);
      setActiveSub(null);
      const input = containerRef.current?.querySelector('input[aria-label="Search categories"]') as HTMLInputElement | null;
      input?.focus();
      e.preventDefault();
      return;
    }

    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      // If focus is inside sub-list, navigate sub-list
      if (subBtns.length && subBtns.some((b) => b === activeEl)) {
        const idx = subBtns.indexOf(activeEl as HTMLButtonElement);
        let next = idx === -1 ? 0 : e.key === 'ArrowDown' ? idx + 1 : idx - 1;
        if (next < 0) next = subBtns.length - 1;
        if (next >= subBtns.length) next = 0;
        subBtns[next].focus();
        e.preventDefault();
        return;
      }

      // Otherwise navigate parent list
      if (parentBtns.length) {
        const idx = parentBtns.indexOf(activeEl as HTMLButtonElement);
        let next = idx === -1 ? 0 : e.key === 'ArrowDown' ? idx + 1 : idx - 1;
        if (next < 0) next = parentBtns.length - 1;
        if (next >= parentBtns.length) next = 0;
        parentBtns[next].focus();
        e.preventDefault();
        return;
      }
    }

    if (e.key === 'Enter') {
      if (activeEl instanceof HTMLButtonElement) {
        activeEl.click();
        e.preventDefault();
      }
    }
  };

  // keyboard navigation minimal: up/down handles left column only when focused
  return (
    <div ref={containerRef} onKeyDown={handleKeyDown} tabIndex={0} className={`${className || ''} bg-white rounded-2xl border border-slate-100 shadow-sm p-4`}>
      <div className="flex items-center gap-3">
        <input
          aria-label="Search categories"
          placeholder="Search categories..."
          className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-blue-100"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <div className="text-sm text-slate-500">{activeParent ? (
          <div className="text-sm text-slate-700">Selected: <strong className="text-slate-900">{(categories.find(c=>c.id===activeParent)?.name) || ''}{activeSub ? ` › ${activeSub}` : ''}</strong></div>
        ) : (<span className="text-slate-400">No category selected</span>)}</div>
      </div>

      <div className="mt-3 flex flex-col gap-3 md:flex-row md:items-start">
        <div className="md:w-1/3">
          <div className="mb-2 flex flex-wrap gap-2">
            {recent.length > 0 && (
              <div className="flex flex-wrap gap-2">
                <span className="text-xs font-semibold text-slate-500 w-full">Recent</span>
                {recent.map((r) => (
                  <button
                    key={`${r.parentId}::${r.subSlug || ''}`}
                    type="button"
                    onClick={() => {
                      const p = categories.find((c) => c.id === r.parentId);
                      if (!p) return;
                      const s = r.subSlug ? p.subcategories?.find((x) => x.slug === r.subSlug) : undefined;
                      chooseCategory(p, s || null);
                    }}
                    className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-700 hover:bg-slate-200"
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="mb-3 flex flex-wrap gap-2">
            <span className="text-xs font-semibold text-slate-500 w-full">Popular</span>
            {popular.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => chooseCategory(p, p.subcategories && p.subcategories.length ? p.subcategories[0] : null)}
                className={`flex items-center gap-2 rounded-full px-3 py-1 text-xs ${activeParent === p.id ? 'bg-blue-50 text-blue-700' : 'bg-slate-100 text-slate-700'} hover:bg-slate-200`}
              >
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-slate-200 text-xs font-bold text-slate-700">{shortIconFor(p.name)}</span>
                <span>{p.name}</span>
              </button>
            ))}
          </div>

          <div className="rounded-lg border border-slate-100 overflow-auto h-56 md:h-64 parent-list" role="listbox" aria-label="Parent categories">
            {filteredParents.length === 0 ? (
              <div className="p-4 text-sm text-slate-500">No categories match “{query}”</div>
            ) : (
              <ul className="divide-y divide-slate-100">
                {filteredParents.map((cat, idx) => (
                  <li key={cat.id}>
                    <button
                      ref={(el) => (parentButtonsRef.current[idx] = el)}
                      type="button"
                      role="option"
                      aria-selected={activeParent === String(cat.id)}
                      onClick={() => setActiveParent(String(cat.id))}
                      className={`w-full flex items-center gap-3 px-3 py-3 text-left hover:bg-slate-50 ${activeParent === String(cat.id) ? 'bg-blue-50' : ''}`}
                    >
                      <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-sm font-semibold text-slate-700">{shortIconFor(cat.name)}</span>
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-slate-900">{cat.name}</div>
                        <div className="text-xs text-slate-400">{Array.isArray(cat.subcategories) ? `${cat.subcategories.length} subcategories` : 'No subcategories'}</div>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="md:w-1/3">
          <div className="text-xs font-semibold text-slate-500 mb-2">Subcategories</div>
          <div className="rounded-lg border border-slate-100 overflow-auto h-56 md:h-64 sub-list" role="listbox" aria-label="Subcategories">
            {activeParent ? (
              (() => {
                const parent = categories.find((c) => String(c.id) === String(activeParent));
                if (!parent) return <div className="p-4 text-sm text-slate-500">Category not found.</div>;
                if (!parent.subcategories || parent.subcategories.length === 0) return (
                  <div className="p-4 text-sm text-slate-500">No subcategories. Select the category to use it.</div>
                );
                return (
                  <ul className="divide-y divide-slate-100">
                    {parent.subcategories.map((sub, sidx) => (
                      <li key={sub.slug}>
                        <button
                          ref={(el) => (subButtonsRef.current[sidx] = el)}
                          type="button"
                          role="option"
                          aria-selected={activeSub === sub.slug && String(activeParent) === String(parent.id)}
                          onClick={() => chooseCategory(parent, sub)}
                          className={`w-full flex items-center gap-3 px-3 py-3 text-left hover:bg-slate-50 ${activeSub === sub.slug && activeParent === parent.id ? 'bg-blue-50' : ''}`}
                        >
                          <div className="min-w-0">
                            <div className="text-sm font-semibold text-slate-900">{sub.name}</div>
                            <div className="text-xs text-slate-400">{sub.slug}</div>
                          </div>
                          <div className="ml-auto text-xs text-slate-400">Select</div>
                        </button>
                      </li>
                    ))}
                  </ul>
                );
              })()
            ) : (
              <div className="p-4 text-sm text-slate-500">Choose a parent category to view subcategories.</div>
            )}
          </div>
        </div>

        <div className="md:w-1/3">
          <div className="text-xs font-semibold text-slate-500 mb-2">Preview & Details</div>
          <div className="rounded-lg border border-slate-100 p-4 h-56 md:h-64 overflow-auto">
            {activeParent ? (
              (() => {
                const parent = categories.find((c) => String(c.id) === String(activeParent));
                if (!parent) return <div className="text-sm text-slate-500">Category not found.</div>;
                const chosenSub = parent.subcategories?.find((s) => s.slug === activeSub) || null;
                return (
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-sm font-bold text-slate-700">{shortIconFor(parent.name)}</div>
                      <div>
                        <div className="text-sm font-black text-slate-900">{parent.name}{chosenSub ? ` › ${chosenSub.name}` : ''}</div>
                        <div className="text-xs text-slate-400">{parent.slug}{chosenSub ? ` • ${chosenSub.slug}` : ''}</div>
                      </div>
                    </div>
                    <div className="text-sm text-slate-600">Use this selection to surface the correct specification template and listing lane. Selecting a subcategory sets the final display category.</div>
                    <div className="mt-3 flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          const p = parent;
                          chooseCategory(p, chosenSub);
                        }}
                        className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                      >
                        Confirm
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          onChange(null, undefined);
                          setActiveParent(null);
                          setActiveSub(null);
                        }}
                        className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                      >
                        Clear
                      </button>
                    </div>
                    {suggestedParentId && (
                      <div className="mt-2 text-xs text-slate-500">
                        Suggested: <strong className="text-slate-900">{categories.find(c => c.id === suggestedParentId)?.name || ''}{suggestedSubcategorySlug ? ` › ${suggestedSubcategorySlug}` : ''}</strong>
                        <button type="button" onClick={acceptSuggestion} className="ml-3 text-sm text-blue-600">Apply</button>
                      </div>
                    )}
                  </div>
                );
              })()
            ) : (
              <div className="text-sm text-slate-500">No category selected. Use the left panels to pick a category.</div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-3">
        <div className="text-xs text-slate-500">Tip: Use the search for fast results, or pick from Popular / Recent.</div>
      </div>
    </div>
  );
};

export default CategorySelector;
