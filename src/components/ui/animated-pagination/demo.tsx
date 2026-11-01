"use client";

import { useState } from "react";
import { AnimatedPagination } from "@/components/ui/animated-pagination/animated-pagination";

export function Default() {
  const [page, setPage] = useState(5);
  return (
    <div className="flex flex-col items-center gap-3">
      <AnimatedPagination totalPages={20} page={page} onPageChange={setPage} />
      <p className="text-[13px] text-muted-foreground tabular-nums">Page {page} of 20</p>
    </div>
  );
}

const ROWS = Array.from({ length: 23 }, (_, i) => `Invoice #${(1042 + i).toString()}`);

export function WithTable() {
  const [page, setPage] = useState(1);
  const perPage = 4;
  const pages = Math.ceil(ROWS.length / perPage);
  return (
    <div className="w-full max-w-sm space-y-3">
      <ul className="divide-y divide-border rounded-lg border border-border bg-background text-sm">
        {ROWS.slice((page - 1) * perPage, page * perPage).map((row) => (
          <li key={row} className="flex h-10 items-center justify-between px-3">
            <span className="text-foreground">{row}</span>
            <span className="text-muted-foreground tabular-nums">$240.00</span>
          </li>
        ))}
      </ul>
      <div className="flex justify-center">
        <AnimatedPagination totalPages={pages} page={page} onPageChange={setPage} siblingCount={0} />
      </div>
    </div>
  );
}

export function FewPages() {
  return <AnimatedPagination totalPages={5} defaultPage={2} />;
}
