"use client";
import { NoData } from "@/components/no-data";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupText,
  InputGroupTextarea,
} from "@/components/ui/input-group";
import { useAdminAttendanceCorrection } from "@/hooks/use-admin-attendance-correction";
import { formatDate, timeToDateString, transformTime } from "@/lib/utils/time";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import z from "zod";
import { toast } from "sonner";
import AttendanceComparision from "../attendance/attendance-comparision";
import { AttendanceCorrectionResponse } from "@/services/attendance-correction.api";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Edit2, X } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const attendanceCorrectionStatusList = [
  "reject",
  "pending",
  "on-hold",
  "approve",
] as const;

const attendanceStatusList = ["absent", "half-day", "present"];

export const attendanceCorrectionHandleSchema = z
  .object({
    changes: z
      .object({
        inTime: z.string(),
        outTime: z.string(),
        status: z.enum(["absent", "half-day", "present"]),
        isLate: z.boolean(),
      })
      .optional(),

    isAdmin: z.boolean(),
    reason: z.string().max(300, "Maximum Reason Is 300 Characters.").optional(),
    status: z.enum(attendanceCorrectionStatusList),
  })
  .superRefine((data, ctx) => {
    if (data.isAdmin) {
      if (!data.changes) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Changes are required for admin correction.",
          path: ["changes"],
        });
        return;
      }

      const { inTime, outTime, status, isLate } = data.changes;

      if (!inTime || !outTime || !status || isLate === undefined) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "All change fields are required for admin correction.",
          path: ["changes"],
        });
      }
    }
  });

export type AttendanceCorrectionViewType = z.infer<
  typeof attendanceCorrectionHandleSchema
>;

const AttendanceCorrectionView = ({
  correction,
}: {
  correction: AttendanceCorrectionResponse;
}) => {
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const { handleCorrection } = useAdminAttendanceCorrection({});

  const form = useForm<AttendanceCorrectionViewType>({
    resolver: zodResolver(attendanceCorrectionHandleSchema),
    defaultValues: {
      isAdmin: false,
      status: "on-hold",
      reason: "",
      changes: {
        inTime: "",
        outTime: "",
        status: "absent",
        isLate: false,
      },
    },
  });

  useEffect(() => {
    if (correction) {
      form.reset({
        isAdmin,
        status: correction.status,
        reason: correction.reason ?? "",
        changes: {
          inTime: transformTime(correction?.changes?.inTime) ?? "",
          outTime: transformTime(correction?.changes?.outTime) ?? "",
          status: correction?.changes?.status ?? correction.previous.status,
          isLate: correction?.changes?.isLate ?? correction.previous.isLate,
        },
      });
    }
  }, [correction]);

  if (!correction)
    return (
      <NoData
        title="No Attendance Correction Selected."
        description="Please Refresh or You Haven't Selected Any Attendance Correction or Attendance Correction Doesn't Exist."
      />
    );

  const onSubmit = (
    formData: AttendanceCorrectionViewType,
    status: "approve" | "reject" | "on-hold",
  ) => {
    if (!formData.changes) {
      throw new Error("Changes are required");
    }

    const payload = {
      ...formData,
      isAdmin,
      status,
      changes: {
        ...formData.changes,
        inTime: timeToDateString(
          correction.attendance.date,
          formData.changes?.inTime as string,
        ),
        outTime: timeToDateString(
          correction.attendance.date,
          formData.changes?.outTime as string,
        ),
      },
    };

    handleCorrection.mutate(
      { id: correction.id, payload },
      {
        onSuccess: (res) => {
          toast.success(res.message);
        },
        onError: (err: Error) => {
          toast.error(err.message);
        },
      },
    );
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button className="flex gap-2" variant="ghost">
          <Edit2 /> Details
        </Button>
      </SheetTrigger>
      <SheetContent className="p-2 min-w-1/2 overflow-scroll">
        <SheetHeader>
          <SheetTitle>Attendance Correction Details</SheetTitle>
          <SheetDescription className="flex items-center justify-between px-4">
            <p>
              {correction.user.name} - {formatDate(correction.attendance.date)}
            </p>
            {isAdmin ? (
              <X
                className="size-4 text-base"
                onClick={() => setIsAdmin(false)}
              />
            ) : (
              <Edit2
                className="size-4 text-base"
                onClick={() => setIsAdmin(true)}
              />
            )}
          </SheetDescription>
        </SheetHeader>
        <div className="grid md:grid-cols-2 gap-2">
          <form className="space-y-2.5" id="attendance-correction-form">
            <FieldGroup>
              <Controller
                name="changes.inTime"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="attendance-correction-in-time">
                      Check In
                    </FieldLabel>
                    <Input
                      type="time"
                      // @ts-expect-error - value will be present
                      value={field.value as string}
                      {...field}
                      disabled={!isAdmin}
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
                name="changes.outTime"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="attendance-correction-out-time">
                      Check Out
                    </FieldLabel>
                    <Input
                      type="time"
                      // @ts-expect-error - value will be present
                      value={field.value || ""}
                      {...field}
                      disabled={!isAdmin}
                      id="attendance-correction-out-time"
                      aria-invalid={fieldState.invalid}
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
            </FieldGroup>

            {isAdmin && (
              <FieldGroup>
                <Controller
                  name="changes.isLate"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel>Late</FieldLabel>

                      <Select
                        value={field.value?.toString()} // 👈 boolean → string
                        onValueChange={(val) => field.onChange(val === "true")} // 👈 string → boolean
                      >
                        <SelectTrigger className="w-full max-w-48">
                          <SelectValue placeholder="Select Late Status" />
                        </SelectTrigger>

                        <SelectContent>
                          <SelectItem value="true">Late</SelectItem>
                          <SelectItem value="false">On Time</SelectItem>
                        </SelectContent>
                      </Select>

                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />
                <Controller
                  name="changes.status"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="attendance-correction-out-time">
                        Status
                      </FieldLabel>
                      <Select
                        {...field}
                        aria-invalid={fieldState.invalid}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger className="w-full max-w-48">
                          <SelectValue placeholder="Select Attendance Status" />
                        </SelectTrigger>
                        <SelectContent>
                          {attendanceStatusList.map((status) => {
                            return (
                              <SelectItem key={status} value={status}>
                                {status}
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />
              </FieldGroup>
            )}

            <FieldGroup>
              <Controller
                name="reason"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="attendance-correction-message">
                      Reason
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
                          {field.value?.length ?? 0}/100 characters
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
          </form>
          <div>
            <Field>
              <FieldLabel>Details</FieldLabel>
              <AttendanceComparision correction={correction} />
            </Field>
          </div>
        </div>
        <Field orientation="horizontal">
          <Button
            type="button"
            variant="destructive"
            onClick={form.handleSubmit(
              (data) => onSubmit(data, "reject"),
              (err) => console.error(err),
            )}
          >
            Reject
          </Button>

          <Button
            type="button"
            variant="secondary"
            onClick={form.handleSubmit(
              (data) => onSubmit(data, "on-hold"),
              (err) => console.error(err),
            )}
          >
            On Hold
          </Button>

          <Button
            type="button"
            onClick={form.handleSubmit(
              (data) => onSubmit(data, "approve"),
              (err) => console.error(err),
            )}
          >
            Approve
          </Button>
        </Field>
      </SheetContent>
    </Sheet>
  );
};

export default AttendanceCorrectionView;
