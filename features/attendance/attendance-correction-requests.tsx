"use client"
import { DefaultLoader } from "@/components/loading"
import { NoData } from "@/components/no-data"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useAttendanceCorrection } from "@/hooks/use-attendance-correction"
import { formatDate, formatTime } from "@/lib/utils/time"
import { attendanceStatusVariant } from "./attendance-table"
import { Textarea } from "@/components/ui/textarea"
import Image from "next/image"
import { imageUrl } from "@/lib/image-url"

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

  if (isLoading) return <DefaultLoader />
  if (!corrections || corrections.length === 0) return <NoData title="No Attendance Correction Request." description="Please Refresh or You Haven't Created Any Attendance Correction Request." />

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
                  <TableCell className="text-center">{formatDate(correction.attendance.date)}</TableCell>
                  <TableCell className="text-center">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="link">Details</Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-lg">
                        <DialogHeader>
                          <DialogTitle>Attendance Correction Details</DialogTitle>
                        </DialogHeader>
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
                      </DialogContent>
                    </Dialog>
                  </TableCell>
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
