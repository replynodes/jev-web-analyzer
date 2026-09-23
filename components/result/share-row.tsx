"use client";

import { useState } from "react";
import { Check, Copy, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { trackResultShared } from "@/lib/analytics";
import { ProvenanceTag } from "./provenance-tag";

export function ShareRow({ url, shareText }: { url: string; shareText: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard?.writeText(url);
    setCopied(true);
    trackResultShared(url);
    window.setTimeout(() => setCopied(false), 1500);
  }

  async function share() {
    if (navigator.share) {
      try {
        await navigator.share({ title: "Jev result", text: shareText, url });
        trackResultShared(url);
      } catch {
        /* user dismissed the share sheet */
      }
      return;
    }
    await copy();
  }

  return (
    <div className="flex flex-col justify-between gap-3 border-t pt-6 sm:flex-row sm:items-center">
      <div>
        <h2 className="text-base font-semibold">Share this result</h2>
        <p className="mt-1 text-sm text-muted-foreground">Homepage only · the response trace is in Run details.</p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <ProvenanceTag kind="ui" />
        <Button type="button" variant="outline" size="sm" onClick={() => void copy()}>
          {copied ? <Check /> : <Copy />}
          {copied ? "Copied" : "Copy result link"}
        </Button>
        <Button type="button" size="sm" onClick={() => void share()}>
          <Share2 /> Share
        </Button>
      </div>
    </div>
  );
}
