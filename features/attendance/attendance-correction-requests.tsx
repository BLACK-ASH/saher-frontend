"use client"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useAttendanceCorrection } from "@/hooks/use-attendance-correction"
import { formatDate } from "@/lib/utils/attendance"

type Props = {}

const variant: Record<
  "pending" | "approve" | "reject",
  "outline-warn" | "outline-success" | "destructive"
> = {
  pending: "outline-warn",
  approve: "outline-success",
  reject: "destructive",
}

const AttendanceCorrectionRequests = (props: Props) => {
  const { allCorrections } = useAttendanceCorrection()
  const { data: corrections, isLoading } = allCorrections
  if (isLoading) return <p>Loading...</p>
  console.log(corrections);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Correction Requests</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-center">Status</TableHead>
              <TableHead className="text-center">Date</TableHead>
              <TableHead className="text-center">View</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {
              corrections?.map((correction) => (
                <TableRow className="cursor-pointer" key={correction._id}  >
                  <TableCell className="font-medium"><Badge variant={variant[correction.status]}>{correction.status}</Badge></TableCell>
                  <TableCell className="text-center">{formatDate(correction.previous.inTime)}</TableCell>
                  <TableCell className="text-center">details</TableCell>
                </TableRow>
              ))
            }
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

export default AttendanceCorrectionRequests
