"use client"
import { DefaultLoader } from "@/components/loading"
import { NoData } from "@/components/no-data"
import { Button } from "@/components/ui/button"
import { Card, CardAction, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { InputGroup, InputGroupAddon, InputGroupText, InputGroupTextarea } from "@/components/ui/input-group"
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAdminAttendanceCorrection } from "@/hooks/use-admin-attendance-correction"
import { dateField } from "@/lib/common-zod-schema"
import { formatDate, timeToDateString, transformTime } from "@/lib/utils/time"
import { zodResolver } from "@hookform/resolvers/zod"
import Image from "next/image"
import { useSearchParams } from "next/navigation"
import { useEffect } from "react"
import { Controller, useForm } from "react-hook-form"
import z from "zod"
import { attendanceStatusList } from "../attendance/attendance-correction"
import { toast } from "sonner"
import { AspectRatio } from "@/components/ui/aspect-ratio"
import { Textarea } from "@/components/ui/textarea"

export const attendanceCorrectionStatusList = ["reject", "pending", "approve"]

export const attendanceCorrectionHandleSchema = z.object({
  changes: z.object({
    inTime: dateField,
    outTime: dateField,
    status: z.enum(["absent", "half-day", "present"]),
  }),
  reason: z.string().min(2, "Reason Is Required. Minimum 2 Word").max(300, "Maximum Reason Is 300 Characters."),
  status: z.enum(["reject", "pending", "approve"])
})


export type AttendanceCorrectionViewType = z.infer<typeof attendanceCorrectionHandleSchema>

const AttendanceCorrectionView = () => {
  const correctionId = useSearchParams().get("correctionId") || ''
  const { correction, handleCorrection } = useAdminAttendanceCorrection({ correctionId })

  const { data, isLoading } = correction

  const form = useForm<AttendanceCorrectionViewType>({
    resolver: zodResolver(attendanceCorrectionHandleSchema),
    defaultValues: {
      changes: {
        inTime: null,
        outTime: null,
        status: "absent",
      },
      reason: "",
      status: "pending",
    },
  })

  useEffect(() => {
    if (data) {
      form.reset({
        changes: {
          inTime: transformTime(data.changes.inTime),
          outTime: transformTime(data.changes.outTime),
          status: data.changes.status,
        },
        status: data.status,
        reason: "",
      })
    }
  }, [data])


  if (isLoading) return <DefaultLoader />
  if (!data) return <NoData title="No Attendance Correction Selected." description="Please Refresh or You Haven't Selected Any Attendance Correction or Attendance Correction Doesn't Exist." />

  const onSubmit = (formData: AttendanceCorrectionViewType, status: "approve" | "reject") => {
    const payload = {
      ...formData,
      status,
      changes: {
        ...formData.changes,
        inTime: timeToDateString(data.attendance.date, formData.changes.inTime as string),
        outTime: timeToDateString(data.attendance.date, formData.changes.outTime as string),
      },
    }

    const res = handleCorrection.mutate({ ...payload, id: correctionId }, {
      onSuccess: (res) => {
        toast.success(res.message)
      },
      onError: (err: Error) => {
        toast.error(err.message)
      },
    })
    console.log(res)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Attendance Correction Details</CardTitle>
        <CardAction>{formatDate(data.attendance.date)}</CardAction>
      </CardHeader>
      <CardContent className="h-full">
        <form className="space-y-2.5" id="attendance-correction-form">
          <FieldGroup className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <Controller
              name="changes.inTime"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="attendance-correction-in-time">Check In</FieldLabel>
                  <Input
                    type="time"
                    // @ts-expect-error
                    value={field.value as string}
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
              name="changes.outTime"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="attendance-correction-out-time">Check Out</FieldLabel>
                  <Input
                    type="time"
                    // @ts-expect-error
                    value={field.value || ""}
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
          </FieldGroup>

          <FieldGroup className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <Controller
              name="changes.status"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="role">Status</FieldLabel>
                  <Select
                    key={field.value}
                    value={field.value}
                    aria-invalid={fieldState.invalid}
                    onValueChange={field.onChange}
                  >
                    <SelectTrigger className="w-45">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {
                          attendanceStatusList.map((attendanceStatus) => {
                            return (
                              <SelectItem key={attendanceStatus} value={attendanceStatus}>{attendanceStatus.toLocaleUpperCase()}</SelectItem>
                            )
                          })
                        }
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />

            {
              data.proof && (
                <Field>
                  <FieldLabel>Proof</FieldLabel>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline">See Proof</Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-sm">
                      <DialogHeader>
                        <DialogTitle>User Proof</DialogTitle>
                      </DialogHeader>
                      <AspectRatio ratio={1 / 1}>
                        <Image
                          src={data.proof.src}
                          alt={data._id}
                          fill
                        />
                      </AspectRatio>
                    </DialogContent>
                  </Dialog>
                </Field>
              )
            }
          </FieldGroup>

          <FieldGroup>

            <Field >
              <FieldLabel htmlFor="attendance-correction-message">
                Message
              </FieldLabel>
              <Textarea disabled>
                {data.message}
              </Textarea>
            </Field>
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
        </form>
      </CardContent>
      <CardFooter>
        <Field orientation="horizontal">
          <Button
            type="button"
            variant="destructive"
            onClick={form.handleSubmit((data) => onSubmit(data, "reject"))}
          >
            Reject
          </Button>

          <Button
            type="button"
            onClick={form.handleSubmit((data) => onSubmit(data, "approve"))}
          >
            Approve
          </Button>
        </Field>
      </CardFooter>

    </Card>
  )
}

export default AttendanceCorrectionView
