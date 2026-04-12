"use client"
import ImageUpload from "@/components/image-upload"
import { DefaultLoader } from "@/components/loading"
import { NoData } from "@/components/no-data"
import { Button } from "@/components/ui/button"
import { Card, CardAction, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { InputGroup, InputGroupAddon, InputGroupText, InputGroupTextarea } from "@/components/ui/input-group"
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAttendance } from "@/hooks/use-attendance"
import { useAttendanceCorrection } from "@/hooks/use-attendance-correction"
import { transformTime, timeToDateString } from "@/lib/utils/time"
import { zodResolver } from "@hookform/resolvers/zod"
import { useSearchParams } from "next/navigation"
import { useEffect } from "react"
import { Controller, useForm } from "react-hook-form"
import { toast } from "sonner"
import z from "zod"

export const attendanceStatusList = ["absent", "half-day", "present"]

export const attendanceCorrectionCreateSchema = z.object({
  attendanceId: z.string(),
  message: z.string().min(10, "Message is Required. Atleast 10 Characters").max(100, "Max Limit Is 100 Characters."),
  proof: z.string().optional(),
  inTime: z.string(),
  outTime: z.string(),
  status: z.enum(attendanceStatusList),
})

export type AttendanceCorrectionType = z.infer<typeof attendanceCorrectionCreateSchema>

const AttendanceCorrection = () => {
  const attendanceId = useSearchParams().get("attendanceId") || ''
  const { submitCorrection } = useAttendanceCorrection({ attendanceId })
  const { attendance: data } = useAttendance({ attendanceId })

  const { data: attendance, isLoading } = data

  const form = useForm<AttendanceCorrectionType>({
    resolver: zodResolver(attendanceCorrectionCreateSchema),
    defaultValues: {
      attendanceId: attendanceId || "",
      message: "",
      inTime: transformTime(attendance?.inTime) || "",
      outTime: transformTime(attendance?.outTime) || "",
      status: "absent"
    }
  })

  useEffect(() => {
    if (attendance) {
      form.reset({
        attendanceId: attendance._id,
        inTime: transformTime(attendance.inTime),   // ✅ MUST be HH:mm
        outTime: transformTime(attendance.outTime), // ✅ MUST be HH:mm
        status: attendance.status,
        message: "",
      })
    }
  }, [attendance])


  if (isLoading) return <DefaultLoader />
  if (!attendance) return <NoData title="No Attendance Selected." description="Please Refresh or You Haven't Selected Any Attendance or Attendance Dosen't Exist." />

  const onSubmit = async (data: AttendanceCorrectionType) => {
    const payload = { date: attendance.date, ...data }
    payload.inTime = timeToDateString(attendance.date, payload.inTime)
    payload.outTime = timeToDateString(attendance.date, payload.outTime)

    const res = submitCorrection.mutate(payload, {
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
        <CardTitle>Attendance Correction</CardTitle>
        <CardAction>{new Date(attendance.date).toLocaleDateString()}</CardAction>
      </CardHeader>
      <CardContent className="h-full">
        <form className="space-y-2.5" id="attendance-correction-form" onSubmit={form.handleSubmit(onSubmit)}>
          <FieldGroup className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <Controller
              name="inTime"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="attendance-correction-in-time">Check In</FieldLabel>
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
                  <FieldLabel htmlFor="attendance-correction-out-time">Check Out</FieldLabel>
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
          </FieldGroup>

          <FieldGroup className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <Controller
              name="status"
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

            <Controller
              name="proof"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="role">Proof</FieldLabel>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline">Upload Proof</Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-sm">
                      <DialogHeader>
                        <DialogTitle>Add Your Proof</DialogTitle>
                      </DialogHeader>

                      <ImageUpload
                        altName={form.getValues("proof") + attendanceId}
                        onUploadSuccess={(data) => form.setValue("proof", data.file.id)}
                      />
                    </DialogContent>
                  </Dialog>
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
        </form>
      </CardContent>
      <CardFooter>
        <Field orientation="horizontal">
          <Button type="button" variant="outline" onClick={() => form.reset()}>
            Reset
          </Button>
          <Button type="submit" form="attendance-correction-form">
            Submit
          </Button>
        </Field>
      </CardFooter>

    </Card>
  )
}

export default AttendanceCorrection
