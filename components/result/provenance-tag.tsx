import { cn } from "@/lib/utils";

export type Provenance = "jev" | "homepage" | "run" | "ui";

const LABELS: Record<Provenance, string> = {
  jev: "JEV",
  homepage: "FROM YOUR HOMEPAGE",
  run: "RUN",
  ui: "UI",
};

const STYLES: Record<Provenance, string> = {
  jev: "border-[#c9bff2] bg-[#eeebfb] text-[#5b4bc4] dark:border-[#4b3f8f] dark:bg-[#2a2450] dark:text-[#b3a5ff]",
  homepage: "border-[#a9dcd2] bg-[#e3f3ef] text-[#0f766e] dark:border-[#1f5a51] dark:bg-[#10322d] dark:text-[#6fe3d3]",
  run: "border-[#c8d4e2] bg-[#eef2f7] text-[#475569] dark:border-[#33465c] dark:bg-[#1c2733] dark:text-[#c7d2e0]",
  ui: "border-[#dcdad2] bg-[#f0efe9] text-[#6a6f76] dark:border-[#33403a] dark:bg-[#1e2522] dark:text-[#9aa5a0]",
};

export function ProvenanceTag({ kind, className }: { kind: Provenance; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center whitespace-nowrap rounded-md border px-2 py-0.5 text-[10px] font-extrabold uppercase leading-none tracking-[0.1em]",
        STYLES[kind],
        className,
      )}
    >
      {LABELS[kind]}
    </span>
  );
}
