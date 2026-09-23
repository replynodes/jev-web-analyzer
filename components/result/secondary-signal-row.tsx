import type { AnalysisResponse } from "@/lib/contracts";
import { SECONDARY_SIGNAL_NAMES } from "@/lib/signal-map";
import { ProvenanceTag } from "./provenance-tag";
import { SignalCard } from "./signal-card";

const LABELS: Record<string, string> = {
  audience: "Audience",
  strongest_reason_to_choose: "Reason to choose",
  self_serve_motion: "Self-serve motion",
};

export function SecondarySignalRow({ classifications }: { classifications: AnalysisResponse["classifications"] }) {
  const slots = SECONDARY_SIGNAL_NAMES.flatMap((name) => {
    const classification = classifications.find((item) => item.name === name);
    return classification ? [{ name, classification }] : [];
  });
  if (!slots.length) return null;
  return (
    <div className="grid gap-3 md:grid-cols-3">
      {slots.map((slot) => (
        <SignalCard key={slot.name} classification={slot.classification} label={LABELS[slot.name]} />
      ))}
    </div>
  );
}

export function SecondarySignalHeading() {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h2 className="text-lg font-semibold">Supporting signals</h2>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          Audience, Reason to choose and Motion are informational: no good/bad valence is attached to them.
        </p>
      </div>
      <ProvenanceTag kind="jev" />
    </div>
  );
}
