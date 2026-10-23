import { createClient } from "@/lib/supabase/server";
import { getMessages } from "@/lib/i18n/server";
import { loadProjectsReport } from "@/lib/export/projects-report";
import { renderProjectsPdf } from "@/lib/export/projects-pdf";

// Mini-Sprint 55 — PDF export of the user's projects (one row per project,
// the same ten columns and the same figures as the Excel export).
//
// Security model (identical to the Excel export, Mini-Sprint 54):
// - Path is under /dashboard, so middleware.ts already redirects anonymous
//   visitors; the handler still verifies the session itself with
//   supabase.auth.getUser() and answers 401 without a user.
// - Uses the server Supabase client (anon key + the user's session cookie),
//   so RLS applies; every query in loadProjectsReport is also filtered
//   explicitly by the authenticated user's id.
// - No service_role key, no external service, and nothing is read from the
//   request (no query string, no body, no ids): the report is built only from
//   what the authenticated user may read.
// - Errors are generic JSON ("unauthorized" / "export_failed"); details are
//   never sent to the browser, and logs carry only the error message.
// - The response is private/no-store, application/pdf, with a fixed ASCII
//   file name.

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PDF_MIME = "application/pdf";

const PRIVATE_HEADERS = {
  "Cache-Control": "private, no-store, max-age=0",
  Pragma: "no-cache",
  Vary: "Cookie, Accept-Language",
  "X-Content-Type-Options": "nosniff",
};

function jsonError(status: number, error: string): Response {
  return new Response(JSON.stringify({ error }), {
    status,
    headers: { ...PRIVATE_HEADERS, "Content-Type": "application/json" },
  });
}

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return jsonError(401, "unauthorized");

    const { locale, messages } = await getMessages();

    const report = await loadProjectsReport(supabase, user.id);
    const buffer = await renderProjectsPdf(report, messages, locale);

    // Generation date in UTC; the prefix comes from the dictionary (same
    // prefix as the Excel file) and is sanitized so the header can never be
    // injected.
    const day = new Date().toISOString().slice(0, 10);
    const prefix = messages.exportProjects.fileName.replace(/[^A-Za-z0-9_-]/g, "");
    const fileName = `${prefix}-${day}.pdf`;

    return new Response(new Uint8Array(buffer), {
      status: 200,
      headers: {
        ...PRIVATE_HEADERS,
        "Content-Type": PDF_MIME,
        "Content-Disposition": `attachment; filename="${fileName}"`,
      },
    });
  } catch (error) {
    // Log only the message: never the rows or any user data.
    console.error(
      "Projects PDF export failed:",
      error instanceof Error ? error.message : "unknown error",
    );
    return jsonError(500, "export_failed");
  }
}
