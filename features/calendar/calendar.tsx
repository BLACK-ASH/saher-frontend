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
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function EventsCalendar() {
  const calendarRef = useRef<FullCalendar>(null);

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

  const {
    data: events,
    isLoading,
    refetch,
    isRefetching,
  } = useCalendar(year, month);

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
            console.log({
              startDate: info.start,
              startDateStr: info.startStr,
              endDate: info.end,
              endDateStr: info.end,
            });

            info.view.calendar.unselect();
          }}
          // 🆕 UPDATE EVENT (drag)
          eventDrop={(info) => {
            console.log({
              oldDate: info.oldEvent.start,
              oldDateStr: info.oldEvent.startStr,
              newDate: info.event.start,
              newDateStr: info.event.startStr,
              type: info.event.extendedProps.type,
              id: info.event.extendedProps.details.id,
            });
          }}
          // 🆕 UPDATE EVENT (resize)
          eventResize={(info) => {
            console.log({
              oldDate: info.oldEvent.start,
              oldDateStr: info.oldEvent.startStr,
              newDate: info.event.start,
              newDateStr: info.event.startStr,
              type: info.event.extendedProps.type,
              id: info.event.extendedProps.details.id,
            });
          }}
          eventClick={(info) => {
            console.log({
              newDate: info.event.start,
              newDateStr: info.event.startStr,
              type: info.event.extendedProps.type,
              id: info.event.extendedProps.details.id,
            });
          }}
          // weekends={weekendsVisible}
          /*initialEvents={INITIAL_EVENTS} // alternatively, use the `events` setting to fetch from a feed
          select={handleDateSelect}
          eventContent={renderEventContent} // custom render function
          eventsSet={handleEvents} // called after events are initialized/added/changed/removed*/
          /* you can update a remote database when these fire:
          eventAdd={function(){}}
          eventChange={function(){}}
          eventRemove={function(){}}
          */
        />
      </CardContent>
    </Card>
  );
}
