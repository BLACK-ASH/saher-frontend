"use client";

import { useState } from "react";
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
import { Field, FieldLabel, FieldError } from "@/components/ui/field";
import { UserSearchPicker } from "@/components/user-search-picker";

import { 
  adminBillCreateSchema, 
  AdminBillCreateInput,
  adminBillUpdateSchema,
  AdminBillUpdateInput 
} from "@/services/reimbursement.api";
import { useReimbursement } from "@/hooks/use-reimbursement";
import { dateToIstDateOnly } from "@/lib/date";
import { toast } from "sonner";

type Props = {
  mode: "create" | "edit";
  initialData?: AdminBillCreateInput & { id: string; user: string };
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function AdvanceBillDialog({ mode, initialData, open, onOpenChange }: Props) {
  const { createAdvance, updateAdvance } = useReimbursement();
  const [selectedUserId, setSelectedUserId] = useState<string | null>(initialData?.user || null);

  const form = useForm<AdminBillCreateInput | AdminBillUpdateInput>({
    resolver: zodResolver(mode === "create" ? adminBillCreateSchema : adminBillUpdateSchema),
    defaultValues: {
      advance: initialData?.advance || 0,
      date: initialData?.date ? dateToIstDateOnly(new Date(initialData.date)) : dateToIstDateOnly(new Date()),
      description: initialData?.description || "",
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        advance: initialData?.advance || 0,
        date: initialData?.date ? dateToIstDateOnly(new Date(initialData.date)) : dateToIstDateOnly(new Date()),
        description: initialData?.description || "",
      });
      setSelectedUserId(initialData?.user || null);
    }
  }, [open, form, initialData]);

  const onSubmit = (data: AdminBillCreateInput | AdminBillUpdateInput) => {
    if (mode === "create") {
      if (!selectedUserId) {
        toast.error("Please select a user");
        return;
      }
      const createData = data as AdminBillCreateInput;
      createAdvance.mutate(
        { userId: selectedUserId, data: { ...createData, date: `${createData.date}T00:00:00+05:30` } },
        {
          onSuccess: () => {
            toast.success("Advance created");
            onOpenChange(false);
          },
        }
      );
    } else {
      const updateData = data as AdminBillUpdateInput;
      if (initialData?.id) {
        updateAdvance.mutate(
          { id: initialData.id, data: { advance: updateData.advance, description: updateData.description } },
          {
            onSuccess: () => {
              toast.success("Advance updated");
              onOpenChange(false);
            },
          }
        );
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{mode === "create" ? "Create Advance Bill" : "Edit Advance Bill"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
          {mode === "create" && (
            <Field>
              <FieldLabel>User</FieldLabel>
              <UserSearchPicker 
                multiple={false} 
                onSelect={(user) => setSelectedUserId(user.id)} 
              />
            </Field>
          )}

          <Controller
            name="advance"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field>
                <FieldLabel>Advance Amount</FieldLabel>
                <Input type="number" {...field} onChange={(e) => field.onChange(Number(e.target.value))} />
                {fieldState.error && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />

          {mode === "create" && (
            <Controller
              name="date"
              control={form.control}
              render={({ field }) => (
                <Field>
                  <FieldLabel>Date</FieldLabel>
                  <Input type="date" {...field} />
                </Field>
              )}
            />
          )}

          <Controller
            name="description"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field>
                <FieldLabel>Description</FieldLabel>
                <Textarea {...field} rows={3} />
                {fieldState.error && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />

          <Button type="submit" disabled={createAdvance.isPending || updateAdvance.isPending} className="w-full">
            {mode === "create" 
              ? (createAdvance.isPending ? "Creating..." : "Create Advance") 
              : (updateAdvance.isPending ? "Updating..." : "Update Advance")}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}