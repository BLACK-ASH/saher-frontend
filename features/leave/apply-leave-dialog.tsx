"use client";

import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

import { Field, FieldLabel, FieldError } from "@/components/ui/field";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import ImageUpload from "@/components/image-upload";

import { useLeave } from "@/hooks/use-leave";

import { toast } from "sonner";
import {
  applyLeaveSchema,
  ApplyLeaveType,
  LeaveT,
} from "@/services/leave.api";
import { dateToIstDateOnly } from "@/lib/date";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leave?: LeaveT;
};

export default function ApplyLeaveDialog({
  open,
  onOpenChange,
  leave,
}: Props) {
  const { leaveTypes, balance, apply, updateApplication } = useLeave();

  const [overlapError, setOverlapError] = useState<string | null>(null);

  const form = useForm<ApplyLeaveType>({
    resolver: zodResolver(applyLeaveSchema),

    defaultValues: {
      type: "",
      startDate: "",
      endDate: "",
      reason: "",
      proof: undefined,
    },
  });

  // 🔥 pre-fill on edit, clear on create

  useEffect(() => {
    if (leave) {
      form.reset({
        type: leave.type.code,

        startDate: dateToIstDateOnly(new Date(leave.startDate)),

        endDate: dateToIstDateOnly(new Date(leave.endDate)),

        reason: leave.reason,

        proof: leave.proof || undefined,
      });
    } else {
      form.reset({
        type: "",
        startDate: "",
        endDate: "",
        reason: "",
        proof: undefined,
      });
    }
  }, [leave, form]);

  const handleError = (err: Error) => {
    // Overlap errors surface inline below the dates; everything else toasts.

    if (err.message.toLowerCase().includes("overlap")) {
      setOverlapError(err.message);
    } else {
      toast.error(err.message);
    }
  };

  const onSubmit = (values: ApplyLeaveType) => {
    setOverlapError(null);

    if (leave) {
      updateApplication.mutate(
        { id: leave.id, data: values },
        {
          onSuccess: () => {
            toast.success("Leave updated successfully");

            form.reset();

            onOpenChange(false);

            setOverlapError(null);
          },

          onError: handleError,
        },
      );
    } else {
      apply.mutate(values, {
        onSuccess: () => {
          toast.success("Leave applied successfully");

          form.reset();

          onOpenChange(false);

          setOverlapError(null);
        },

        onError: handleError,
      });
    }
  };

  const isPending = apply.isPending || updateApplication.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>
            {leave ? "Edit Leave Application" : "Apply For Leave"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
          {/* Balance */}

          {balance.data && (
            <div className="grid gap-3 sm:grid-cols-3">
              {Object.entries(balance.data.balance).map(([key, value]) => (
                <div key={key} className="rounded-lg border p-3">
                  <p className="text-sm font-medium capitalize">{key}</p>

                  <Badge variant="secondary">{value.remaining} Left</Badge>
                </div>
              ))}
            </div>
          )}

          {/* Leave Type */}

          <Controller
            name="type"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field>
                <FieldLabel>Leave Type</FieldLabel>

                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select leave type" />
                  </SelectTrigger>

                  <SelectContent>
                    {leaveTypes.data?.map((leave) => (
                      <SelectItem key={leave.code} value={leave.code}>
                        {leave.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {fieldState.error && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />

          {/* Dates */}

          <div className="grid gap-4 md:grid-cols-2">
            <Controller
              name="startDate"
              control={form.control}
              render={({ field }) => (
                <Field>
                  <FieldLabel>Start Date</FieldLabel>

                  <Input type="date" {...field} />
                </Field>
              )}
            />

            <Controller
              name="endDate"
              control={form.control}
              render={({ field }) => (
                <Field>
                  <FieldLabel>End Date</FieldLabel>

                  <Input type="date" {...field} />
                </Field>
              )}
            />
          </div>

          {overlapError && (
            <p className="text-sm text-destructive">{overlapError}</p>
          )}

          {/* Reason */}

          <Controller
            name="reason"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field>
                <FieldLabel>Reason</FieldLabel>

                <Textarea {...field} placeholder="Reason for leave" rows={5} />

                {fieldState.error && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />

          {/* Proof */}

          <Controller
            name="proof"
            control={form.control}
            render={({ field }) => (
              <Field>
                <FieldLabel>Proof Document (optional)</FieldLabel>

                <ImageUpload
                  altName="leave-proof"
                  url={field.value}
                  onUploadSuccess={(file) => field.onChange(file.src)}
                />
              </Field>
            )}
          />

          <Button type="submit" disabled={isPending} className="w-full">
            {isPending
              ? "Submitting..."
              : leave
                ? "Update Application"
                : "Apply Leave"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
