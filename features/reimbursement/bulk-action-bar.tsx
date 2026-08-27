"use client";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

import { Field, FieldLabel, FieldError } from "@/components/ui/field";

import { Progress } from "@/components/ui/progress";

import { CheckCircle2, XCircle, X } from "lucide-react";

import { handleBillInputSchema, HandleBillInput } from "@/services/reimbursement.api";

interface BulkActionBarProps {
  count: number;
  bulkProgress: { done: number; total: number } | null;
  onAction: (status: "accept" | "reject", reason: string) => void;
  onClear: () => void;
}

export function BulkActionBar({ count, bulkProgress, onAction, onClear }: BulkActionBarProps) {
  const [sharedReasonOpen, setSharedReasonOpen] = useState<"accept" | "reject" | null>(null);

  const form = useForm<HandleBillInput>({
    resolver: zodResolver(handleBillInputSchema),
    defaultValues: { status: "accept", reason: "" },
  });

  const handleConfirm = (status: "accept" | "reject") => (values: HandleBillInput) => {
    onAction(status, values.reason);
    setSharedReasonOpen(null);
    form.reset({ status, reason: "" });
  };

  const openSharedReason = (status: "accept" | "reject") => {
    form.reset({ status, reason: "" });
    setSharedReasonOpen(status);
  };

  if (count === 0 && !bulkProgress) return null;

  if (bulkProgress) {
    const progress = (bulkProgress.done / bulkProgress.total) * 100;
    return (
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-md">
        <div className="bg-card border rounded-lg shadow-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="font-medium">Processing {bulkProgress.done}/{bulkProgress.total}…</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-md">
      <div className="bg-card border rounded-lg shadow-lg p-4 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="font-medium">{count} selected</span>
          <Button variant="ghost" size="icon" onClick={onClear} aria-label="Clear selection">
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => openSharedReason("accept")} className="flex-1 gap-2">
            <CheckCircle2 className="h-4 w-4" />
            Approve All
          </Button>
          <Button variant="destructive" onClick={() => openSharedReason("reject")} className="flex-1 gap-2">
            <XCircle className="h-4 w-4" />
            Reject All
          </Button>
        </div>
      </div>

      <Dialog open={sharedReasonOpen !== null} onOpenChange={(open) => !open && setSharedReasonOpen(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{sharedReasonOpen === "accept" ? "Approve All" : "Reject All"} ({count} bills)</DialogTitle>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(handleConfirm(sharedReasonOpen!))} className="space-y-4">
            <Controller
              name="reason"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field>
                  <FieldLabel>Notes (applied to all)</FieldLabel>
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
            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" onClick={() => setSharedReasonOpen(null)}>Cancel</Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? "Processing…" : sharedReasonOpen === "accept" ? "Approve All" : "Reject All"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}