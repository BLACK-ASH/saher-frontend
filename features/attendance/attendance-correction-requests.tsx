"use client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AttendanceCorrectionType } from "./attendance-correction"
import { useSearchParams } from "next/navigation"

const corrections: AttendanceCorrectionType[] = [

]

type Props = {}

const AttendanceCorrectionRequests = (props: Props) => {
  const attendanceId = useSearchParams().get("attendanceId")
  return (
    <Card>
      <CardHeader>
        <CardTitle>Correction Requests</CardTitle>
      </CardHeader>
      <CardContent>
        {attendanceId}
      </CardContent>
    </Card>
  )
}

export default AttendanceCorrectionRequests
