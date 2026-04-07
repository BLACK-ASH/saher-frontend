import AttendanceStatus from "@/features/home/attendance-status";

export default function Page() {
  return (
    <section className="p-2 ">
      <section className="grid grid-cols-3 gap-2">
        <AttendanceStatus />
      </section>
    </section>
  );
}
