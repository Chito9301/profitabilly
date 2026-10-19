import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { getMessages } from "@/lib/i18n/server";
import ResetPasswordForm from "./ResetPasswordForm";

export default async function ResetPasswordPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?error=recovery_session_missing");

  const t = (await getMessages()).messages.auth;

  return (
    <main className="relative flex min-h-dvh flex-col items-center justify-center px-6 py-12">
      <LanguageSwitcher className="absolute right-3 top-2" />
      <div className="w-full max-w-sm">
        <h1 className="text-center text-2xl font-medium tracking-tight">
          {t.reset.title}
        </h1>
        <p className="mt-3 text-center text-sm text-muted">
          {t.reset.intro}
        </p>
        <ResetPasswordForm />
      </div>
    </main>
  );
}
