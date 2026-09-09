import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Button from "@/components/Button";
import DeleteCustomerButton from "./DeleteCustomerButton";
import type { Customer } from "@/types/supabase";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function StatusBadge({ status }: { status: string }) {
  const isActive = status === "Active";
  return (
    <span
      className={`inline-flex rounded-full px-2 py-0.5 text-xs ${
        isActive ? "bg-profit/10 text-profit" : "bg-ink/5 text-muted"
      }`}
    >
      {status}
    </span>
  );
}

const SUCCESS_MESSAGES: Record<string, string> = {
  created: "Customer added.",
  updated: "Customer updated.",
  deleted: "Customer deleted.",
};

export default async function CustomersPage({
  searchParams,
}: {
  // Next 15 passes searchParams as a Promise.
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;

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
        ← Dashboard
      </Link>

      <div className="mb-8 mt-2 flex items-center justify-between gap-4">
        <h1 className="text-2xl font-medium tracking-tight">Customers</h1>
        <Button href="/dashboard/customers/new" variant="primary">
          Add Customer
        </Button>
      </div>

      {successMessage && (
        <p
          role="status"
          className="mb-6 rounded-md bg-profit/10 px-4 py-2 text-sm text-profit"
        >
          {successMessage}
        </p>
      )}

      {rows.length === 0 ? (
        <div className="flex flex-col items-center gap-4 rounded-md border border-dashed border-rule py-16 text-center">
          <p className="text-muted">No customers yet.</p>
          <Button href="/dashboard/customers/new" variant="primary">
            Add Customer
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
                <th className="py-2 pr-4 font-medium">Name</th>
                <th className="py-2 pr-4 font-medium">Company</th>
                <th className="py-2 pr-4 font-medium">Email</th>
                <th className="py-2 pr-4 font-medium">Phone</th>
                <th className="py-2 pr-4 font-medium">Status</th>
                <th className="py-2 pr-4 font-medium">Created</th>
                <th className="py-2 font-medium">Actions</th>
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
                    <StatusBadge status={customer.status} />
                  </td>
                  <td className="py-3 pr-4 text-muted">{formatDate(customer.created_at)}</td>
                  <td className="py-3">
                    <div className="flex items-center gap-4">
                      <Link
                        href={`/dashboard/customers/${customer.id}/edit`}
                        className="text-sm underline underline-offset-2"
                      >
                        Edit
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
                  <StatusBadge status={customer.status} />
                </div>

                <dl className="mt-3 flex flex-col gap-1 text-sm text-muted">
                  {customer.email && <div>{customer.email}</div>}
                  {customer.phone && <div>{customer.phone}</div>}
                  <div>Added {formatDate(customer.created_at)}</div>
                </dl>

                <div className="mt-3 flex items-center gap-4">
                  <Link
                    href={`/dashboard/customers/${customer.id}/edit`}
                    className="text-sm underline underline-offset-2"
                  >
                    Edit
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
