"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, X } from "lucide-react";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  createParticipantSchema,
  CreateParticipantType as FormValues,
} from "@/services/participant.api";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import ImageUpload from "@/components/image-upload";
import { useParticipants } from "@/hooks/use-participant";
import { toast } from "sonner";

const AddParticipant = () => {
  const [visible, setVisible] = useState(false);
  const { add } = useParticipants({});

  const form = useForm<FormValues>({
    resolver: zodResolver(createParticipantSchema),
    defaultValues: {
      name: "",
      age: undefined,
      gender: undefined,
      phoneNumber: "",
      image: undefined,
      address: "",
      affiliation: "",
      parentDetails: "",
      document: [],
    },
  });

  const onSubmit = (values: FormValues) => {
    add.mutate(values, {
      onSuccess: (res) => {
        toast.success((res as { message: string }).message);
      },
    });
    form.reset();
    setVisible(false);
  };

  return (
    <Dialog open={visible} onOpenChange={setVisible}>
      <DialogTrigger asChild>
        <Button className="flex items-center gap-2" variant={"outline"}>
          <Plus />
          Add Participant
        </Button>
      </DialogTrigger>
      <DialogContent className="min-w-3/4">
        <DialogHeader>
          <DialogTitle>Enter Details To Create A Participant</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <Controller
              name="name"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field>
                  <FieldLabel htmlFor="name">Name</FieldLabel>
                  <Input
                    {...field}
                    id="name"
                    placeholder="Enter participant name"
                  />
                  {fieldState.error && (
                    <p className="text-sm text-destructive">
                      {fieldState.error.message}
                    </p>
                  )}
                </Field>
              )}
            />

            <Controller
              name="age"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field>
                  <FieldLabel htmlFor="age">Age</FieldLabel>
                  <Input
                    {...field}
                    onChange={(e) =>
                      field.onChange(
                        e.target.value === ""
                          ? undefined
                          : Number(e.target.value),
                      )
                    }
                    id="age"
                    type="number"
                    placeholder="Enter age"
                    value={field.value ?? ""}
                  />
                  {fieldState.error && (
                    <p className="text-sm text-destructive">
                      {fieldState.error.message}
                    </p>
                  )}
                </Field>
              )}
            />

            <Controller
              name="gender"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field>
                  <FieldLabel htmlFor="gender">Gender</FieldLabel>
                  <Input {...field} id="gender" placeholder="Male / Female" />
                  {fieldState.error && (
                    <p className="text-sm text-destructive">
                      {fieldState.error.message}
                    </p>
                  )}
                </Field>
              )}
            />

            <Controller
              name="phoneNumber"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field>
                  <FieldLabel htmlFor="phoneNumber">Phone Number</FieldLabel>
                  <Input {...field} id="phoneNumber" placeholder="9876543210" />
                  {fieldState.error && (
                    <p className="text-sm text-destructive">
                      {fieldState.error.message}
                    </p>
                  )}
                </Field>
              )}
            />
          </div>

          <Controller
            name="address"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field>
                <FieldLabel htmlFor="address">Address</FieldLabel>
                <Textarea {...field} id="address" placeholder="Enter address" />
                {fieldState.error && (
                  <p className="text-sm text-destructive">
                    {fieldState.error.message}
                  </p>
                )}
              </Field>
            )}
          />

          <Controller
            name="affiliation"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field>
                <FieldLabel htmlFor="affiliation">Affiliation</FieldLabel>
                <Textarea
                  {...field}
                  id="affiliation"
                  placeholder="College / Organization"
                />
                {fieldState.error && (
                  <p className="text-sm text-destructive">
                    {fieldState.error.message}
                  </p>
                )}
              </Field>
            )}
          />

          <Controller
            name="parentDetails"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field>
                <FieldLabel htmlFor="parentDetails">Parent Details</FieldLabel>
                <Textarea
                  {...field}
                  id="parentDetails"
                  placeholder="Parent / Guardian details"
                />
                {fieldState.error && (
                  <p className="text-sm text-destructive">
                    {fieldState.error.message}
                  </p>
                )}
              </Field>
            )}
          />
          <Controller
            name="image"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="image">Image</FieldLabel>

                <ImageUpload
                  altName={form.getValues("name") || "participant"}
                  url={form.getValues("uploaded.image")}
                  onUploadSuccess={(data) => {
                    // Store image ID for submission
                    field.onChange(data.id);

                    // Store full uploaded object for UI
                    form.setValue("uploaded.image", data);
                  }}
                />

                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />
          <Controller
            name="document"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel>Documents</FieldLabel>

                <ImageUpload
                  altName={`${form.getValues("name")}-document`}
                  onUploadSuccess={(data) => {
                    field.onChange([...(field.value ?? []), data.id]);

                    form.setValue("uploaded.document", [
                      ...(form.getValues("uploaded.document") ?? []),
                      data,
                    ]);
                  }}
                />

                <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {(form.watch("uploaded.document") ?? []).map(
                    (image, index) => (
                      <div key={image.id} className="relative">
                        <img
                          src={image.src}
                          alt={`Document ${index + 1}`}
                          className="aspect-square w-full rounded-md border object-cover"
                        />

                        <Button
                          type="button"
                          size="icon"
                          variant="destructive"
                          className="absolute right-2 top-2 h-7 w-7"
                          onClick={() => {
                            field.onChange(
                              field.value?.filter((_, i) => i !== index),
                            );

                            form.setValue(
                              "uploaded.document",
                              form
                                .getValues("uploaded.document")
                                ?.filter((_, i) => i !== index),
                            );
                          }}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ),
                  )}
                </div>

                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />

          <Button type="submit">Create Participant</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddParticipant;
