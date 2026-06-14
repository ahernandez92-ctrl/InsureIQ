import Link from "next/link";

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold text-primary">InsureIQ</span>
          </div>
          <nav className="flex items-center gap-4">
            <Link
              href="/login"
              className="text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              Sign In
            </Link>
            <Link
              href="/register"
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Get Started
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <section className="container mx-auto px-4 py-24 text-center">
          <h1 className="mb-6 text-5xl font-bold tracking-tight">
            AI-Powered Insurance Analysis
            <span className="block text-primary">for Independent Agents</span>
          </h1>
          <p className="mx-auto mb-8 max-w-2xl text-lg text-muted-foreground">
            Turn dense carrier data into personalized financial reports that
            clients actually understand. Close more deals with professional,
            scenario-based analysis.
          </p>
          <div className="flex justify-center gap-4">
            <Link
              href="/register"
              className="rounded-md bg-primary px-8 py-3 text-lg font-medium text-primary-foreground hover:bg-primary/90"
            >
              Start Free Trial
            </Link>
            <Link
              href="/login"
              className="rounded-md border px-8 py-3 text-lg font-medium hover:bg-secondary"
            >
              Sign In
            </Link>
          </div>
        </section>

        <section className="border-t py-16">
          <div className="container mx-auto px-4">
            <h2 className="mb-12 text-center text-3xl font-bold">
              Key Features
            </h2>
            <div className="grid gap-8 md:grid-cols-3">
              <div className="rounded-lg border p-6">
                <h3 className="mb-3 text-xl font-semibold">Tokenized Links</h3>
                <p className="text-muted-foreground">
                  Unique, secure intake URLs for clients. Zero manual data entry
                  for agents.
                </p>
              </div>
              <div className="rounded-lg border p-6">
                <h3 className="mb-3 text-xl font-semibold">AI Risk Summary</h3>
                <p className="text-muted-foreground">
                  Plain-English profile analysis. Instant authority and trust
                  with clients.
                </p>
              </div>
              <div className="rounded-lg border p-6">
                <h3 className="mb-3 text-xl font-semibold">
                  Tiered Bundles
                </h3>
                <p className="text-muted-foreground">
                  Essential / Comprehensive / Maximum Protection. Simple
                  "Good-Better-Best" choice for clients.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} InsureIQ. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
