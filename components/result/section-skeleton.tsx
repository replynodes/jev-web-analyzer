import { cn } from "@/lib/utils";

export function SectionSkeleton({ className, lines = 3 }: { className?: string; lines?: number }) {
  return (
    <div className={cn("rounded-xl border bg-card p-4", className)} aria-hidden="true">
      <div className="h-4 w-1/3 animate-pulse rounded bg-muted" />
      <div className="mt-4 space-y-2.5">
        {Array.from({ length: lines }).map((_, index) => (
          <div
            key={index}
            className="h-3 animate-pulse rounded bg-muted"
            style={{ width: `${Math.max(35, 92 - index * 14)}%` }}
          />
        ))}
      </div>
    </div>
  );
}
