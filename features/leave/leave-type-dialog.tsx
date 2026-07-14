"use client";

import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";

import { Field, FieldLabel, FieldError } from "@/components/ui/field";

import {
  createLeaveTypeSchema,
  CreateLeaveTypeType,
  LeaveTypeT,
} from "@/services/leave.api";

import { useLeave } from "@/hooks/use-leave";

import { toast } from "sonner";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leaveType?: LeaveTypeT;
};

export default function LeaveTypeDialog({
  open,
  onOpenChange,
  leaveType,
}: Props) {
  const { createType, updateType } = useLeave();

  const form = useForm<CreateLeaveTypeType>({
    resolver: zodResolver(createLeaveTypeSchema),

    defaultValues: {
      name: "",
      code: "",
      allocatedDays: 0,
      maxCarryForwardDays: 0,
      requiresProof: false,
      minDaysNotice: 0,
      description: "",
      isActive: true,
    },
  });

  useEffect(() => {
    if (leaveType) {
      form.reset({
        name: leaveType.name,

        code: leaveType.code,

        allocatedDays: leaveType.allocatedDays,

        maxCarryForwardDays: leaveType.maxCarryForwardDays,

        requiresProof: leaveType.requiresProof,

        minDaysNotice: leaveType.minDaysNotice,

        description: leaveType.description ?? "",

        isActive: true,
      });
    } else {
      form.reset();
    }
  }, [leaveType, form]);

  const submit = (values: CreateLeaveTypeType) => {
    if (leaveType) {
      updateType.mutate(
        {
          id: leaveType.id,
          data: values,
        },
        {
          onSuccess: (res) => {
            toast.success(res.message);

            onOpenChange(false);
          },
        },
      );
    } else {
      createType.mutate(values, {
        onSuccess: (res) => {
          toast.success(res.message);

          onOpenChange(false);
        },
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {leaveType ? "Update Leave Type" : "Create Leave Type"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(submit)} className="space-y-5">
          <Controller
            name="name"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field>
                <FieldLabel>Name</FieldLabel>

                <Input {...field} placeholder="Casual Leave" />

                {fieldState.error && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />

          <Controller
            name="code"
            control={form.control}
            render={({ field }) => (
              <Field>
                <FieldLabel>Code</FieldLabel>

                <Input {...field} placeholder="CL" disabled={!!leaveType} />
              </Field>
            )}
          />

          <div className="grid grid-cols-2 gap-4">
            <Controller
              name="allocatedDays"
              control={form.control}
              render={({ field }) => (
                <Field>
                  <FieldLabel>Allocated Days</FieldLabel>

                  <Input
                    type="number"
                    value={field.value}
                    onChange={(e) => field.onChange(Number(e.target.value))}
                  />
                </Field>
              )}
            />

            <Controller
              name="maxCarryForwardDays"
              control={form.control}
              render={({ field }) => (
                <Field>
                  <FieldLabel>Carry Forward</FieldLabel>

                  <Input
                    type="number"
                    value={field.value}
                    onChange={(e) => field.onChange(Number(e.target.value))}
                  />
                </Field>
              )}
            />
          </div>

          <Controller
            name="minDaysNotice"
            control={form.control}
            render={({ field }) => (
              <Field>
                <FieldLabel>Minimum Notice Days</FieldLabel>

                <Input
                  type="number"
                  value={field.value}
                  onChange={(e) => field.onChange(Number(e.target.value))}
                />
              </Field>
            )}
          />

          <Controller
            name="requiresProof"
            control={form.control}
            render={({ field }) => (
              <div className="flex items-center gap-3">
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />

                <FieldLabel>Requires Proof</FieldLabel>
              </div>
            )}
          />

          <Controller
            name="isActive"
            control={form.control}
            render={({ field }) => (
              <div className="flex items-center gap-3">
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />

                <FieldLabel>Active Status</FieldLabel>
              </div>
            )}
          />

          <Controller
            name="description"
            control={form.control}
            render={({ field }) => (
              <Field>
                <FieldLabel>Description</FieldLabel>

                <Textarea {...field} placeholder="Leave description..." />
              </Field>
            )}
          />

          <Button
            className="w-full"
            type="submit"
            disabled={createType.isPending || updateType.isPending}
          >
            {leaveType ? "Update" : "Create"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
