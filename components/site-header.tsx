import { ThemeToggle } from "@/components/theme-toggle";

export function SiteHeader({ crumb }: { crumb: string }) {
  return (
    <header className="mx-auto flex max-w-5xl items-center justify-between">
      <div className="flex min-w-0 items-center gap-2">
        <a href="https://replynodes.com/" target="_blank" rel="noreferrer" aria-label="ReplyNodes home" className="flex shrink-0 items-center gap-1.5">
          <svg width="20" height="20" viewBox="0 0 40 40" fill="none" aria-hidden="true">
            <rect width="40" height="40" rx="10" fill="#A2D98A" />
            <line x1="20" y1="20" x2="11" y2="11" stroke="#223835" strokeWidth="1.6" strokeLinecap="round" />
            <line x1="20" y1="20" x2="29" y2="11" stroke="#223835" strokeWidth="1.6" strokeLinecap="round" />
            <line x1="20" y1="20" x2="11" y2="29" stroke="#223835" strokeWidth="1.6" strokeLinecap="round" />
            <line x1="20" y1="20" x2="29" y2="29" stroke="#223835" strokeWidth="1.6" strokeLinecap="round" />
            <circle cx="11" cy="11" r="3" fill="#223835" />
            <circle cx="29" cy="11" r="3" fill="#223835" />
            <circle cx="11" cy="29" r="3" fill="#223835" />
            <circle cx="29" cy="29" r="3" fill="#223835" />
            <circle cx="20" cy="20" r="5.5" fill="#223835" />
            <circle cx="20" cy="20" r="3" fill="#A2D98A" />
          </svg>
          <span className="text-sm font-semibold tracking-tight text-foreground">ReplyNodes</span>
        </a>
        <span className="text-muted-foreground">/</span>
        <span className="truncate text-sm text-muted-foreground">{crumb}</span>
      </div>
      <ThemeToggle />
    </header>
  );
}
