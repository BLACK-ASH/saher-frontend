"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";
import { logError } from "@/lib/logger";
import { toast } from "sonner";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();

  useEffect(() => {
    logError(error, { digest: error.digest });
    toast.error("Something went wrong");
  }, [error]);

  return (
    <div className="flex min-h-dvh items-center justify-center bg-background px-6">
      <div className="w-full max-w-md text-center space-y-6">
        {/* Icon */}
        <div className="flex justify-center">
          <div className="rounded-full bg-destructive/10 p-4">
            <AlertTriangle className="h-10 w-10 text-destructive" />
          </div>
        </div>

        {/* Title */}
        <h1 className="text-2xl font-semibold">Something went wrong</h1>

        {/* Description */}
        <p className="text-sm text-muted-foreground">
          An unexpected error occurred. Try again or go back home.
        </p>

        {/* Actions */}
        <div className="flex justify-center gap-3">
          <Button onClick={reset}>Try Again</Button>

          <Button variant="outline" onClick={() => router.push("/")}>
            Go Home
          </Button>
        </div>

        {/* Dev details */}
        {process.env.NODE_ENV === "development" && (
          <pre className="text-xs text-red-500 bg-muted p-3 rounded-md text-left max-h-40 overflow-auto">
            {error.message}
          </pre>
        )}
      </div>
    </div>
  );
}
