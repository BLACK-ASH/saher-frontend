"use client";

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";

import { bankDetailSchema } from "@/features/register/register-schema";
import type { z } from "zod";
import { useBankMutations } from "@/hooks/use-admin";
import type { BankT } from "@/hooks/use-profile";
import { can } from "@/lib/permissions";
import RoleAccess from "@/components/role-access";
import { toast } from "sonner";

// Masking util (ADMN-04, T-06-02-01): full accountNumber arrives unmasked on
// every account/bank read. Apply maskAccount to EVERY non-editing render; the
// raw value appears only inside the bank edit input.
export const maskAccount = (num: string): string =>
  num.length > 4 ? `•••• ${num.slice(-4)}` : "••••";

type BankFormValues = z.infer<typeof bankDetailSchema>;

// Bank create/edit form (ADMN-04). Manager-only: gated on
// can(role, "write" | "update", "bank") — admins hold bank:read only and see
// no write affordances (Pitfall 2). Edit mode prefills the FULL accountNumber
// (the edit input is the one place the raw number appears); every other render
// must go through maskAccount.
//
// Create mode: sends createBank(data). In practice the employee page always
// passes an existing bank (accounts are created atomically with a bank, and no
// bank-delete exists), so create mode is only reachable when bank is absent —
// POST /api/admin/bank would otherwise create an orphaned, unlinked document.
type Props = {
  bank?: BankT | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function BankDetailForm({ bank, open, onOpenChange }: Props) {
  const { createBank, updateBank } = useBankMutations();
  const isEdit = !!bank;

  const form = useForm<BankFormValues>({
    resolver: zodResolver(bankDetailSchema),
    defaultValues: {
      accountHolderName: "",
      bankName: "",
      accountNumber: "",
      ifcs: "",
      branch: "",
      mobileNumber: "",
    },
  });

  useEffect(() => {
    if (open) {
      form.reset(
        bank
          ? {
              accountHolderName: bank.accountHolderName,
              bankName: bank.bankName,
              accountNumber: bank.accountNumber,
              ifcs: bank.ifcs,
              branch: bank.branch,
              mobileNumber: bank.mobileNumber,
            }
          : {
              accountHolderName: "",
              bankName: "",
              accountNumber: "",
              ifcs: "",
              branch: "",
              mobileNumber: "",
            },
      );
    }
  }, [open, bank, form]);

  const onSubmit = (values: BankFormValues) => {
    const done = () => {
      toast.success(isEdit ? "Bank details updated" : "Bank details added");
      onOpenChange(false);
      form.reset();
    };
    const onError = (err: Error) => toast.error(err.message);

    if (isEdit && bank) {
      updateBank.mutate({ id: bank.id, data: values }, { onSuccess: done, onError });
    } else {
      createBank.mutate(values, { onSuccess: done, onError });
    }
  };

  const pending = isEdit ? updateBank.isPending : createBank.isPending;

  return (
    <RoleAccess
      allow={(r) => can(r, "write", "bank") || can(r, "update", "bank")}
      fallback={null}
    >
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {isEdit ? "Edit Bank Details" : "Add Bank Details"}
            </DialogTitle>
            <p className="text-sm text-muted-foreground">
              Bank details can only be changed by managers.
            </p>
          </DialogHeader>

          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            <Controller
              name="accountHolderName"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="bank-account-holder">
                    Account Holder Name
                  </FieldLabel>
                  <Input
                    {...field}
                    id="bank-account-holder"
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
              name="accountNumber"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="bank-account-number">
                    Account Number
                  </FieldLabel>
                  <Input
                    {...field}
                    id="bank-account-number"
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
              name="bankName"
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
              name="branch"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="bank-branch">Branch Name</FieldLabel>
                  <Input
                    {...field}
                    id="bank-branch"
                    placeholder="jogeshwari - east"
                    aria-invalid={fieldState.invalid}
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
              name="ifcs"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="bank-ifcs">IFCS Code</FieldLabel>
                  <Input
                    {...field}
                    id="bank-ifcs"
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
              name="mobileNumber"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="bank-mobile">Mobile Number</FieldLabel>
                  <Input
                    {...field}
                    id="bank-mobile"
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

            <Button
              type="submit"
              disabled={pending}
              className="w-full"
            >
              {pending
                ? "Saving…"
                : isEdit
                  ? "Save Bank Details"
                  : "Add Bank Details"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </RoleAccess>
  );
}