import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import { imageUrl } from "@/lib/image-url"
import { formatTime } from "@/lib/utils/time"
import { attendanceStatusVariant } from "./attendance-table"
import { Badge } from "@/components/ui/badge"
import { AttendanceCorrectionResponse } from "@/services/attendance-correction.api"
import Image from "next/image"
import { NoData } from "@/components/no-data"


const AttendanceComparision = ({ correction }: { correction: AttendanceCorrectionResponse | null }) => {
  if (!correction) return <NoData title="No Correction Detail To Show" description=""/>

  return (
    <>
      <Table>
        <TableCaption>{correction.reason}</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead className="font-bold">Field</TableHead>
            <TableHead className="font-bold">Previous</TableHead>
            <TableHead className="font-bold">Change</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {/* Check In */}
          {(correction?.previous?.inTime || correction?.changes?.inTime) && (
            <TableRow>
              <TableCell>Check In</TableCell>
              <TableCell>{formatTime(correction?.previous?.inTime)}</TableCell>
              <TableCell>{formatTime(correction?.changes?.inTime as unknown as string)}</TableCell>
            </TableRow>
          )}

          {/* Check Out */}
          {(correction?.previous?.outTime || correction?.changes?.outTime) && (
            <TableRow>
              <TableCell>Check Out</TableCell>
              <TableCell>{formatTime(correction?.previous?.outTime)}</TableCell>
              <TableCell>{formatTime(correction?.changes?.outTime as unknown as string)}</TableCell>
            </TableRow>
          )}

          {/* Status */}
          {(correction?.previous?.status || correction?.changes?.status) && (
            <TableRow>
              <TableCell>Status</TableCell>
              <TableCell><Badge className="px-3 py-1" variant={attendanceStatusVariant[correction?.previous.status]}>{correction.previous.status}</Badge></TableCell>
              <TableCell>
                {correction?.changes?.status ? (
                  <Badge
                    className="px-3 py-1"
                    variant={attendanceStatusVariant[correction.changes.status]}
                  >
                    {correction.changes.status}
                  </Badge>
                ) : (
                  "-"
                )}
              </TableCell>
            </TableRow>
          )}

          {/* Status */}
          {(correction?.previous?.isLate !== undefined || correction?.changes?.isLate !== undefined) && (
            <TableRow>
              <TableCell>Late</TableCell>
              <TableCell>{
                correction.previous.isLate ?
                  <Badge className="px-3 py-1" variant={"outline-warn"}>Late</Badge> :
                  <Badge className="px-3 py-1" variant={"outline-success"}>On Time</Badge>
              }</TableCell>

              <TableCell>{
                correction.changes.isLate ?
                  <Badge className="px-3 py-1" variant={"outline-warn"}>Late</Badge> :
                  <Badge className="px-3 py-1" variant={"outline-success"}>On Time</Badge>
              }</TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      {
        correction?.proof && (
          <Image
            src={imageUrl(correction?.proof?.src)}
            alt={correction?.proof?.alt}
            width={400}
            height={300}
            className="rounded-md"
          />
        )
      }
      <Textarea disabled defaultValue={correction.message} />
    </>
  )
}

export default AttendanceComparision
