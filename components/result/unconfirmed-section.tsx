import type { AnalysisResponse } from "@/lib/contracts";
import { unconfirmedItems } from "@/lib/unconfirmed";
import { ProvenanceTag } from "./provenance-tag";

export function UnconfirmedSection({ classifications }: { classifications: AnalysisResponse["classifications"] }) {
  const items = unconfirmedItems(classifications);
  return (
    <section className="rounded-xl border bg-card p-5 shadow-sm">
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="text-lg font-semibold">What Jev couldn&apos;t confirm</h2>
        <ProvenanceTag kind="jev" />
      </div>
      <p className="mt-1 text-sm text-muted-foreground">
        Derived only from Jev&apos;s own negative enum values. No categories are invented.
      </p>
      <ul className="mt-3 list-disc space-y-1.5 pl-5">
        {items.length ? (
          items.map((item) => (
            <li key={item.name} className="text-sm">
              <b>{item.label}</b> — {item.message}
            </li>
          ))
        ) : (
          <li className="list-none text-sm italic text-muted-foreground">
            Jev returned no negative enum values for this homepage.
          </li>
        )}
      </ul>
    </section>
  );
}
