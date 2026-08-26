"use client";

import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";

import {
  createNoticeSchema,
  type CreateNoticeInput,
} from "@/services/notice.api";
import { useNotices } from "@/hooks/use-notice";
import { dateInputToIso } from "@/lib/date";

type Props = {
  mode: "create" | "edit";
  initialData?: {
    id: string;
    title: string;
    description: string;
    expiresAt: string;
  };
};

export function NoticeForm({ mode, initialData }: Props) {
  const router = useRouter();
  const { addNotice, editNotice } = useNotices();

  // Create pre-fills 7 days out; edit shows the stored date (backend +1 already applied).
  const defaultExpiry = initialData
    ? new Date(initialData.expiresAt).toISOString().split("T")[0]
    : (() => {
        const d = new Date();
        d.setDate(d.getDate() + 7);
        return d.toISOString().split("T")[0];
      })();

  const form = useForm<CreateNoticeInput>({
    resolver: zodResolver(createNoticeSchema),
    defaultValues: {
      title: initialData?.title ?? "",
      description: initialData?.description ?? "",
      expiresAt: defaultExpiry,
    },
  });

  const onNoticeSubmit = (values: CreateNoticeInput) => {
    // Send IST-midnight ISO; do NOT use the mutation response to update UI —
    // backend returns the OLD doc on edit, cache invalidation handles refresh.
    const payload: CreateNoticeInput = {
      ...values,
      expiresAt: values.expiresAt ? dateInputToIso(values.expiresAt) : undefined,
    };

    if (mode === "create") {
      addNotice.mutate(payload, {
        onSuccess: () => {
          toast.success("Notice created");
          router.push("/noticeboard");
        },
      });
    } else {
      editNotice.mutate(
        { id: initialData!.id, data: payload },
        {
          onSuccess: () => {
            toast.success("Notice updated");
            router.push("/noticeboard");
          },
        },
      );
    }
  };

  return (
    <form onSubmit={form.handleSubmit(onNoticeSubmit)} className="max-w-2xl space-y-5">
      {/* Title */}
      <Controller
        name="title"
        control={form.control}
        render={({ field, fieldState }) => (
          <Field>
            <FieldLabel>Title</FieldLabel>
            <Input {...field} />
            {fieldState.error && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />

      {/* Description */}
      <Controller
        name="description"
        control={form.control}
        render={({ field, fieldState }) => (
          <Field>
            <FieldLabel>Description</FieldLabel>
            <Textarea {...field} rows={6} />
            {fieldState.error && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />

      {/* Expiry Date */}
      <Controller
        name="expiresAt"
        control={form.control}
        render={({ field, fieldState }) => (
          <Field>
            <FieldLabel>Expiry Date</FieldLabel>
            <Input type="date" {...field} value={field.value ?? ""} />
            {fieldState.error && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />

      <Button type="submit" disabled={addNotice.isPending || editNotice.isPending}>
        {mode === "create" ? "Create Notice" : "Update Notice"}
      </Button>
    </form>
  );
}
