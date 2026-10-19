"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { setLocale } from "@/lib/i18n/actions";
import type { Locale } from "@/lib/i18n/config";
import { useI18n } from "@/lib/i18n/provider";

// Manual ES/EN switch. Language names are shown as short codes with the
// full name (in its own language) as the accessible name. The active
// language is marked by fill + weight + aria-pressed, never color alone.
export default function LanguageSwitcher({ className = "" }: { className?: string }) {
  const { locale, messages } = useI18n();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const OPTIONS: { value: Locale; code: string; name: string }[] = [
    { value: "es", code: "ES", name: messages.language.spanish },
    { value: "en", code: "EN", name: messages.language.english },
  ];

  function choose(next: Locale) {
    if (next === locale) return;
    startTransition(async () => {
      await setLocale(next);
      router.refresh();
    });
  }

  return (
    <div
      role="group"
      aria-label={messages.language.label}
      className={`inline-flex items-center gap-0.5 ${className}`}
    >
      {OPTIONS.map(({ value, code, name }) => {
        const active = value === locale;
        return (
          <button
            key={value}
            type="button"
            lang={value}
            aria-label={name}
            aria-pressed={active}
            disabled={isPending}
            onClick={() => choose(value)}
            className={`inline-flex min-h-10 min-w-10 items-center justify-center rounded-md px-2 text-xs transition-colors disabled:opacity-60 lg:min-h-8 lg:min-w-9 ${
              active
                ? "bg-ink/10 font-semibold text-ink"
                : "text-muted hover:text-ink-soft"
            }`}
          >
            {code}
          </button>
        );
      })}
    </div>
  );
}
