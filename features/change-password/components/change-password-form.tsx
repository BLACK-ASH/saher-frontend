"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import Image from "next/image";
import { useState } from "react";
import { Eye, EyeOffIcon } from "lucide-react";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
import { z } from "zod";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { apiFetch } from "@/lib/api-wrapper";

export function ForgotPasswordForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const [visible, setVisible] = useState<boolean>(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const changePasswordSchema = z
    .object({
      password: z.string().min(4, "Minimum 4 Characters Required."),
      confirmPassword: z.string().min(4, "Minimum 4 Characters Required."),
      token: z.string(),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: "Passwords do not match",
      path: ["confirmPassword"], // 👈 show error under confirmPassword
    });

  const form = useForm<z.infer<typeof changePasswordSchema>>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
      token: "",
    },
  });

  const onSubmit = async (data: z.infer<typeof changePasswordSchema>) => {
    const res = await apiFetch(`/api/auth/change-password/confirm/`, {
      method: "POST",
      body: JSON.stringify({ ...data, token }),
    });

    if (!res.success) {
      toast.error(res.message);
    }
    toast.success(res.message);
    router.push("/login");
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <FieldGroup>
          <div className="flex flex-col items-center gap-2 text-center">
            <a
              href="/"
              className="flex flex-col items-center gap-2 font-medium"
            >
              <div className="flex items-center justify-center rounded-md">
                <Image
                  src={"/saher-logo.png"}
                  alt="saher-logo"
                  width={150}
                  height={150}
                />
              </div>
              <span className="sr-only">SAHER India.</span>
            </a>
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Forgot Password</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <Controller
                name="password"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor={field.name}>Password</FieldLabel>

                    <InputGroup>
                      <InputGroupInput
                        {...field}
                        id={field.name}
                        type={visible ? "text" : "password"}
                        placeholder="Enter password"
                        aria-invalid={fieldState.invalid}
                      />

                      <InputGroupAddon align="inline-end">
                        <InputGroupButton
                          type="button"
                          size="icon-xs"
                          onClick={() => setVisible((prev) => !prev)}
                        >
                          {visible ? <Eye /> : <EyeOffIcon />}
                        </InputGroupButton>
                      </InputGroupAddon>
                    </InputGroup>

                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
              <Controller
                name="confirmPassword"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor={field.name}>
                      Confirm Password
                    </FieldLabel>

                    <InputGroup>
                      <InputGroupInput
                        {...field}
                        id={field.name}
                        type={visible ? "text" : "password"}
                        placeholder="confirm password"
                        aria-invalid={fieldState.invalid}
                      />

                      <InputGroupAddon align="inline-end">
                        <InputGroupButton
                          type="button"
                          size="icon-xs"
                          onClick={() => setVisible((prev) => !prev)}
                        >
                          {visible ? <Eye /> : <EyeOffIcon />}
                        </InputGroupButton>
                      </InputGroupAddon>
                    </InputGroup>

                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
              <Field>
                <Button type="submit">Change Password</Button>
              </Field>
            </CardContent>
          </Card>
        </FieldGroup>
      </form>
    </div>
  );
}
