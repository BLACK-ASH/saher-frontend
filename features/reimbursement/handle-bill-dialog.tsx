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

import { Field, FieldLabel, FieldError } from "@/components/ui/field";

import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

import { Label } from "@/components/ui/label";

import { BillResponse, handleBillInputSchema, HandleBillInput } from "@/services/reimbursement.api";
import { useReimbursement, HandleStatus } from "@/hooks/use-reimbursement";

import { toast } from "sonner";

type Props = {
  bill: BillResponse | null;
  initialStatus: HandleStatus;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export default function HandleBillDialog({
  bill,
  initialStatus,
  open,
  onOpenChange,
}: Props) {
  const { handleOne } = useReimbursement();

  const form = useForm<HandleBillInput>({
    resolver: zodResolver(handleBillInputSchema),

    defaultValues: {
      status: initialStatus,
      reason: "",
    },
  });

  // re-sync decision each time the dialog opens
  useEffect(() => {
    if (open) form.reset({ status: initialStatus, reason: "" });
  }, [open, initialStatus, form]);

  const onSubmit = (values: HandleBillInput) => {
    if (!bill) return;

    handleOne.mutate(
      {
        billId: bill.id,
        status: values.status,
        reason: values.reason,
      },
      {
        onSuccess: () => {
          onOpenChange(false);
          form.reset();
        },
        onError: (err: Error) => {
          toast.error(err.message);
        },
      },
    );
  };

  const statusVerb = {
    accept: "accepted",
    reject: "rejected",
    "on-hold": "put on hold",
  } as const;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Handle Bill</DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
          {bill && (
            <div className="rounded-lg border p-4 space-y-2">
              <p className="font-semibold">{bill.description}</p>
              <p className="text-sm text-muted-foreground">
                User: {bill.user.slice(-6)} | Amount: ₹{bill.amount.toLocaleString()}
              </p>
            </div>
          )}

          <Controller
            name="status"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field>
                <FieldLabel>Decision</FieldLabel>

                <RadioGroup
                  value={field.value}
                  onValueChange={field.onChange}
                  className="flex flex-wrap gap-4"
                >
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="accept" id="status-accept" />
                    <Label htmlFor="status-accept">Accept</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="reject" id="status-reject" />
                    <Label htmlFor="status-reject">Reject</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="on-hold" id="status-hold" />
                    <Label htmlFor="status-hold">On Hold</Label>
                  </div>

                  {fieldState.error && <FieldError errors={[fieldState.error]} />}
                </RadioGroup>
              </Field>
            )}
          />

          <Controller
            name="reason"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field>
                <FieldLabel>Notes</FieldLabel>

                <Textarea
                  {...field}
                  placeholder="Enter notes (min 5 characters)..."
                  rows={4}
                  aria-invalid={fieldState.invalid}
                />
                {fieldState.error && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />

          <Button type="submit" disabled={handleOne.isPending} className="w-full">
            {handleOne.isPending ? "Processing…" : "Submit"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}