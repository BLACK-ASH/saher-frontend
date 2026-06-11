import { DateSelectArg } from "@fullcalendar/core/index.js";

import type { Dispatch, SetStateAction } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import z from "zod";
type Props = {
  data: DateSelectArg;
  visible: boolean;
  setVisible: Dispatch<SetStateAction<boolean>>;
};
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toLocalInput } from "@/lib/utils/time";

const createEventSchema = z.object({
  title: z.string(),
  type: z.string(),
  start: z.date(),
  end: z.date(),
  description: z.string(),
});

const onEventSubmit = (data: z.infer<typeof createEventSchema>) => {
  console.log(data);
};

function AddEventDialog({ data, visible, setVisible }: Props) {
  console.log({
    start: data.start,
    end: data.end,
    localStart: toLocalInput(data.start),
    localEnd: toLocalInput(data.end),
  });
  const form = useForm<z.infer<typeof createEventSchema>>({
    resolver: zodResolver(createEventSchema),
    defaultValues: {
      start: data.start,
      end: data.end,
    },
  });
  return (
    <Dialog open={visible} onOpenChange={setVisible}>
      <DialogContent className="min-w-1/2 ">
        <DialogHeader>
          <DialogTitle>Add Event</DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onEventSubmit)} className="space-y-4">
          <FieldGroup>
            <Controller
              name="title"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="title">Title</FieldLabel>
                  <Input
                    {...field}
                    id="title"
                    placeholder="Enter event title"
                    aria-invalid={fieldState.invalid}
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />

            <Controller
              name="type"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="type">Type</FieldLabel>
                  <Input
                    {...field}
                    id="type"
                    placeholder="Meeting, Holiday, Task..."
                    aria-invalid={fieldState.invalid}
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
          </FieldGroup>

          <FieldGroup className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <Controller
              name="start"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="start">Start</FieldLabel>
                  <Input
                    id="start"
                    type="datetime-local"
                    value={toLocalInput(field.value)}
                    onChange={(e) => field.onChange(new Date(e.target.value))}
                    aria-invalid={fieldState.invalid}
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />

            <Controller
              name="end"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="end">End</FieldLabel>
                  <Input
                    id="end"
                    type="datetime-local"
                    value={toLocalInput(field.value)}
                    onChange={(e) => field.onChange(new Date(e.target.value))}
                    aria-invalid={fieldState.invalid}
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
          </FieldGroup>

          <Controller
            name="description"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="description">Description</FieldLabel>
                <Textarea
                  {...field}
                  id="description"
                  rows={4}
                  placeholder="Enter event description..."
                  aria-invalid={fieldState.invalid}
                />
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />

          <Button type="submit" className="w-full">
            Create Event
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default AddEventDialog;
