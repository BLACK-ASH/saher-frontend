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
import { Textarea } from "@/components/ui/textarea";

import { Field, FieldLabel, FieldError } from "@/components/ui/field";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { useLeave } from "@/hooks/use-leave";

import { toast } from "sonner";
import { applyLeaveSchema, ApplyLeaveType } from "@/services/leave.api";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export default function ApplyLeaveDialog({ open, onOpenChange }: Props) {
  const { leaveTypes, apply } = useLeave();

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

  const onSubmit = (values: ApplyLeaveType) => {
    apply.mutate(values, {
      onSuccess: () => {
        toast.success("Leave applied successfully");

        form.reset();

        onOpenChange(false);
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Apply For Leave</DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
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
                <FieldLabel>Proof</FieldLabel>

                <Input
                  type="text"
                  placeholder="Upload file id"
                  value={field.value ?? ""}
                  onChange={field.onChange}
                />
              </Field>
            )}
          />

          <Button type="submit" disabled={apply.isPending} className="w-full">
            {apply.isPending ? "Submitting..." : "Apply Leave"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
