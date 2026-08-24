import EventsCalendar from "@/features/calendar/calendar";
import { HolidayTable } from "@/features/holiday/holiday-table";

function page() {
  return (
    <>
      <EventsCalendar />
      <HolidayTable />
    </>
  );
}

export default page;
