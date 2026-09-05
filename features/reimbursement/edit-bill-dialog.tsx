"use client";

import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field, FieldLabel, FieldError } from "@/components/ui/field";
import BulkImageUpload from "@/components/bulk-image-upload";
import { userBillUpdateSchema, type UserBillUpdateInput, type BillResponse } from "@/services/reimbursement.api";
import { useReimbursement } from "@/hooks/use-reimbursement";
import { toast } from "sonner";
import { formatIstDate } from "@/lib/date";

interface EditBillDialogProps {
  bill: BillResponse | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditBillDialog({ bill, open, onOpenChange }: EditBillDialogProps) {
  const { updateBill } = useReimbursement();

  const form = useForm<UserBillUpdateInput>({
    resolver: zodResolver(userBillUpdateSchema),
    defaultValues: {
      amount: 0,
      description: "",
      images: [],
    },
  });

  useEffect(() => {
    if (bill && open) {
      form.reset({
        amount: bill.amount,
        description: bill.description,
        images: bill.images.map((img) => img.id),
      });
    }
  }, [bill, open, form]);

  const attachedImages = form.watch("images") ?? [];

  if (!bill) return null;

  const onSubmit = async (data: UserBillUpdateInput) => {
    try {
      await updateBill.mutateAsync({ id: bill.id, data });
      toast.success("Bill updated");
      onOpenChange(false);
      form.reset();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to update bill";
      toast.error(message);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Bill</DialogTitle>
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
            <Input type="text" disabled value={formatIstDate(bill.date)} />
          </Field>

          <Field>
            <FieldLabel>Receipt Images</FieldLabel>
            <Controller
              name="images"
              control={form.control}
              render={({ field }) => (
                <>
                  <BulkImageUpload
                    maxFiles={10}
                    onUploadSuccess={(imgList) =>
                      field.onChange([
                        ...(field.value ?? []),
                        ...imgList.map((img) => img.id),
                      ])
                    }
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

          <Button type="submit" disabled={updateBill.isPending} className="w-full">
            {updateBill.isPending ? "Updating…" : "Update Bill"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
