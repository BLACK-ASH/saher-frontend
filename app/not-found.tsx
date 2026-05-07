"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { FileQuestion } from "lucide-react";
import { logError } from "@/lib/logger";

export default function NotFound() {
  const router = useRouter();

  useEffect(() => {
    // Optional: log 404 for analytics/debugging
    logError(new Error("404 - Page Not Found"), {
      path: window.location.pathname,
      type: "not-found",
    });
  }, []);

  return (
    <div className="flex min-h-dvh items-center justify-center bg-background px-6">
      <div className="w-full max-w-md text-center space-y-6">
        {/* Icon */}
        <div className="flex justify-center">
          <div className="rounded-full bg-muted p-4">
            <FileQuestion className="h-10 w-10 text-muted-foreground" />
          </div>
        </div>

        {/* Title */}
        <h1 className="text-3xl font-semibold tracking-tight">
          404 — Page Not Found
        </h1>

        {/* Description */}
        <p className="text-sm text-muted-foreground">
          The page you’re looking for doesn’t exist or may have been moved.
        </p>

        {/* Actions */}
        <div className="flex items-center justify-center gap-3">
          <Button onClick={() => router.push("/")}>Go Home</Button>

          <Button variant="outline" onClick={() => router.back()}>
            Go Back
          </Button>
        </div>

        {/* Optional helper */}
        <p className="text-xs text-muted-foreground">
          Check the URL or return to the homepage.
        </p>
      </div>
    </div>
  );
}
