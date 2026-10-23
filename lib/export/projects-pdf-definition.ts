import { formatCents } from "@/lib/finance/money";
import type { Locale } from "@/lib/i18n/config";
import type { Messages } from "@/lib/i18n/messages";
import type { ProjectsReport } from "@/lib/export/projects-report";

// Mini-Sprint 55 — builds the pdfmake "document definition" object for the
// projects report. Pure TypeScript: no pdfmake, no fs, no Next, no
// Supabase. It only lays out values that lib/finance/summary.ts already
// computed (integer cents / margin percent); it contains no formula.
// Rendering (fonts + pdfmake call) lives in lib/export/projects-pdf.ts.

// Family name registered with pdfmake in projects-pdf.ts.
export const PDF_FONT_FAMILY = "Carlito";

const NAVY = "#0B1F46"; // same navy as the app's theme color
const GRAY = "#5B6472";
const TEXT = "#111827";
const NEGATIVE = "#B42318";
const ZEBRA = "#F3F5F9";
const RULE = "#D5D9E0";
const WHITE = "#FFFFFF";

// A4 landscape = 841.89 pt wide; 28 pt side margins leave ~785 pt.
// Eight columns have fixed widths sized for their widest realistic value at
// 9 pt (dates, currency code, status, amounts up to 9,999,999,999.99, margin);
// the two text columns (project, customer) share the rest ("*") and wrap.
const PAGE_MARGIN_X = 28;
const COLUMN_WIDTHS: Array<number | "*"> = [
  "*", // project
  "*", // customer
  58, // status
  56, // created
  56, // accepted
  46, // currency
  78, // revenue
  78, // costs
  78, // profit
  62, // margin
];
const RIGHT_ALIGNED = new Set([6, 7, 8, 9]);
const COLUMN_COUNT = COLUMN_WIDTHS.length;

type Cell = Record<string, unknown>;

export type PdfDocumentDefinition = Record<string, unknown>;

function groupThousands(whole: string, separator: string): string {
  return whole.replace(/\B(?=(\d{3})+(?!\d))/g, separator);
}

// Two decimals, thousands grouping, locale separators. Built on the
// existing formatCents (exact integer-cent arithmetic) — only the
// separators differ per language.
export function formatPdfMoney(cents: number, locale: Locale): string {
  const raw = formatCents(cents); // e.g. "-1234.56"
  const negative = raw.startsWith("-");
  const [whole, fraction] = (negative ? raw.slice(1) : raw).split(".");
  const thousands = locale === "es" ? "." : ",";
  const decimal = locale === "es" ? "," : ".";
  return `${negative ? "-" : ""}${groupThousands(whole, thousands)}${decimal}${fraction}`;
}

// Two decimal places, as a percentage. null (revenue 0) -> empty text.
export function formatPdfMargin(percent: number | null, locale: Locale): string {
  if (percent === null) return "";
  const rounded = Math.round(percent * 100) / 100;
  const text = rounded.toFixed(2);
  return `${locale === "es" ? text.replace(".", ",") : text}%`;
}

export function buildProjectsPdfDefinition(
  report: ProjectsReport,
  messages: Messages,
  locale: Locale,
  generatedAt: Date,
): PdfDocumentDefinition {
  const x = messages.exportProjects;
  const statusLabels: Record<string, string> = messages.projects.status;

  // Same ten columns, same order and same labels as the Excel export.
  const headerLabels = [
    x.columns.project,
    x.columns.customer,
    x.columns.status,
    x.columns.created,
    x.columns.accepted,
    x.columns.currency,
    x.columns.revenue,
    x.columns.costs,
    x.columns.profit,
    x.columns.margin,
  ];
  const headerRow: Cell[] = headerLabels.map((text, index) => ({
    text,
    bold: true,
    color: WHITE,
    alignment: RIGHT_ALIGNED.has(index) ? "right" : "left",
  }));

  const dataRows: Cell[][] = report.rows.map((row) => {
    const money = (cents: number, tone?: string): Cell => ({
      text: formatPdfMoney(cents, locale),
      alignment: "right",
      ...(tone ? { color: tone } : {}),
    });
    return [
      { text: row.name },
      { text: row.customerName ?? "" },
      { text: statusLabels[row.status] ?? row.status },
      { text: row.createdYmd ?? "" },
      { text: row.acceptedYmd ?? "" },
      { text: report.currency },
      money(row.revenueCents),
      money(row.costCents),
      money(row.profitCents, row.profitCents < 0 ? NEGATIVE : undefined),
      {
        text: formatPdfMargin(row.marginPercent, locale),
        alignment: "right",
        ...(row.marginPercent !== null && row.marginPercent < 0
          ? { color: NEGATIVE }
          : {}),
      },
    ];
  });

  // No projects: still a valid table — header row plus one full-width
  // message row (colSpan over all ten columns).
  const bodyRows: Cell[][] =
    dataRows.length > 0
      ? dataRows
      : [
          [
            {
              text: x.pdf.empty,
              colSpan: COLUMN_COUNT,
              alignment: "center",
              color: GRAY,
              margin: [0, 6, 0, 6],
            },
            ...Array.from({ length: COLUMN_COUNT - 1 }, (): Cell => ({})),
          ],
        ];

  const generatedOn = generatedAt.toISOString().slice(0, 10); // UTC, YYYY-MM-DD

  return {
    pageSize: "A4",
    pageOrientation: "landscape",
    pageMargins: [PAGE_MARGIN_X, 36, PAGE_MARGIN_X, 44],
    info: { title: `JobWorth - ${x.pdf.reportTitle}` },
    defaultStyle: { font: PDF_FONT_FAMILY, fontSize: 9, color: TEXT },
    content: [
      { text: "JobWorth", fontSize: 20, bold: true, color: NAVY },
      { text: x.pdf.reportTitle, fontSize: 11, margin: [0, 2, 0, 0] },
      {
        text: `${x.pdf.generatedOn} ${generatedOn}`,
        fontSize: 8.5,
        color: GRAY,
        margin: [0, 2, 0, 12],
      },
      {
        table: {
          // Header row repeats on every page when the table spans several.
          headerRows: 1,
          widths: COLUMN_WIDTHS,
          body: [headerRow, ...bodyRows],
        },
        layout: {
          hLineWidth: (index: number, node: { table: { body: unknown[] } }) =>
            index === 0 || index === 1 || index === node.table.body.length
              ? 0.75
              : 0.25,
          vLineWidth: () => 0,
          hLineColor: () => RULE,
          paddingLeft: () => 4,
          paddingRight: () => 4,
          paddingTop: () => 3,
          paddingBottom: () => 3,
          fillColor: (rowIndex: number) =>
            rowIndex === 0 ? NAVY : rowIndex % 2 === 0 ? ZEBRA : null,
        },
      },
    ],
    footer: (currentPage: number, pageCount: number) => ({
      text: `${x.pdf.page} ${currentPage} ${x.pdf.pageOf} ${pageCount}`,
      alignment: "right",
      fontSize: 8,
      color: GRAY,
      margin: [PAGE_MARGIN_X, 14, PAGE_MARGIN_X, 0],
    }),
  };
}
