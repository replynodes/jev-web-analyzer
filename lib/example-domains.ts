export const EXAMPLE_DOMAINS = ["stripe.com", "linear.app", "vercel.com", "notion.so", "github.com"] as const;

export function exampleDomainUrl(domain: string) {
  return `https://${domain}`;
}
