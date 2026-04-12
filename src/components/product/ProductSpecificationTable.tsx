import React from 'react';
import type { DetailedSpecificationGroup } from '../../lib/productSpecifications';

type ProductSpecificationTableProps = {
  groups: DetailedSpecificationGroup[];
};

export default function ProductSpecificationTable({ groups }: ProductSpecificationTableProps) {
  if (!groups.length) {
    return (
      <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-6 text-sm font-medium text-slate-600">
        Specifications will appear here once the seller completes the structured product specification section.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {groups.map((group) => (
        <section key={group.key} className="overflow-hidden rounded-[28px] border border-slate-200">
          <div className="bg-slate-950 px-6 py-4">
            <p className="text-[11px] font-black uppercase tracking-[0.22em] text-white/75">{group.title}</p>
          </div>
          {group.items.map((item, index) => (
            <div
              key={`${group.key}-${item.key}-${index}`}
              className={`grid grid-cols-1 gap-2 border-t border-slate-200 px-6 py-4 md:grid-cols-[0.42fr_0.58fr] ${
                index % 2 === 0 ? 'bg-white' : 'bg-slate-50/70'
              }`}
            >
              <p className="text-sm font-bold text-slate-500">{item.label}</p>
              <p className="text-sm font-semibold text-slate-900">{item.value}</p>
            </div>
          ))}
        </section>
      ))}
    </div>
  );
}
