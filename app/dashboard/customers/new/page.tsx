import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createCustomer } from "@/lib/customers/actions";
import { getMessages } from "@/lib/i18n/server";
import CustomerForm from "../CustomerForm";

export default async function NewCustomerPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { messages } = await getMessages();

  return (
    <main className="mx-auto max-w-md px-6 py-12">
      <Link
        href="/dashboard/customers"
        className="text-sm text-muted underline underline-offset-2"
      >
        ← {messages.nav.customers}
      </Link>

      <h1 className="mb-6 mt-2 text-2xl font-medium tracking-tight">
        {messages.customers.add}
      </h1>

      <CustomerForm action={createCustomer} submitLabel={messages.customers.add} />
    </main>
  );
}
