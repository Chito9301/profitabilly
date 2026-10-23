"use client";

import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import Button from "@/components/Button";
import { useI18n } from "@/lib/i18n/provider";

type ExportFormat = "xlsx" | "pdf";

// Same-origin endpoints, no parameters: the server builds each report only
// from the authenticated session (see app/dashboard/export/projects/route.ts
// for Excel and app/dashboard/export/projects/pdf/route.ts for PDF).
const FORMATS: Record<
  ExportFormat,
  { url: string; mimeHint: string; extension: string; fallbackName: string }
> = {
  xlsx: {
    url: "/dashboard/export/projects",
    mimeHint: "spreadsheetml",
    extension: "xlsx",
    fallbackName: "JobWorth-Projects.xlsx",
  },
  pdf: {
    url: "/dashboard/export/projects/pdf",
    mimeHint: "application/pdf",
    extension: "pdf",
    fallbackName: "JobWorth-Projects.pdf",
  },
};

// Reads filename="..." from a Content-Disposition header; the server only
// sends ASCII [A-Za-z0-9_-] names. Anything unexpected falls back to a
// fixed name, and the browser never gets a path.
function fileNameFrom(disposition: string | null, format: ExportFormat): string {
  const { extension, fallbackName } = FORMATS[format];
  const match = disposition
    ? new RegExp(`filename="([A-Za-z0-9_.-]+\\.${extension})"`).exec(disposition)
    : null;
  return match ? match[1] : fallbackName;
}

// Single "Export" menu button with two options: Excel (.xlsx) and PDF
// (.pdf). Keyboard: Enter/Space/click/ArrowDown open it and focus the first
// option; ArrowUp/ArrowDown/Home/End move between options; Escape closes it
// and returns focus to the button; Tab closes it; a click outside closes
// it; choosing an option closes it. While a format is downloading its
// option is inert (no duplicate request for the same format) and the button
// shows the loading text; any failure (network, 401/500, or a response that
// is not the expected file type — e.g. the login page after an expired
// session) shows a translated message and nothing is downloaded.
export default function ExportMenu() {
  const { messages } = useI18n();
  const x = messages.exportProjects;

  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState<Record<ExportFormat, boolean>>({
    xlsx: false,
    pdf: false,
  });
  const [failed, setFailed] = useState(false);

  // The ref blocks a second request for the same format synchronously
  // (state updates are asynchronous); the state drives the UI.
  const pendingRef = useRef<Record<ExportFormat, boolean>>({ xlsx: false, pdf: false });
  const wrapperRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const menuId = useId();
  const triggerId = useId();

  const anyPending = pending.xlsx || pending.pdf;
  const options: Array<{ format: ExportFormat; label: string }> = [
    { format: "xlsx", label: x.optionExcel },
    { format: "pdf", label: x.optionPdf },
  ];

  function focusTrigger() {
    wrapperRef.current
      ?.querySelector<HTMLButtonElement>("[data-export-trigger]")
      ?.focus();
  }

  function closeMenu(restoreFocus: boolean) {
    setOpen(false);
    if (restoreFocus) focusTrigger();
  }

  // Click/tap outside the menu closes it.
  useEffect(() => {
    if (!open) return;
    function handlePointerDown(event: PointerEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [open]);

  // Opening the menu moves focus to its first option.
  useEffect(() => {
    if (open) itemRefs.current[0]?.focus();
  }, [open]);

  function setFormatPending(format: ExportFormat, value: boolean) {
    pendingRef.current = { ...pendingRef.current, [format]: value };
    setPending(pendingRef.current);
  }

  async function runExport(format: ExportFormat) {
    closeMenu(true);
    if (pendingRef.current[format]) return;

    setFormatPending(format, true);
    setFailed(false);
    try {
      const { url: endpoint, mimeHint } = FORMATS[format];
      const response = await fetch(endpoint, {
        method: "GET",
        credentials: "same-origin",
        cache: "no-store",
      });
      const contentType = response.headers.get("Content-Type") ?? "";
      if (!response.ok || response.redirected || !contentType.includes(mimeHint)) {
        throw new Error("export failed");
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = fileNameFrom(response.headers.get("Content-Disposition"), format);
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch {
      setFailed(true);
    } finally {
      setFormatPending(format, false);
    }
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const target = event.target as HTMLElement;

    if (!open) {
      if (event.key === "ArrowDown" && target.closest("[data-export-trigger]")) {
        event.preventDefault();
        setOpen(true);
      }
      return;
    }

    if (event.key === "Escape") {
      event.preventDefault();
      closeMenu(true);
      return;
    }

    const items = itemRefs.current.filter(
      (item): item is HTMLButtonElement => item !== null,
    );
    const index = items.indexOf(document.activeElement as HTMLButtonElement);
    if (index < 0) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      items[(index + 1) % items.length].focus();
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      items[(index - 1 + items.length) % items.length].focus();
    } else if (event.key === "Home") {
      event.preventDefault();
      items[0].focus();
    } else if (event.key === "End") {
      event.preventDefault();
      items[items.length - 1].focus();
    } else if (event.key === "Tab") {
      // Close and keep focus on the button; the next Tab moves on.
      event.preventDefault();
      closeMenu(true);
    }
  }

  return (
    <div
      ref={wrapperRef}
      onKeyDown={handleKeyDown}
      className="flex flex-col items-start gap-1 sm:items-end"
    >
      <div className="relative">
        <Button
          id={triggerId}
          type="button"
          variant="secondary"
          data-export-trigger="true"
          aria-haspopup="menu"
          aria-expanded={open}
          aria-controls={open ? menuId : undefined}
          aria-busy={anyPending}
          onClick={() => setOpen((current) => !current)}
        >
          {anyPending ? x.exporting : x.menuLabel}
          <svg
            aria-hidden="true"
            viewBox="0 0 20 20"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            className="ml-2 h-4 w-4 shrink-0"
          >
            <path d="M5 7.5l5 5 5-5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Button>

        {open && (
          <div
            id={menuId}
            role="menu"
            aria-labelledby={triggerId}
            className="absolute left-0 z-20 mt-1 w-56 max-w-[calc(100vw-3rem)] overflow-hidden rounded-lg border border-rule-strong bg-surface py-1 shadow-lg sm:left-auto sm:right-0"
          >
            {options.map(({ format, label }, index) => (
              <button
                key={format}
                ref={(element) => {
                  itemRefs.current[index] = element;
                }}
                type="button"
                role="menuitem"
                tabIndex={-1}
                aria-disabled={pending[format]}
                onClick={() => {
                  if (pending[format]) {
                    closeMenu(true);
                    return;
                  }
                  void runExport(format);
                }}
                className="flex min-h-12 w-full items-center px-4 text-left text-sm text-ink hover:bg-paper focus-visible:bg-paper focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ink aria-disabled:opacity-50 sm:min-h-10"
              >
                {pending[format] ? x.exporting : label}
              </button>
            ))}
          </div>
        )}
      </div>

      {failed && (
        <p role="alert" className="text-sm text-danger">
          {x.error}
        </p>
      )}
    </div>
  );
}
