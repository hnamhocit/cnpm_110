
import Link from "next/link";

export default function ForbiddenPage() {
  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md rounded-xl border p-8 text-center shadow-sm">
        <h1 className="text-6xl font-bold text-red-500">
          403
        </h1>

        <h2 className="mt-4 text-2xl font-semibold">
          Access Denied
        </h2>

        <p className="mt-3 text-muted-foreground">
          You do not have permission to access this page.
        </p>

        <Link
          href="/"
          className="mt-6 inline-block rounded-lg bg-primary px-6 py-3 text-primary-foreground"
        >
          Back to Home
        </Link>
      </div>
    </main>
  );
}
