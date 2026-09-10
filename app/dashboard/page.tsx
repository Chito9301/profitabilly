import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { logOut } from "@/lib/auth/actions";
import Button from "@/components/Button";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Belt-and-suspenders with middleware.ts: getUser() is re-checked here
  // because middleware responses can be cached, so this is the
  // authoritative check for the page itself.
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("business_name")
    .eq("id", user.id)
    .single();

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-6 text-center">
      <h1 className="text-3xl font-medium tracking-tight">
        Welcome to Profitabilly
      </h1>

      {profile?.business_name && (
        <p className="mt-2 text-muted">{profile.business_name}</p>
      )}

      <Link
        href="/dashboard/customers"
        className="mt-8 text-sm underline underline-offset-2"
      >
        Customers
      </Link>

      <Link
        href="/dashboard/projects"
        className="mt-2 text-sm underline underline-offset-2"
      >
        Projects
      </Link>

      <form action={logOut} className="mt-4">
        <Button type="submit" variant="secondary">
          Log out
        </Button>
      </form>
    </main>
  );
}
