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
import ImageUpload from "@/components/image-upload";
import { Field, FieldLabel, FieldError } from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { AccountT } from "@/hooks/use-profile";
import { useBankMutations } from "@/hooks/use-admin";
import {
  accountUpdateSchema,
  type AccountUpdateInput,
} from "@/services/admin.api";
import { dateToIstDateOnly } from "@/lib/date";
import { toast } from "sonner";

const genderOptions = ["male", "female", "other"] as const;
const employeeTypeOptions = [
  "free",
  "intern",
  "full-time",
  "part-time",
  "volunteer",
] as const;
const employeeShiftOptions = [
  { label: "9:00 AM - 1:00 PM", value: "shift-1" },
  { label: "2:00 PM - 6:00 PM", value: "shift-2" },
] as const;

type Props = {
  account: AccountT;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export default function AccountEditDialog({
  account,
  open,
  onOpenChange,
}: Props) {
  const { updateAccount } = useBankMutations();

  const form = useForm<AccountUpdateInput>({
    resolver: zodResolver(accountUpdateSchema),
    defaultValues: {
      gender: account.gender,
      dateOfBirth: dateToIstDateOnly(account.dateOfBirth),
      dateOfJoining: dateToIstDateOnly(account.dateOfJoining),
      phoneNumber: account.phoneNumber,
      secondaryPhoneNumber: account.secondaryPhoneNumber ?? "",
      employeeId: account.employeeId,
      department: account.department,
      designation: account.designation,
      employeeType: account.employeeType,
      employeeShift: account.employeeShift,
      salaryStructure: account.salaryStructure,
      address: account.address,
      aadhar: account.aadhar?.id,
      pan: account.pan?.id,
      resume: account.resume?.id,
    },
  });

  // Re-sync the form each time the dialog opens (fresh server values).
  useEffect(() => {
    if (open) {
      form.reset({
        gender: account.gender,
        dateOfBirth: dateToIstDateOnly(account.dateOfBirth),
        dateOfJoining: dateToIstDateOnly(account.dateOfJoining),
        phoneNumber: account.phoneNumber,
        secondaryPhoneNumber: account.secondaryPhoneNumber ?? "",
        employeeId: account.employeeId,
        department: account.department,
        designation: account.designation,
        employeeType: account.employeeType,
        employeeShift: account.employeeShift,
        salaryStructure: account.salaryStructure,
        address: account.address,
        aadhar: account.aadhar?.id,
        pan: account.pan?.id,
        resume: account.resume?.id,
      });
    }
  }, [open, account, form]);

  const employeeType = form.watch("employeeType");

  const onSubmit = (values: AccountUpdateInput) => {
    updateAccount.mutate(
      { id: account.id, data: values },
      {
        onSuccess: () => {
          toast.success("Account updated");
          onOpenChange(false);
          form.reset();
        },
        onError: (err: Error) => {
          toast.error(err.message);
        },
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Account</DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
          <Controller
            name="gender"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="account-gender">Gender</FieldLabel>
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
                  aria-invalid={fieldState.invalid}
                >
                  <SelectTrigger id="account-gender" className="w-full">
                    <SelectValue placeholder="Gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {genderOptions.map((g) => (
                        <SelectItem key={g} value={g}>
                          {g.toLocaleUpperCase()}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />

          <Controller
            name="dateOfBirth"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="account-dob">Date Of Birth</FieldLabel>
                <Input
                  type="date"
                  id="account-dob"
                  {...field}
                  aria-invalid={fieldState.invalid}
                />
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />

          <Controller
            name="dateOfJoining"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="account-doj">Date Of Joining</FieldLabel>
                <Input
                  type="date"
                  id="account-doj"
                  {...field}
                  aria-invalid={fieldState.invalid}
                />
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />

          <Controller
            name="phoneNumber"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="account-phone">Phone Number</FieldLabel>
                <Input
                  id="account-phone"
                  {...field}
                  aria-invalid={fieldState.invalid}
                />
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />

          <Controller
            name="secondaryPhoneNumber"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="account-phone2">
                  Secondary Phone Number (optional)
                </FieldLabel>
                <Input
                  id="account-phone2"
                  {...field}
                  aria-invalid={fieldState.invalid}
                />
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />

          <Controller
            name="employeeId"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="account-emp-id">Employee Id</FieldLabel>
                <Input
                  id="account-emp-id"
                  {...field}
                  aria-invalid={fieldState.invalid}
                />
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />

          <Controller
            name="department"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="account-dept">Department</FieldLabel>
                <Input
                  id="account-dept"
                  {...field}
                  aria-invalid={fieldState.invalid}
                />
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />

          <Controller
            name="designation"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="account-designation">Designation</FieldLabel>
                <Input
                  id="account-designation"
                  {...field}
                  aria-invalid={fieldState.invalid}
                />
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />

          <Controller
            name="employeeType"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="account-emp-type">Employee Type</FieldLabel>
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
                  aria-invalid={fieldState.invalid}
                >
                  <SelectTrigger id="account-emp-type" className="w-full">
                    <SelectValue placeholder="Employee Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {employeeTypeOptions.map((t) => (
                        <SelectItem key={t} value={t}>
                          {t.toLocaleUpperCase()}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />

          {employeeType === "part-time" && (
            <Controller
              name="employeeShift"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="account-shift">Employee Shift</FieldLabel>
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                    aria-invalid={fieldState.invalid}
                  >
                    <SelectTrigger id="account-shift" className="w-full">
                      <SelectValue placeholder="Select Shift" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {employeeShiftOptions.map((s) => (
                          <SelectItem key={s.value} value={s.value}>
                            {s.label}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
          )}

          <Controller
            name="salaryStructure"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="account-salary">
                  Salary Structure
                </FieldLabel>
                <Input
                  id="account-salary"
                  {...field}
                  aria-invalid={fieldState.invalid}
                />
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />

          <Controller
            name="address"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="account-address">Address</FieldLabel>
                <Input
                  id="account-address"
                  {...field}
                  aria-invalid={fieldState.invalid}
                />
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />

          <Field>
            <FieldLabel htmlFor="account-aadhar">Aadhar Card</FieldLabel>
            <ImageUpload
              altName={`aadhar-${account.employeeId}`}
              url={account.aadhar?.src}
              onUploadSuccess={(data) => form.setValue("aadhar", data.id)}
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="account-pan">Pan Card</FieldLabel>
            <ImageUpload
              altName={`pan-${account.employeeId}`}
              url={account.pan?.src}
              onUploadSuccess={(data) => form.setValue("pan", data.id)}
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="account-resume">Resume</FieldLabel>
            <ImageUpload
              altName={`resume-${account.employeeId}`}
              url={account.resume?.src}
              onUploadSuccess={(data) => form.setValue("resume", data.id)}
            />
          </Field>

          <Button
            type="submit"
            disabled={updateAccount.isPending}
            className="w-full"
          >
            {updateAccount.isPending ? "Saving…" : "Save Account"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}