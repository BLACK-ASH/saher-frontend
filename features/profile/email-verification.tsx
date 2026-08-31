"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api-wrapper";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { CheckCircle, Mail } from "lucide-react";

interface EmailVerificationProps {
  emailVerified: boolean;
}

function EmailVerification({ emailVerified }: EmailVerificationProps) {
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;

    const timer = setInterval(() => {
      setCooldown((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [cooldown]);

  const handleVerifyEmail = async () => {
    if (cooldown > 0) return;

    const res = await apiFetch("/api/auth/verify-email/request", {
      method: "POST",
    });

    if (!res.success) {
      return toast.error(res.message);
    }

    toast.success("Verification email sent successfully");
    setCooldown(60);
  };

  if (emailVerified) {
    return (
      <Alert className="border-green-500/50 bg-green-500/10">
        <AlertTitle className="flex items-center justify-between text-sm font-medium text-green-700 dark:text-green-300">
          <span className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            Email Verified
          </span>
          <span className="rounded-md bg-green-100 px-2 py-1 text-xs text-green-700 dark:bg-green-900 dark:text-green-300">
            verified
          </span>
        </AlertTitle>
        <AlertDescription className="mt-3 text-sm text-green-700 dark:text-green-300">
          Your email address has been verified. You now have access to all features.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Alert className="border-border bg-muted/40">
      <AlertTitle className="flex items-center justify-between text-sm font-medium">
        <span className="flex items-center gap-2">
          <Mail className="h-4 w-4" />
          Email verification required
        </span>

        <span className="rounded-md bg-muted px-2 py-1 text-xs text-muted-foreground">
          unverified
        </span>
      </AlertTitle>

      <AlertDescription className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          Verify your email address to secure your account and access all
          features.
        </p>

        <Button
          size="sm"
          variant="outline"
          onClick={handleVerifyEmail}
          disabled={cooldown > 0}
          className="min-w-35"
        >
          {cooldown > 0 ? `Resend in ${cooldown}s` : "Verify Email"}
        </Button>
      </AlertDescription>
    </Alert>
  );
}

export default EmailVerification;