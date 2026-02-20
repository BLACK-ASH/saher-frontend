"use client"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import Image from "next/image"
import { useState } from "react"
import { Eye, EyeOffIcon } from "lucide-react"
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from "@/components/ui/input-group"
import { z } from "zod"
import { Controller, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {

  const [visible, setVisible] = useState<boolean>(false)

  const loginFromSchema = z.object({
    email: z.email(),
    password: z.string().min(4, "Minimun 4 Characrters Required.")
  })

  const form = useForm<z.infer<typeof loginFromSchema>>({
    resolver: zodResolver(loginFromSchema),
  })

  const onLoginSubmit = async (data: z.infer<typeof loginFromSchema>) => {
    console.log(data)
    alert(JSON.stringify(data))
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <form onSubmit={form.handleSubmit(onLoginSubmit)}>
        <FieldGroup>
          <div className="flex flex-col items-center gap-2 text-center">
            <a
              href="#"
              className="flex flex-col items-center gap-2 font-medium"
            >
              <div className="flex items-center justify-center rounded-md">
                <Image src={"/saher-logo.png"} alt="saher-logo" width={150} height={150} />
              </div>
              <span className="sr-only">Saher India.</span>
            </a>
            <h1 className="text-xl font-bold">Welcome to <span className="text-primary">Saher</span> India.</h1>
          </div>
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
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
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
                      onClick={() => setVisible(prev => !prev)}
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
            <Button type="submit">Login</Button>
          </Field>
        </FieldGroup>
      </form>
    </div>
  )
}
