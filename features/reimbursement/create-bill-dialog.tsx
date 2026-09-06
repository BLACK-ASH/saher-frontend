"use client";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Image from "next/image";
import { X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field, FieldLabel, FieldError } from "@/components/ui/field";
import BulkImageUpload from "@/components/bulk-image-upload";
import { userBillCreateSchema, type UserBillCreateInput } from "@/services/reimbursement.api";
import { useReimbursement } from "@/hooks/use-reimbursement";
import { toast } from "sonner";
import { dateToIstDateOnly } from "@/lib/date";

interface CreateBillDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// server-returned receipts keep their src so the form can preview what's attached
type AttachedReceipt = { id: string; src: string };

export function CreateBillDialog({ open, onOpenChange }: CreateBillDialogProps) {
  const { createBill } = useReimbursement();

  const [attached, setAttached] = useState<AttachedReceipt[]>([]);

  const form = useForm<UserBillCreateInput>({
    resolver: zodResolver(userBillCreateSchema),
    defaultValues: {
      amount: 0,
      description: "",
      date: dateToIstDateOnly(new Date()),
      images: [],
    },
  });

  const detachReceipt = (id: string) => {
    setAttached((prev) => prev.filter((r) => r.id !== id));
    form.setValue(
      "images",
      (form.getValues("images") ?? []).filter((i) => i !== id),
    );
  };

  const onSubmit = async (data: UserBillCreateInput) => {
    try {
      await createBill.mutateAsync(data);
      toast.success("Bill submitted");
      setAttached([]);
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
                  <BulkImageUpload
                    maxFiles={10}
                    onUploadSuccess={(imgList) => {
                      const receipts = imgList.map((img) => ({ id: img.id, src: img.src }));
                      setAttached((prev) => [...prev, ...receipts]);
                      field.onChange([
                        ...field.value,
                        ...receipts.map((r) => r.id),
                      ]);
                    }}
                  />

                  {attached.length > 0 && (
                    <div className="grid grid-cols-2 gap-3">
                      {attached.map((r) => (
                        <div
                          key={r.id}
                          className="relative aspect-video overflow-hidden rounded-lg border"
                        >
                          <Image src={r.src} alt="Receipt" fill className="object-cover" />
                          <button
                            type="button"
                            aria-label="Remove receipt"
                            className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white"
                            onClick={() => detachReceipt(r.id)}
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <p className="text-xs text-muted-foreground">
                    {attached.length > 0
                      ? `${attached.length} receipt${attached.length > 1 ? "s" : ""} attached`
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