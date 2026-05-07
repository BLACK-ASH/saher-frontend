"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";
import { logError } from "@/lib/logger";
import { toast } from "sonner";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    logError(error, { scope: "global", digest: error.digest });
    toast.error("A critical error occurred");
  }, [error]);

  return (
    <html lang="en">
      <body className="flex min-h-screen items-center justify-center bg-background px-6">
        <div className="w-full max-w-md text-center space-y-6">
          {/* Icon */}
          <div className="flex justify-center">
            <div className="rounded-full bg-destructive/10 p-4">
              <AlertTriangle className="h-10 w-10 text-destructive" />
            </div>
          </div>

          {/* Title */}
          <h1 className="text-2xl font-semibold">Critical Error</h1>

          {/* Description */}
          <p className="text-sm text-muted-foreground">
            Something went seriously wrong. You can try again or return home.
          </p>

          {/* Actions */}
          <div className="flex justify-center gap-3">
            <Button onClick={reset}>Try Again</Button>

            <Button
              variant="outline"
              onClick={() => (window.location.href = "/")}
            >
              Go Home
            </Button>
          </div>

          {/* Error ID */}
          {error?.digest && (
            <p className="text-xs text-muted-foreground">
              Error ID: {error.digest}
            </p>
          )}

          {/* Dev-only debug */}
          {process.env.NODE_ENV === "development" && (
            <pre className="text-xs text-red-500 bg-muted p-3 rounded-md text-left max-h-40 overflow-auto">
              {error.message}
            </pre>
          )}
        </div>
      </body>
    </html>
  );
}
