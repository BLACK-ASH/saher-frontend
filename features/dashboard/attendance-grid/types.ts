import { AttendanceResponse } from "@/services/attendance.api";

export type AttendanceRow = {
  user: AttendanceResponse["user"];
  attendance: Record<string, AttendanceResponse>;
};
