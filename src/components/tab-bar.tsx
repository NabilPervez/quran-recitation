"use client";

import { cn } from "@/lib/utils";
import { BarChart3, Headphones, Settings } from "lucide-react";
import type { FC } from "react";

export type Tab = "listen" | "progress" | "settings";

const TABS: { id: Tab; label: string; Icon: typeof Headphones }[] = [
  { id: "listen", label: "Listen", Icon: Headphones },
  { id: "progress", label: "Progress", Icon: BarChart3 },
  { id: "settings", label: "Settings", Icon: Settings },
];

export const TAB_BAR_H = "4rem";

export const TabBar: FC<{ tab: Tab; onChange: (t: Tab) => void }> = ({ tab, onChange }) => (
  <nav
    aria-label="Main"
    className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 backdrop-blur pb-[env(safe-area-inset-bottom)]"
  >
    <div className="mx-auto grid h-16 max-w-md grid-cols-3">
      {TABS.map(({ id, label, Icon }) => (
        <button
          key={id}
          onClick={() => onChange(id)}
          aria-current={tab === id ? "page" : undefined}
          className={cn(
            "flex flex-col items-center justify-center gap-1 text-xs font-medium transition-colors",
            tab === id ? "text-primary" : "text-muted-foreground hover:text-foreground",
          )}
        >
          <span className={cn("grid h-8 w-14 place-items-center rounded-full transition-colors", tab === id && "bg-accent")}>
            <Icon className="h-5 w-5" strokeWidth={1.75} />
          </span>
          {label}
        </button>
      ))}
    </div>
  </nav>
);

export const PageHeader: FC<{ eyebrow: string; title: string; subtitle?: string; right?: React.ReactNode }> = ({
  eyebrow,
  title,
  subtitle,
  right,
}) => (
  <header className="flex items-start justify-between gap-4">
    <div>
      <p className="eyebrow">{eyebrow}</p>
      <h1 className="mt-2 font-headline text-4xl font-semibold leading-none tracking-tight md:text-5xl">{title}</h1>
      {subtitle && <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>}
    </div>
    {right}
  </header>
);
