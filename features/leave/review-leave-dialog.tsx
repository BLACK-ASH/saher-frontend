"use client";

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

import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

import { Label } from "@/components/ui/label";

import { LeaveT, reviewLeaveSchema, ReviewLeaveType } from "@/services/leave.api";

import { useLeave } from "@/hooks/use-leave";

import { toast } from "sonner";

type Props = {
  leave?: LeaveT;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export default function ReviewLeaveDialog({
  leave,
  open,
  onOpenChange,
}: Props) {
  const { review } = useLeave();

  const form = useForm<ReviewLeaveType>({
    resolver: zodResolver(reviewLeaveSchema),

    defaultValues: {
      status: "approved",
      managerComment: "",
    },
  });

  const onSubmit = (values: ReviewLeaveType) => {
    if (!leave) return;

    review.mutate(
      {
        id: leave.id,
        data: values,
      },
      {
        onSuccess: () => {
          toast.success("Leave updated successfully");

          onOpenChange(false);

          form.reset();
        },
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Review Leave Application</DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
          <div className="rounded-lg border p-4 space-y-2">
            <p className="font-semibold">{leave?.type.name}</p>

            <p className="text-sm text-muted-foreground">{leave?.reason}</p>
          </div>

          <Controller
            name="status"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field>
                <FieldLabel>Decision</FieldLabel>

                <RadioGroup
                  value={field.value}
                  onValueChange={field.onChange}
                  className="flex gap-6"
                >
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="approved" id="approved" />

                    <Label htmlFor="approved">Approve</Label>
                  </div>

                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="rejected" id="rejected" />

                    <Label htmlFor="rejected">Reject</Label>
                  </div>
                </RadioGroup>

                {fieldState.error && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />

          <Controller
            name="managerComment"
            control={form.control}
            render={({ field }) => (
              <Field>
                <FieldLabel>Manager Comment</FieldLabel>

                <Textarea {...field} placeholder="Add comment..." rows={4} />
              </Field>
            )}
          />

          <Button type="submit" disabled={review.isPending} className="w-full">
            {review.isPending ? "Updating..." : "Submit Decision"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
