import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { getMessages } from "@/lib/i18n/server";
import LoginForm from "./LoginForm";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error: authError } = await searchParams;
  const t = (await getMessages()).messages.auth;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // An already-logged-in user has no reason to see the login form.
  if (user) redirect("/dashboard");

  return (
    <main className="relative flex min-h-dvh flex-col items-center justify-center px-6">
      <LanguageSwitcher className="absolute right-3 top-2" />
      <div className="w-full max-w-sm">
        <h1 className="text-center text-2xl font-medium tracking-tight">
          {t.login.title}
        </h1>

        {authError === "recovery_link_invalid" && (
          <p role="alert" className="mt-6 text-center text-sm text-danger">
            {t.linkErrors.recoveryLinkInvalid}
          </p>
        )}
        {authError === "recovery_session_missing" && (
          <p role="alert" className="mt-6 text-center text-sm text-danger">
            {t.linkErrors.recoverySessionExpired}
          </p>
        )}

        <LoginForm />

        <p className="mt-6 text-center text-sm text-muted">
          {t.login.noAccount}{" "}
          <Link href="/signup" className="text-ink underline underline-offset-2">
            {t.login.signUpLink}
          </Link>
        </p>
      </div>
    </main>
  );
}
