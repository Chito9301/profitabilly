"use client";

import { useState } from "react";
import Button from "@/components/Button";
import { useI18n } from "@/lib/i18n/provider";

// Same-origin endpoint, no parameters: the server builds the report only
// from the authenticated session (see app/dashboard/export/projects/route.ts).
const EXPORT_URL = "/dashboard/export/projects";
const XLSX_MIME_HINT = "spreadsheetml";
const FALLBACK_FILE_NAME = "JobWorth-Projects.xlsx";

// Reads filename="..." from a Content-Disposition header; the server only
// sends ASCII [A-Za-z0-9_-] names. Anything unexpected falls back to a
// fixed name, and the browser never gets a path.
function fileNameFrom(disposition: string | null): string {
  const match = disposition ? /filename="([A-Za-z0-9_.-]+\.xlsx)"/.exec(disposition) : null;
  return match ? match[1] : FALLBACK_FILE_NAME;
}

// Downloads the Excel report. While the request runs the button is
// disabled and shows the loading text; any failure (network, 401/500, or a
// response that is not a spreadsheet — e.g. the login page after an
// expired session) shows a translated message and nothing is downloaded.
export default function ExportProjectsButton() {
  const { messages } = useI18n();
  const [isPending, setIsPending] = useState(false);
  const [failed, setFailed] = useState(false);

  async function handleClick() {
    setIsPending(true);
    setFailed(false);
    try {
      const response = await fetch(EXPORT_URL, {
        method: "GET",
        credentials: "same-origin",
        cache: "no-store",
      });
      const contentType = response.headers.get("Content-Type") ?? "";
      if (!response.ok || response.redirected || !contentType.includes(XLSX_MIME_HINT)) {
        throw new Error("export failed");
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = fileNameFrom(response.headers.get("Content-Disposition"));
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch {
      setFailed(true);
    } finally {
      setIsPending(false);
    }
  }

  return (
    <div className="flex flex-col items-start gap-1 sm:items-end">
      <Button
        type="button"
        variant="secondary"
        onClick={handleClick}
        disabled={isPending}
        aria-busy={isPending}
      >
        {isPending ? messages.exportProjects.exporting : messages.exportProjects.button}
      </Button>
      {failed && (
        <p role="alert" className="text-sm text-danger">
          {messages.exportProjects.error}
        </p>
      )}
    </div>
  );
}
