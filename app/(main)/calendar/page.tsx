import EventsCalendar from "@/features/calendar/calendar";
import { HolidayTable } from "@/features/holiday/holiday-table";

type Props = {};

function page({}: Props) {
  return (
    <>
      <EventsCalendar />
      <HolidayTable />
    </>
  );
}

export default page;
