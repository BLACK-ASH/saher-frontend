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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
import { getMonthYear, dateToIstDateOnly, istDateOnlyToDate } from "@/lib/date";

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
  const [deleteTarget, setDeleteTarget] = useState<CalendarEvent | null>(null);
  const [editEvent, setEditEvent] = useState<CalendarEvent | null>(null);
  const goPrev = () => {
    calendarRef.current?.getApi().prev();
  };

  const goNext = () => {
    calendarRef.current?.getApi().next();
  };

  const goToday = () => {
    calendarRef.current?.getApi().today();
  };
  const [calendarDate, setCalendarDate] = useState(() => dateToIstDateOnly(new Date()));

  const year = istDateOnlyToDate(calendarDate).getFullYear();
  const month = istDateOnlyToDate(calendarDate).getMonth();

  // Calendar Nav
  const { calendar, del, update } = useCalendar({ year, month });
  const { data: events } = calendar;

  return (
    <Card className="m-2 md:m-4">
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
          {getMonthYear(calendarDate)}
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
          timeZone="Asia/Kolkata"
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
            setCalendarDate(dateToIstDateOnly(info.view.calendar.getDate()));
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
                onError: (err: Error) => {
                  toast.error(err.message);
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
                onError: (err: Error) => {
                  toast.error(err.message);
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
          visible={selectedVisible || !!editEvent}
          setVisible={(v) => {
            if (!v) setEditEvent(null);
            setSelectedVisible(v);
          }}
          eventId={editEvent?.id ?? undefined}
          initialData={
            editEvent
              ? {
                  title: editEvent.title,
                  type: editEvent.type,
                  start: editEvent.start,
                  end: editEvent.end,
                  description: editEvent.description,
                }
              : undefined
          }
        />
        <EventDetailsSheet
          event={selectedEvent}
          open={selectedEvent !== null}
          onOpenChange={(open) => {
            if (!open) {
              setSelectedEvent(null);
            }
          }}
          onEdit={(event) => {
            setSelectedEvent(null);
            setEditEvent(event);
          }}
          onDelete={(event) => {
            setSelectedEvent(null);
            setDeleteTarget(event);
          }}
        />
        <AlertDialog
          open={!!deleteTarget}
          onOpenChange={(open) => {
            if (!open) setDeleteTarget(null);
          }}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete event?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. The event will be permanently
                removed.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                disabled={del.isPending}
                onClick={() => {
                  if (deleteTarget) {
                    del.mutate(deleteTarget.id, {
                      onSuccess: () => {
                        toast.success("Calendar Event Deleted");
                        setDeleteTarget(null);
                      },
                      onError: (err: Error) => {
                        toast.error(err.message);
                        setDeleteTarget(null);
                      },
                    });
                  }
                }}
              >
                {del.isPending ? "Deleting..." : "Delete"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
}
