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
import { Label } from "@/components/ui/label";

import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

import { Field, FieldLabel, FieldError } from "@/components/ui/field";

import { Progress } from "@/components/ui/progress";

import { PayrollResponse, payInstallmentSchema, PayInstallmentInput } from "@/services/payroll.api";
import { usePayroll } from "@/hooks/use-payroll";

import { toast } from "sonner";

type Props = {
  payroll: PayrollResponse | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export default function RecordPaymentDialog({
  payroll,
  open,
  onOpenChange,
}: Props) {
  const { pay } = usePayroll(0, 0);

  const form = useForm<PayInstallmentInput>({
    resolver: zodResolver(payInstallmentSchema),

    defaultValues: {
      mode: "cash",
      paidSalary: 0,
    },
  });

  // re-sync form each time dialog opens
  useEffect(() => {
    if (open) form.reset({ mode: "cash", paidSalary: 0 });
  }, [open, form]);

  const onSubmit = (values: PayInstallmentInput) => {
    if (!payroll) return;

    pay.mutate(
      {
        id: payroll.id,
        data: values,
      },
      {
        onSuccess: () => {
          toast.success("Payment recorded");

          onOpenChange(false);

          form.reset();
        },
        onError: (err: Error) => {
          toast.error(err.message);
        },
      },
    );
  };

  const progress = payroll
    ? Math.min(Math.max((payroll.paidSalary / payroll.expectedSalary) * 100, 0), 100)
    : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Record Payment</DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
          {payroll && (
            <div className="rounded-lg border p-4 space-y-2">
              <p className="font-semibold">Employee: {payroll.employeeId}</p>
              <p className="text-sm text-muted-foreground">
                Expected: ₹{payroll.expectedSalary.toLocaleString()}
              </p>
              <p className="text-sm text-muted-foreground">
                Already Paid: ₹{payroll.paidSalary.toLocaleString()}
              </p>
              <Progress value={progress} className="h-2" />
              <p className="text-xs text-muted-foreground">
                {Math.round(progress)}% paid
              </p>
            </div>
          )}

          <Controller
            name="mode"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field>
                <FieldLabel>Payment Mode</FieldLabel>

                <RadioGroup
                  value={field.value}
                  onValueChange={field.onChange}
                  className="flex flex-wrap gap-4"
                >
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="cash" id="mode-cash" />
                    <Label htmlFor="mode-cash">Cash</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="cheque" id="mode-cheque" />
                    <Label htmlFor="mode-cheque">Cheque</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="upi" id="mode-upi" />
                    <Label htmlFor="mode-upi">UPI</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="-" id="mode-other" />
                    <Label htmlFor="mode-other">Other</Label>
                  </div>

{fieldState.error && <FieldError errors={[fieldState.error]} />}
                </RadioGroup>
              </Field>
            )}
          />

          <Controller
            name="paidSalary"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field>
                <FieldLabel>Payment Amount (this installment)</FieldLabel>

                <Input
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="Enter amount"
                  {...field}
                  onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                  aria-invalid={fieldState.invalid}
                />
                <p className="text-xs text-muted-foreground">
                  This is the incremental amount for this installment. Backend adds it to prior paid.
                </p>

                {fieldState.error && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />

          <Button type="submit" disabled={pay.isPending} className="w-full">
            {pay.isPending ? "Recording…" : "Record Payment"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}