import Button from "@/components/Button";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { getMessages } from "@/lib/i18n/server";

export default async function HomePage() {
  const { messages } = await getMessages();
  const t = messages.home;

  return (
    <main
      className="relative flex min-h-dvh flex-col items-center justify-center px-6
                 bg-[repeating-linear-gradient(to_bottom,transparent,transparent_39px,theme(colors.rule)_39px,theme(colors.rule)_40px)]"
    >
      {/*
        The repeating horizontal rule above is a deliberate nod to ledger
        paper — the one visual idea this page leans on, kept faint enough
        to read as texture rather than decoration.
      */}
      <LanguageSwitcher className="absolute right-3 top-2" />
      <div className="flex max-w-md flex-col items-center text-center">
        <h1 className="text-4xl font-medium tracking-tight sm:text-5xl">
          JobWorth
        </h1>

        <p className="mt-4 text-balance text-base text-muted sm:text-lg">
          {t.tagline}
        </p>

        <div className="mt-10 flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
          <Button href="/signup" variant="primary" className="w-full sm:w-auto">
            {t.getStarted}
          </Button>
          <Button href="/login" variant="secondary" className="w-full sm:w-auto">
            {t.login}
          </Button>
        </div>
      </div>
    </main>
  );
}
