"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
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
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useLogin } from "@/hooks/use-login";

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const [visible, setVisible] = useState<boolean>(false);
  const { mutate, isPending } = useLogin();
  const router = useRouter();

  const loginFromSchema = z.object({
    email: z.email(),
    password: z.string().min(4, "Minimun 4 Characters Required."),
  });

  const form = useForm<z.infer<typeof loginFromSchema>>({
    resolver: zodResolver(loginFromSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onLoginSubmit = async (data: z.infer<typeof loginFromSchema>) => {
    mutate(data, {
      onSuccess: (res) => {
        toast.success(res.message);
        router.refresh();
        router.push("/");
      },
      onError: (err: Error) => {
        toast.error(err.message);
      },
    });
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <form onSubmit={form.handleSubmit(onLoginSubmit)}>
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
              <h1 className="text-xl text-center font-bold">
                Welcome to <span className="text-primary">SAHER</span> India.
              </h1>
            </CardHeader>
            <CardContent className="space-y-6">
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
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
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
              <Field>
                <Button disabled={isPending} type="submit">
                  Login
                </Button>
              </Field>
            </CardContent>
          </Card>
        </FieldGroup>
      </form>
    </div>
  );
}
