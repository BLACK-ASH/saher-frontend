import AttendanceStatus from "@/features/attendance/attendance-status";

export default function Page() {
  return (
    <section className="p-2 ">
      <section className="grid md:grid-cols-3 gap-2">
        <AttendanceStatus />
      </section>
    </section>
  );
}
