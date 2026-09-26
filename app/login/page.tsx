import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import LoginForm from "./LoginForm";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error: authError } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // An already-logged-in user has no reason to see the login form.
  if (user) redirect("/dashboard");

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <h1 className="text-center text-2xl font-medium tracking-tight">
          Log in
        </h1>

        {authError === "recovery_link_invalid" && (
          <p role="alert" className="mt-6 text-center text-sm text-red-700">
            This password reset link is invalid or has expired. Request a new one.
          </p>
        )}
        {authError === "recovery_session_missing" && (
          <p role="alert" className="mt-6 text-center text-sm text-red-700">
            Your recovery session has expired. Request a new password reset link.
          </p>
        )}

        <LoginForm />

        <p className="mt-6 text-center text-sm text-muted">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="text-ink underline underline-offset-2">
            Sign up
          </Link>
        </p>
      </div>
    </main>
  );
}
