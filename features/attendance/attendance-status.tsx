"use client"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardAction, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useAttendance } from "@/hooks/use-attendance"
import { formatDate, formatTime, calculateWorkHours } from "@/utils/attendance"
import { ArrowDownLeft, ArrowUpRight, ClockIcon } from "lucide-react"


const AttendanceStatus = () => {
  const { data, status, isLoading, isCheckedIn, checkIn, isCheckedOut, checkOut, } = useAttendance()

  if (isLoading) return <p>Loading...</p>

  return (
    <Card>
      <CardHeader>
        <CardTitle>{formatDate(data?.date as Date)}</CardTitle>
        <CardAction className="flex gap-2 items-center">
          <p>{status}</p>
          {data?.isLate && (
            <Badge variant="outline-warn" className="p-4">LATE</Badge>
          )}
        </CardAction>
      </CardHeader>
      {
        data && (
          <CardContent className="space-y-2 h-full">
            <div className="grid grid-cols-3 gap-2 items-center">
              <span className="flex items-center gap-2">
                <ArrowUpRight />
                Check In
              </span>
              <Input
                type="time"
                className="w-fit"
                disabled
                defaultValue={formatTime(data?.inTime)}
              />
            </div>

            <div className="grid grid-cols-3 gap-2 items-center">
              <span className="flex items-center gap-2">
                <ArrowDownLeft />
                Check Out
              </span>
              <Input
                type="time"
                className="w-fit"
                disabled
                defaultValue={formatTime(data?.outTime)}
              />
            </div>

            <div className="grid grid-cols-3 gap-2 items-center">
              <span className="flex items-center gap-2">
                <ClockIcon className="size-5"/>
                Work Hours
              </span>
              <Input
                type="text"
                className="w-28"
                disabled
                value={calculateWorkHours(data?.inTime, data?.outTime)}
              />
            </div>
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
