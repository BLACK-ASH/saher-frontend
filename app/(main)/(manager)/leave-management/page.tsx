import AdminLeavePage from "@/features/leave/admin-page";
import LeaveTypePage from "@/features/leave/leave-type";

function page() {
  return (
    <main className="p-4">
      <LeaveTypePage />
      <AdminLeavePage />
    </main>
  );
}

export default page;
