import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ForgotPasswordForm from "./ForgotPasswordForm";

export default async function ForgotPasswordPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) redirect("/dashboard");

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm">
        <h1 className="text-center text-2xl font-medium tracking-tight">
          Reset your password
        </h1>
        <p className="mt-3 text-center text-sm text-muted">
          Enter the email address associated with your account and we&apos;ll send you a reset link.
        </p>
        <ForgotPasswordForm />
        <p className="mt-6 text-center text-sm text-muted">
          Remembered your password?{" "}
          <Link href="/login" className="text-ink underline underline-offset-2">
            Log in
          </Link>
        </p>
      </div>
    </main>
  );
}
