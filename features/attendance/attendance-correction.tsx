"use client";
import { DefaultLoader } from "@/components/loading";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useAttendance } from "@/hooks/use-attendance";
import { useAttendanceCorrection } from "@/hooks/use-attendance-correction";
import { formatDate, timeToDateString, transformTime } from "@/lib/utils/time";
import { zodResolver } from "@hookform/resolvers/zod";
import { Edit2 } from "lucide-react";
import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import z from "zod";
import { toast } from "sonner";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import ImageUpload from "@/components/image-upload";
import {
  InputGroup,
  InputGroupTextarea,
  InputGroupAddon,
  InputGroupText,
} from "@/components/ui/input-group";
import { AttendanceResponse } from "@/services/attendance.api";

export const attendanceCorrectionCreateSchema = z.object({
  attendanceId: z.string(),
  message: z
    .string()
    .min(10, "Message is Required. Atleast 10 Characters")
    .max(100, "Max Limit Is 100 Characters."),
  proof: z.string().optional(),
  upload: z.string().optional(),
  inTime: z.string(),
  outTime: z.string(),
});

export type AttendanceCorrectionCreateT = z.infer<
  typeof attendanceCorrectionCreateSchema
>;

export function AttendanceCorrectionSide({
  attendance,
}: {
  attendance: AttendanceResponse;
}) {
  const { submitCorrection } = useAttendanceCorrection({
    attendanceId: attendance.id,
  });

  const form = useForm<AttendanceCorrectionCreateT>({
    resolver: zodResolver(attendanceCorrectionCreateSchema),
    defaultValues: {
      attendanceId: attendance.id || "",
      message: "",
      inTime: transformTime(attendance?.inTime) || "",
      outTime: transformTime(attendance?.outTime) || "",
    },
  });

  useEffect(() => {
    if (attendance) {
      form.reset({
        attendanceId: attendance.id,
        inTime: transformTime(attendance.inTime), // ✅ MUST be HH:mm
        outTime: transformTime(attendance.outTime), // ✅ MUST be HH:mm
        message: "",
      });
    }
  }, [attendance]);

  if (!attendance) return null;

  const onSubmit = async (data: AttendanceCorrectionCreateT) => {
    const payload: AttendanceCorrectionCreateT = {
      attendanceId: data.attendanceId,
      inTime: timeToDateString(attendance.date, data.inTime),
      outTime: timeToDateString(attendance.date, data.inTime),
      message: data.message,
      proof: data.proof,
    };

    submitCorrection.mutate(payload, {
      onSuccess: (res) => {
        toast.success(res.message);
      },
      onError: (err: Error) => {
        toast.error(err.message);
      },
    });
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost">
          <Edit2 />
        </Button>
      </SheetTrigger>
      <SheetContent className="overflow-scroll">
        <SheetHeader>
          <SheetTitle>Attendance Correction</SheetTitle>
          <SheetTitle>{formatDate(attendance.date)}</SheetTitle>
          <SheetDescription>
            Request changes to your attendance here. Click save when you&apos;re
            done.
          </SheetDescription>
        </SheetHeader>
        <form
          className="space-y-2.5 p-3"
          id="attendance-correction-form"
          onSubmit={form.handleSubmit(onSubmit)}
        >
          <FieldGroup>
            <Controller
              name="inTime"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="attendance-correction-in-time">
                    Check In
                  </FieldLabel>
                  <Input
                    type="time"
                    defaultValue={field.value || ""}
                    {...field}
                    id="attendance-correction-in-time"
                    aria-invalid={fieldState.invalid}
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
            <Controller
              name="outTime"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="attendance-correction-out-time">
                    Check Out
                  </FieldLabel>
                  <Input
                    type="time"
                    defaultValue={field.value || ""}
                    {...field}
                    id="attendance-correction-out-time"
                    aria-invalid={fieldState.invalid}
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />

            <Controller
              name="proof"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="role">Proof</FieldLabel>
                  <ImageUpload
                    altName={attendance.id}
                    url={form.getValues("upload")}
                    onUploadSuccess={(data) => {
                      form.setValue("proof", data.file.id);
                      form.setValue("upload", data.file.url);
                    }}
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
          </FieldGroup>

          <FieldGroup>
            <Controller
              name="message"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="attendance-correction-message">
                    Message
                  </FieldLabel>
                  <InputGroup>
                    <InputGroupTextarea
                      {...field}
                      id="attendance-correction-message"
                      placeholder="I'm having an issue with the my mobile internet so i check in late."
                      rows={6}
                      className="min-h-24 resize-none"
                      aria-invalid={fieldState.invalid}
                    />
                    <InputGroupAddon align="block-end">
                      <InputGroupText className="tabular-nums">
                        {field.value.length}/100 characters
                      </InputGroupText>
                    </InputGroupAddon>
                  </InputGroup>
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
          </FieldGroup>
          <SheetFooter>
            <Button type="submit">Submit Correction Request</Button>
            <SheetClose asChild>
              <Button variant="outline">Close</Button>
            </SheetClose>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
