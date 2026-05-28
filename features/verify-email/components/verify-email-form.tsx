"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useRouter, useSearchParams } from "next/navigation";
import { apiFetch } from "@/lib/api-wrapper";
import { toast } from "sonner";
import { Spinner } from "@/components/ui/spinner";
import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";

export function VerifyEmailForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");
  const queryClient = useQueryClient();

  useEffect(() => {
    const onSubmit = async () => {
      const res = await apiFetch(`/api/auth/verify-email/confirm/`, {
        method: "POST",
        body: JSON.stringify({ token }),
      });

      if (!res.success) {
        toast.error(res.message);
      }
      toast.success(res.message);
      queryClient.invalidateQueries({ queryKey: ["user"] });
      router.push("/");
    };
    onSubmit();
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Email Verification</CardTitle>
        <CardDescription>
          Email Is In Process This May Take A Moment.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Spinner className="size-8 mx-auto my-4" />
      </CardContent>
    </Card>
  );
}
