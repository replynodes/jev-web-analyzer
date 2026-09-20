import type { Metadata } from "next";
import { ResultPage } from "@/components/result-page";

export const metadata: Metadata = {
  title: "Result · Jev Web Analyzer · ReplyNodes",
  description: "What Jev thinks about your SaaS: a founder teardown scorecard built with ReplyNodes and Jev via Vercel AI Gateway.",
};

export default function Page() {
  return <ResultPage />;
}
