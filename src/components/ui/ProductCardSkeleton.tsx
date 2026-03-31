import React from "react";
import { Skeleton } from "./Skeleton";

export default function ProductCardSkeleton() {
  return (
    <div className="flex h-full flex-col overflow-hidden rounded-[28px] border border-slate-200/80 bg-white p-3 shadow-[0_8px_24px_rgba(15,23,42,0.05)]">
      <Skeleton className="h-56 rounded-[22px]" />
      <div className="flex flex-1 flex-col px-1 pb-1 pt-4">
        <Skeleton className="mb-3 h-3 w-20 rounded-full" />
        <Skeleton className="mb-2 h-5 w-full" />
        <Skeleton className="mb-4 h-5 w-4/5" />
        <Skeleton className="mb-4 h-4 w-28" />
        <Skeleton className="mb-4 h-10 w-32" />
        <Skeleton className="mb-4 h-16 w-full rounded-2xl" />
        <Skeleton className="mt-auto h-12 w-full rounded-2xl" />
      </div>
    </div>
  );
}

