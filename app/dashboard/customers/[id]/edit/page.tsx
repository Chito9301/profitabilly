import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { updateCustomer } from "@/lib/customers/actions";
import CustomerForm from "../../CustomerForm";

export default async function EditCustomerPage({
  params,
}: {
  // Next 15 passes route params as a Promise.
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Scoped to id + user_id: RLS already hides other users' rows, so a
  // wrong id and someone else's customer look identical here — both
  // just come back empty, and both should render as "not found".
  const { data: customer } = await supabase
    .from("customers")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!customer) notFound();

  return (
    <main className="mx-auto max-w-md px-6 py-12">
      <Link
        href="/dashboard/customers"
        className="text-sm text-muted underline underline-offset-2"
      >
        ← Customers
      </Link>

      <h1 className="mb-6 mt-2 text-2xl font-medium tracking-tight">
        Edit Customer
      </h1>

      <CustomerForm
        action={updateCustomer}
        defaultValues={customer}
        submitLabel="Save changes"
      />
    </main>
  );
}
