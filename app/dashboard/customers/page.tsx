import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Button from "@/components/Button";
import StatusBadge from "@/components/StatusBadge";
import DeleteCustomerButton from "./DeleteCustomerButton";
import { getMessages } from "@/lib/i18n/server";
import type { Customer } from "@/types/supabase";

// Month names follow the active language (was the server default).
function formatDate(iso: string, locale: string) {
  return new Date(iso).toLocaleDateString(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default async function CustomersPage({
  searchParams,
}: {
  // Next 15 passes searchParams as a Promise.
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const { locale, messages } = await getMessages();
  const t = messages.customers;

  // Query-string flags (created/updated/deleted) are unchanged; only the
  // text shown for each comes from the active dictionary.
  const SUCCESS_MESSAGES: Record<string, string> = {
    created: t.messages.created,
    updated: t.messages.updated,
    deleted: t.messages.deleted,
  };
  const statusLabel = (status: string) =>
    t.status[status as keyof typeof t.status] ?? status;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // .eq("user_id", user.id) is redundant with RLS but keeps the query's
  // intent explicit and correct even if RLS were ever misconfigured.
  const { data: customers } = await supabase
    .from("customers")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const successKey = Object.keys(SUCCESS_MESSAGES).find(
    (key) => params[key] !== undefined,
  );
  const successMessage = successKey ? SUCCESS_MESSAGES[successKey] : null;

  const rows: Customer[] = customers ?? [];

  return (
    <main className="mx-auto max-w-4xl px-6 py-12">
      <Link href="/dashboard" className="text-sm text-muted underline underline-offset-2">
        ← {messages.nav.dashboard}
      </Link>

      <div className="mb-8 mt-2 flex items-center justify-between gap-4">
        <h1 className="text-2xl font-medium tracking-tight">{t.title}</h1>
        <Button href="/dashboard/customers/new" variant="primary">
          {t.add}
        </Button>
      </div>

      {successMessage && (
        <p
          role="status"
          className="mb-6 rounded-md bg-profit/10 px-4 py-2 text-sm text-profit-strong"
        >
          {successMessage}
        </p>
      )}

      {rows.length === 0 ? (
        <div className="flex flex-col items-center gap-4 rounded-md border border-dashed border-rule py-16 text-center">
          <p className="text-muted">{t.empty}</p>
          <Button href="/dashboard/customers/new" variant="primary">
            {t.add}
          </Button>
        </div>
      ) : (
        <>
          {/* A six-column table doesn't fit a phone, so desktop (table)
              and mobile (cards) are two separate layouts rather than one
              markup squeezed to work at both sizes. */}
          <table className="hidden w-full text-left text-sm md:table">
            <thead>
              <tr className="border-b border-rule text-muted">
                <th className="py-2 pr-4 font-medium">{t.fields.name}</th>
                <th className="py-2 pr-4 font-medium">{t.fields.company}</th>
                <th className="py-2 pr-4 font-medium">{messages.common.email}</th>
                <th className="py-2 pr-4 font-medium">{t.fields.phone}</th>
                <th className="py-2 pr-4 font-medium">{messages.common.status}</th>
                <th className="py-2 pr-4 font-medium">{t.created}</th>
                <th className="py-2 font-medium">{t.actions}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((customer) => (
                <tr key={customer.id} className="border-b border-rule/60">
                  <td className="py-3 pr-4">{customer.name}</td>
                  <td className="py-3 pr-4 text-muted">{customer.company ?? "—"}</td>
                  <td className="py-3 pr-4 text-muted">{customer.email ?? "—"}</td>
                  <td className="py-3 pr-4 text-muted">{customer.phone ?? "—"}</td>
                  <td className="py-3 pr-4">
                    <StatusBadge
                      status={customer.status}
                      label={statusLabel(customer.status)}
                    />
                  </td>
                  <td className="py-3 pr-4 text-muted">{formatDate(customer.created_at, locale)}</td>
                  <td className="py-3">
                    <div className="flex items-center gap-4">
                      <Link
                        href={`/dashboard/customers/${customer.id}/edit`}
                        className="text-sm underline underline-offset-2"
                      >
                        {messages.common.edit}
                      </Link>
                      <DeleteCustomerButton customerId={customer.id} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <ul className="flex flex-col gap-3 md:hidden">
            {rows.map((customer) => (
              <li key={customer.id} className="rounded-md border border-rule p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium">{customer.name}</p>
                    {customer.company && (
                      <p className="text-sm text-muted">{customer.company}</p>
                    )}
                  </div>
                  <StatusBadge
                      status={customer.status}
                      label={statusLabel(customer.status)}
                    />
                </div>

                <dl className="mt-3 flex flex-col gap-1 text-sm text-muted">
                  {customer.email && <div>{customer.email}</div>}
                  {customer.phone && <div>{customer.phone}</div>}
                  <div>{t.addedPrefix} {formatDate(customer.created_at, locale)}</div>
                </dl>

                <div className="mt-3 flex items-center gap-4">
                  <Link
                    href={`/dashboard/customers/${customer.id}/edit`}
                    className="text-sm underline underline-offset-2"
                  >
                    {messages.common.edit}
                  </Link>
                  <DeleteCustomerButton customerId={customer.id} />
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
    </main>
  );
}
