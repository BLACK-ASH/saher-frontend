import { useEffect, type Dispatch, type SetStateAction } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import z from "zod";
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
import { isoToIstInput } from "@/lib/date";
import { CalendarSelection } from "./calendar";
import { addDays, parseISO } from "date-fns";
import { useCalendar } from "@/hooks/use-calendar";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Props = {
  data: CalendarSelection | null;
  visible: boolean;
  setVisible: Dispatch<SetStateAction<boolean>>;
  eventId?: string;
  initialData?: {
    title: string;
    type: string;
    start: Date;
    end: Date;
    description?: string | null;
  };
};

const createEventSchema = z.object({
  title: z.string(),
  type: z.string(),
  start: z.date(),
  end: z.date(),
  description: z.string(),
});

export type EventPayload = z.infer<typeof createEventSchema>;

function AddEventDialog({ data, visible, setVisible, eventId, initialData }: Props) {
  const { add, update } = useCalendar({});
  const form = useForm<EventPayload>({
    resolver: zodResolver(createEventSchema),
  });

  useEffect(() => {
    if (!data) return;

    form.reset({
      title: "",
      type: "",
      description: "",
      start: data.start,
      end: data.end,
    });
  }, [data, form]);

  useEffect(() => {
    if (initialData) {
      form.reset({
        title: initialData.title,
        type: initialData.type,
        description: initialData.description ?? "",
        start: initialData.start,
        end: initialData.end,
      });
    }
  }, [initialData, form]);

  useEffect(() => {
    if (!visible) {
      form.reset();
    }
  }, [visible, form]);

  if (!data) return null;

  const start = form.watch("start");
  const end = form.watch("end");

  const onEventSubmit = (data: EventPayload) => {
    if (eventId) {
      update.mutate(
        { id: eventId, data: { ...data, end: addDays(data.end, 1) } },
        {
          onSuccess: (res) => {
            toast.success(res.message);
            form.reset();
            setVisible(false);
          },
          onError: (err: Error) => {
            toast.error(err.message);
          },
        },
      );
    } else {
      add.mutate(
        { ...data, end: addDays(data.end, 1) },
        {
          onSuccess: (res) => {
            toast.success(res.message);
            form.reset();
            setVisible(false);
          },
          onError: (err: Error) => {
            toast.error(err.message);
          },
        },
      );
    }
  };

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
                  <FieldLabel htmlFor="event-type">Event Type</FieldLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger
                      id="event-type"
                      aria-invalid={fieldState.invalid}
                    >
                      <SelectValue placeholder="Select event type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="holiday">Holiday</SelectItem>
                      <SelectItem value="session">Session</SelectItem>
                      <SelectItem value="task">Task</SelectItem>
                      <SelectItem value="meeting">Meeting</SelectItem>
                      <SelectItem value="calendar-event">
                        Calendar Event
                      </SelectItem>
                    </SelectContent>
                  </Select>
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
                    value={isoToIstInput(start)}
                    onChange={(e) => field.onChange(parseISO(e.target.value))}
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
                    value={isoToIstInput(end)}
                    onChange={(e) => field.onChange(parseISO(e.target.value))}
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
            {eventId ? "Update Event" : "Create Event"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default AddEventDialog;
