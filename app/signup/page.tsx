import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { getMessages } from "@/lib/i18n/server";
import SignupForm from "./SignupForm";

export default async function SignupPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) redirect("/dashboard");

  const t = (await getMessages()).messages.auth;

  return (
    <main className="relative flex min-h-dvh flex-col items-center justify-center px-6 py-12">
      <LanguageSwitcher className="absolute right-3 top-2" />
      <div className="w-full max-w-sm">
        <h1 className="text-center text-2xl font-medium tracking-tight">
          {t.signup.title}
        </h1>

        <SignupForm />

        <p className="mt-6 text-center text-sm text-muted">
          {t.signup.haveAccount}{" "}
          <Link href="/login" className="text-ink underline underline-offset-2">
            {t.signup.loginLink}
          </Link>
        </p>
      </div>
    </main>
  );
}
