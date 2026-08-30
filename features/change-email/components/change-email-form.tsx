"use client";

import { Button } from "@/components/ui/button";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { z } from "zod";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
import { Loader2 } from "lucide-react";

export function ChangeEmailForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const emailChangeFormSchema = z.object({
    email: z.email(),
  });
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");

  const form = useForm<z.infer<typeof emailChangeFormSchema>>({
    resolver: zodResolver(emailChangeFormSchema),
    defaultValues: {
      email: "",
    },
  });

  const changeEmailMutation = useMutation({
    mutationFn: async (data: z.infer<typeof emailChangeFormSchema>) => {
      const res = await apiFetch(`/api/auth/change-email/confirm/`, {
        method: "POST",
        body: JSON.stringify({ ...data, token }),
      });
      if (!res.success) {
        throw new Error(res.message);
      }
      return res;
    },
    onSuccess: (res) => {
      toast.success(res.message);
      router.push("/");
    },
    onError: (error: Error) => {
      const message = error.message.toLowerCase();
      if (message.includes("token expired") || message.includes("invalid token")) {
        toast.error("This link has expired or is invalid. Please request a new email change link.");
      } else {
        toast.error(error.message);
      }
    },
  });

  const onSubmit = form.handleSubmit((data) => {
    changeEmailMutation.mutate(data);
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Change Email</CardTitle>
        <CardDescription>Enter New Email</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <form onSubmit={onSubmit}>
          <FieldGroup>
            <Controller
              name="email"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>Email</FieldLabel>
                  <Input
                    {...field}
                    id={field.name}
                    type="email"
                    placeholder="user@example.com"
                    aria-invalid={fieldState.invalid}
                    disabled={changeEmailMutation.isPending}
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
            <Field>
              <Button
                type="submit"
                disabled={changeEmailMutation.isPending}
              >
                {changeEmailMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  "Change Email"
                )}
              </Button>
            </Field>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  );
}