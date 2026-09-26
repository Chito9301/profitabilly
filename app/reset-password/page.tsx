import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ResetPasswordForm from "./ResetPasswordForm";

export default async function ResetPasswordPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?error=recovery_session_missing");

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm">
        <h1 className="text-center text-2xl font-medium tracking-tight">
          Choose a new password
        </h1>
        <p className="mt-3 text-center text-sm text-muted">
          Enter your new password below.
        </p>
        <ResetPasswordForm />
      </div>
    </main>
  );
}
