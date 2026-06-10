"use client";

export default function ForbiddenPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="text-center max-w-md">
        <div className="text-6xl font-bold text-red-500">403</div>

        <h1 className="mt-4 text-2xl font-semibold text-foreground">
          Access Forbidden
        </h1>

        <p className="mt-2 text-muted-foreground">
          You don’t have permission to access this page. Please contact your
          administrator if you believe this is a mistake.
        </p>

        <div className="mt-6 flex justify-center gap-3">
          <button
            onClick={() => window.history.back()}
            className="rounded-md bg-muted px-4 py-2 text-sm font-medium hover:bg-muted/80"
          >
            Go Back
          </button>

          <a
            href="/"
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
          >
            Go Home
          </a>
        </div>
      </div>
    </div>
  );
}
