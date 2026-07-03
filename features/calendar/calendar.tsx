"use client";

import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import listPlugin from "@fullcalendar/list";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useCalendar } from "@/hooks/use-calendar";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import AddEventDialog from "./add-event-dialog";
import { subDays } from "date-fns";
import EventDetailsSheet, { CalendarEvent } from "./event-details";
import { toast } from "sonner";

// types/calendar.ts

export type CalendarSelection = {
  start: Date;
  end: Date;
  allDay: boolean;
};

export default function EventsCalendar() {
  const calendarRef = useRef<FullCalendar>(null);
  const [selectedVisible, setSelectedVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState<CalendarSelection | null>(
    null,
  );
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(
    null,
  );
  const goPrev = () => {
    calendarRef.current?.getApi().prev();
  };

  const goNext = () => {
    calendarRef.current?.getApi().next();
  };

  const goToday = () => {
    calendarRef.current?.getApi().today();
  };
  const [calendarDate, setCalendarDate] = useState(new Date());

  const year = calendarDate.getFullYear();
  const month = calendarDate.getMonth();

  // Calendar Nav
  const { calendar, del, update } = useCalendar({ year, month });
  const { data: events, isLoading, refetch, isRefetching } = calendar;

  return (
    <Card className="md:m-2">
      <CardHeader className="flex items-center justify-between">
        {/* Left controls */}
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={goPrev}>
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <Button variant="outline" onClick={goToday}>
            Today
          </Button>

          <Button variant="outline" size="icon" onClick={goNext}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        {/* Center title */}
        <div className="flex items-center gap-2 font-semibold text-lg">
          {calendarDate.toLocaleString("default", {
            month: "long",
            year: "numeric",
          })}
        </div>
        {/* Right side (optional view switch UI) */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">View</Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuGroup>
              <DropdownMenuItem
                onClick={() =>
                  calendarRef.current?.getApi().changeView("dayGridMonth")
                }
              >
                Month
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() =>
                  calendarRef.current?.getApi().changeView("timeGridWeek")
                }
              >
                Week
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() =>
                  calendarRef.current?.getApi().changeView("timeGridDay")
                }
              >
                Day
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() =>
                  calendarRef.current?.getApi().changeView("listMonth")
                }
              >
                Schedule
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      <CardContent>
        <FullCalendar
          timeZone="local"
          contentHeight="auto"
          expandRows={true}
          ref={calendarRef}
          headerToolbar={false} // 👈 important
          plugins={[
            dayGridPlugin,
            timeGridPlugin,
            interactionPlugin,
            listPlugin,
          ]}
          events={events}
          datesSet={(info) => {
            setCalendarDate(info.view.calendar.getDate());
          }}
          initialView="dayGridMonth"
          editable={true}
          selectable={true}
          selectMinDistance={10}
          selectMirror={true}
          dayMaxEvents={true}
          // 🆕 CREATE EVENT (click + drag selection)
          select={(info) => {
            setSelectedItem({
              start: info.start,
              end: subDays(info.end, 1), // Convert exclusive end -> inclusive end
              allDay: info.allDay,
            });

            setSelectedVisible(true);

            info.view.calendar.unselect();
          }}
          // 🆕 UPDATE EVENT (drag)
          eventDrop={(info) => {
            const id = info.event.extendedProps.details.id;
            const data = {
              start: info.event.start as Date,
              end: info.event.end as Date,
            };

            update.mutate(
              { id, data },
              {
                onSuccess: (res) => {
                  toast.success(res.message);
                },
              },
            );
          }}
          // 🆕 UPDATE EVENT (resize)
          eventResize={(info) => {
            const id = info.event.extendedProps.details.id;
            const data = {
              start: info.event.start as Date,
              end: info.event.end as Date,
            };

            update.mutate(
              { id, data },
              {
                onSuccess: (res) => {
                  toast.success(res.message);
                },
              },
            );
          }}
          eventClick={(info) => {
            info.view.calendar.unselect();
            setSelectedEvent({
              id: info.event.extendedProps.details.id,
              title: info.event.title,
              start: info.event.start!,
              end: info.event.end!,
              allDay: info.event.allDay,
              type: info.event.extendedProps.type,
              description: info.event.extendedProps.details.description,
            });
          }}
        />
        <AddEventDialog
          data={selectedItem}
          visible={selectedVisible}
          setVisible={setSelectedVisible}
        />
        <EventDetailsSheet
          event={selectedEvent}
          open={selectedEvent !== null}
          onOpenChange={(open) => {
            if (!open) {
              setSelectedEvent(null);
            }
          }}
          //          onEdit={(event) => {
          //            console.log("Edit", event);

          // Later:
          // setEditEvent(event)
          // setSelectedEvent(null)
          //          }}
          onDelete={(event) => {
            console.log("Delete", event);
            del.mutate(event.id, {
              onSuccess: () => {
                toast.success("Calendar Event Deleted");
              },
            });
            setSelectedEvent(null);
            // Later:
            // open delete confirmation dialog
          }}
        />
      </CardContent>
    </Card>
  );
}
