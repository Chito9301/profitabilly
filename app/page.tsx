import Button from "@/components/Button";

export default function HomePage() {
  return (
    <main
      className="flex min-h-dvh flex-col items-center justify-center px-6
                 bg-[repeating-linear-gradient(to_bottom,transparent,transparent_39px,theme(colors.rule)_39px,theme(colors.rule)_40px)]"
    >
      {/*
        The repeating horizontal rule above is a deliberate nod to ledger
        paper — the one visual idea this page leans on, kept faint enough
        to read as texture rather than decoration.
      */}
      <div className="flex max-w-md flex-col items-center text-center">
        <h1 className="text-4xl font-medium tracking-tight sm:text-5xl">
          Profitabilly
        </h1>

        <p className="mt-4 text-balance text-base text-muted sm:text-lg">
          Know exactly how profitable every project or job really is.
        </p>

        <div className="mt-10 flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
          <Button href="/signup" variant="primary" className="w-full sm:w-auto">
            Get Started
          </Button>
          <Button href="/login" variant="secondary" className="w-full sm:w-auto">
            Login
          </Button>
        </div>
      </div>
    </main>
  );
}
