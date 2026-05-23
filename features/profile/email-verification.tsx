import { useEffect, useState } from "react";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api-wrapper";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

type Props = {};

function EmailVerification({}: Props) {
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

  return (
    <Alert className="border-border bg-muted/40">
      <AlertTitle className="flex items-center justify-between text-sm font-medium">
        <span>Email verification required</span>

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
