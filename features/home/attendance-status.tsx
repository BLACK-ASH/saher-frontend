"use client"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardAction, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useAttendance } from "@/hooks/use-attendance"
import { useMe } from "@/hooks/use-me"
import { formatDate, formatTime, calculateWorkHours } from "@/utils/attendance"

type Props = {
}

const AttendanceStatus = (props: Props) => {
  const { data: user, error, isPending } = useMe()
  const { data, status, isLoading, isCheckedIn, checkIn, isCheckedOut, checkOut, } = useAttendance()
  console.log(data)

  if (isLoading) return <p>Loading...</p>
  if (isPending) return <p>Loading...</p>

  return (
    <Card>
      <CardHeader>
        <CardTitle>{user?.displayName}</CardTitle>
        <CardAction className="flex gap-2 items-center">
          <p>{status}</p>
          {data?.isLate && (
            <Badge variant="destructive" className="p-4">LATE</Badge>
          )}
        </CardAction>
      </CardHeader>
      {
        data && (
          <CardContent className="grid grid-cols-2 gap-2">
            <p>📅 Date: {formatDate(data?.date)}</p>

            <p>⏱ Work Hours: {calculateWorkHours(data?.inTime, data?.outTime)}</p>

            <p>🟢 Check In: {formatTime(data?.inTime)}</p>

            <p>🔴 Check Out: {formatTime(data?.outTime)}</p>

          </CardContent>
        )
      }
      <CardFooter className="flex justify-between px-4 gap-2">
        <Button disabled={isCheckedIn} onClick={() => checkIn()}>Check In</Button>
        <Button disabled={!isCheckedIn || isCheckedOut} onClick={() => checkOut()}>Check Out</Button>
      </CardFooter>
    </Card>
  )
}

export default AttendanceStatus
