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
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Field, FieldLabel, FieldError } from "@/components/ui/field";

import { SettlementResponse, settleInputSchema, SettleInput } from "@/services/reimbursement.api";
import { useReimbursement } from "@/hooks/use-reimbursement";
import { formatIstDate } from "@/lib/date";

import { toast } from "sonner";

type Props = {
  settlement: SettlementResponse | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function SettleDialog({ settlement, open, onOpenChange }: Props) {
  const { settle } = useReimbursement();

  const form = useForm<SettleInput>({
    resolver: zodResolver(settleInputSchema),
    defaultValues: {
      mode: "cash",
      status: "settle",
      description: "",
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        mode: "cash",
        status: "settle",
        description: "",
      });
    }
  }, [open, form]);

  const onSubmit = (values: SettleInput) => {
    if (!settlement) return;

    settle.mutate(
      { settleId: settlement.id, input: values },
      {
        onSuccess: () => {
          toast.success(`Settled via ${values.mode === "-" ? "Other" : values.mode}`);
          onOpenChange(false);
          form.reset();
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Record Settlement</DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
          {settlement && (
            <div className="rounded-lg border p-4 space-y-2">
              <p className="font-semibold">
                Amount: ₹{settlement.amount.toLocaleString()}
              </p>
              <p className="text-sm text-muted-foreground">
                Expiry: {formatIstDate(settlement.expiredAt)}
              </p>
            </div>
          )}

          <Controller
            name="mode"
            control={form.control}
            render={({ field }) => (
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
                </RadioGroup>
              </Field>
            )}
          />

          <Controller
            name="description"
            control={form.control}
            render={({ field }) => (
              <Field>
                <FieldLabel>Description (Optional)</FieldLabel>
                <Textarea
                  {...field}
                  placeholder="Add description..."
                  rows={3}
                />
              </Field>
            )}
          />

          <Button type="submit" disabled={settle.isPending} className="w-full">
            {settle.isPending ? "Recording…" : "Complete Settlement"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}