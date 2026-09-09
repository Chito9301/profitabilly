import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createCustomer } from "@/lib/customers/actions";
import CustomerForm from "../CustomerForm";

export default async function NewCustomerPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <main className="mx-auto max-w-md px-6 py-12">
      <Link
        href="/dashboard/customers"
        className="text-sm text-muted underline underline-offset-2"
      >
        ← Customers
      </Link>

      <h1 className="mb-6 mt-2 text-2xl font-medium tracking-tight">
        Add Customer
      </h1>

      <CustomerForm action={createCustomer} submitLabel="Add Customer" />
    </main>
  );
}
