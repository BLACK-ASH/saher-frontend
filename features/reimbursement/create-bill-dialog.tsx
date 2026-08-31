"use client";

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field, FieldLabel, FieldError } from "@/components/ui/field";
import ImageUpload from "@/components/image-upload";
import { userBillCreateSchema, type UserBillCreateInput } from "@/services/reimbursement.api";
import { useReimbursement } from "@/hooks/use-reimbursement";
import { toast } from "sonner";
import { dateToIstDateOnly } from "@/lib/date";

interface CreateBillDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateBillDialog({ open, onOpenChange }: CreateBillDialogProps) {
  const { createBill } = useReimbursement();

  const form = useForm<UserBillCreateInput>({
    resolver: zodResolver(userBillCreateSchema),
    defaultValues: {
      amount: 0,
      description: "",
      date: dateToIstDateOnly(new Date()),
      images: [],
    },
  });

  const attachedImages = form.watch("images") ?? [];

  const onSubmit = async (data: UserBillCreateInput) => {
    try {
      await createBill.mutateAsync(data);
      toast.success("Bill submitted");
      onOpenChange(false);
      form.reset();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to submit bill";
      toast.error(message);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Bill</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <Field>
            <FieldLabel>Amount</FieldLabel>
            <Controller
              name="amount"
              control={form.control}
              render={({ field }) => (
                <Input
                  type="number"
                  {...field}
                  onChange={(e) => field.onChange(e.target.valueAsNumber || 0)}
                  aria-invalid={!!form.formState.errors.amount}
                />
              )}
            />
            <FieldError errors={[form.formState.errors.amount]} />
          </Field>

          <Field>
            <FieldLabel>Description</FieldLabel>
            <Controller
              name="description"
              control={form.control}
              render={({ field }) => (
                <Textarea {...field} aria-invalid={!!form.formState.errors.description} />
              )}
            />
            <FieldError errors={[form.formState.errors.description]} />
          </Field>

          <Field>
            <FieldLabel>Date</FieldLabel>
            <Controller
              name="date"
              control={form.control}
              render={({ field }) => (
                <Input type="date" {...field} aria-invalid={!!form.formState.errors.date} />
              )}
            />
            <FieldError errors={[form.formState.errors.date]} />
          </Field>

          <Field>
            <FieldLabel>Receipt Images</FieldLabel>
            <Controller
              name="images"
              control={form.control}
              render={({ field }) => (
                <>
                  <ImageUpload
                    altName="bill-receipt"
                    onUploadSuccess={(img) => field.onChange([...field.value, img.id])}
                  />
                  <p className="text-xs text-muted-foreground">
                    {attachedImages.length > 0
                      ? `${attachedImages.length} receipt${attachedImages.length > 1 ? "s" : ""} attached`
                      : "Upload at least one receipt"}
                  </p>
                </>
              )}
            />
            <FieldError errors={[form.formState.errors.images]} />
          </Field>

          <Button type="submit" disabled={createBill.isPending} className="w-full">
            {createBill.isPending ? "Submitting…" : "Submit"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}