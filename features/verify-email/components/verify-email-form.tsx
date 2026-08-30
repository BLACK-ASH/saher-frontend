"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useRouter, useSearchParams } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-wrapper";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, AlertCircle, CheckCircle } from "lucide-react";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";

export function VerifyEmailForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");
  const queryClient = useQueryClient();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const verifyEmailMutation = useMutation({
    mutationFn: async () => {
      const res = await apiFetch(`/api/auth/verify-email/confirm/`, {
        method: "POST",
        body: JSON.stringify({ token }),
      });
      if (!res.success) {
        throw new Error(res.message);
      }
      return res;
    },
    onSuccess: (res) => {
      toast.success(res.message);
      queryClient.invalidateQueries({ queryKey: ["user"] });
      router.push("/");
    },
    onError: (error: Error) => {
      const message = error.message.toLowerCase();
      if (message.includes("token expired") || message.includes("invalid token")) {
        setErrorMessage("This verification link has expired or is invalid.");
      } else {
        setErrorMessage(error.message);
      }
    },
  });

  const resendMutation = useMutation({
    mutationFn: async () => {
      const res = await apiFetch("/api/auth/verify-email/request", {
        method: "POST",
      });
      if (!res.success) {
        throw new Error(res.message);
      }
      return res;
    },
    onSuccess: (res) => {
      toast.success(res.message);
      setErrorMessage(null);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  if (verifyEmailMutation.isPending) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Email Verification</CardTitle>
          <CardDescription>Verifying your email...</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  if (errorMessage) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Email Verification</CardTitle>
          <CardDescription>Unable to verify email</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Verification Failed</AlertTitle>
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
          <Button
            variant="outline"
            onClick={() => resendMutation.mutate()}
            disabled={!token || resendMutation.isPending}
          >
            {resendMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending...
              </>
            ) : (
              "Resend Verification Email"
            )}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Email Verification</CardTitle>
        <CardDescription>Click the button below to verify your email address</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-center">
          <CheckCircle className="h-12 w-12 text-green-500" />
        </div>
        <Button
          onClick={() => verifyEmailMutation.mutate()}
          className="w-full"
          size="lg"
        >
          Verify Email
        </Button>
      </CardContent>
    </Card>
  );
}