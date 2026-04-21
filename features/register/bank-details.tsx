"use client";

import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Controller, UseFormReturn } from "react-hook-form";
import { RegisterFormData } from "./register-schema";
import { Input } from "@/components/ui/input";

const BankDetail = ({ form }: { form: UseFormReturn<RegisterFormData> }) => {
  /*
      "bank.accountHolderName",
      "bank.branch",
      "bank.bankName",
      "bank.ifcs",
      "bank.mobileNumber",
  */

  return (
    <Card className="min-w-full sm:max-w-md">
      <CardHeader>
        <CardTitle>Bank Details</CardTitle>
      </CardHeader>
      <CardContent className="flex max-md:flex-col flex-row ">
        <FieldGroup>
          <Controller
            name="bank.accountHolderName"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="account-holder-name">
                  Account Holder Name
                </FieldLabel>
                <Input
                  {...field}
                  id="account-holder-name"
                  aria-invalid={fieldState.invalid}
                  placeholder="Enter Account Holder Name"
                  autoComplete="off"
                />
                <FieldDescription>
                  Account Holder Name Must Be As Per Bank Passbook
                </FieldDescription>
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />

          <Controller
            name="bank.accountNumber"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="account-holder-name">
                  Account Number
                </FieldLabel>
                <Input
                  {...field}
                  id="account-holder-name"
                  aria-invalid={fieldState.invalid}
                  placeholder="Enter Account Number"
                  autoComplete="off"
                />
                <FieldDescription>
                  Account Number Must Be As Per Bank Passbook
                </FieldDescription>
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />

          <Controller
            name="bank.bankName"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="bank-name">Bank Name</FieldLabel>
                <Input
                  {...field}
                  id="bank-name"
                  placeholder="rbi bank"
                  aria-invalid={fieldState.invalid}
                  autoComplete="off"
                />
                <FieldDescription>Account Holder Bank Name</FieldDescription>
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />

          <Controller
            name="bank.branch"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="phone-number">Branch Name</FieldLabel>
                <Input
                  {...field}
                  id="branch-name"
                  aria-invalid={fieldState.invalid}
                  placeholder="jogeshwari - east"
                  autoComplete="off"
                />
                <FieldDescription>Account Holder Branch Name</FieldDescription>
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />

          <Controller
            name="bank.ifcs"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="ifcs">IFCS Code</FieldLabel>
                <Input
                  {...field}
                  id="ifcs"
                  aria-invalid={fieldState.invalid}
                  autoComplete="off"
                />
                <FieldDescription>Account Holder IFCS Code</FieldDescription>
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />

          <Controller
            name="bank.mobileNumber"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="mobile-number">Mobile Number</FieldLabel>
                <Input
                  {...field}
                  id="mobile-number"
                  aria-invalid={fieldState.invalid}
                  autoComplete="off"
                />
                <FieldDescription>
                  Account Holder Mobile Number As Per Bank
                </FieldDescription>
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />
        </FieldGroup>
      </CardContent>
      <CardFooter></CardFooter>
    </Card>
  );
};

export default BankDetail;
