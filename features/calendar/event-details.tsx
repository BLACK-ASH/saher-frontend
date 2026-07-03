"use client";

import { format } from "date-fns";
import {
  CalendarDays,
  Clock3,
  FileText,
  Pencil,
  Trash2,
  X,
} from "lucide-react";

import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

export interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  allDay: boolean;
  type: string;
  description?: string | null;
}

interface Props {
  event: CalendarEvent | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;

  // onEdit?: (event: CalendarEvent) => void;
  onDelete?: (event: CalendarEvent) => void;
}

export default function EventDetailsSheet({
  event,
  open,
  onOpenChange,
  // onEdit,
  onDelete,
}: Props) {
  if (!event) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex w-full flex-col p-0 sm:max-w-lg"
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b p-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="h-4 w-4 rounded-full bg-blue-500" />

              <SheetTitle className="text-2xl font-semibold">
                {event.title}
              </SheetTitle>
            </div>

            <SheetDescription>Event Details</SheetDescription>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 space-y-6 overflow-y-auto p-6">
          <div className="flex items-start gap-4">
            <CalendarDays className="mt-1 h-5 w-5 text-muted-foreground" />

            <div>
              <p className="text-sm text-muted-foreground">Date</p>

              <p className="font-medium">
                {format(event.start, "EEEE, dd MMMM yyyy")}
              </p>

              {!event.allDay && (
                <p className="text-sm text-muted-foreground">
                  {format(event.start, "hh:mm a")} -{" "}
                  {format(event.end, "hh:mm a")}
                </p>
              )}

              {event.allDay && <Badge className="mt-2">All Day</Badge>}
            </div>
          </div>

          <Separator />

          <div className="flex items-start gap-4">
            <Clock3 className="mt-1 h-5 w-5 text-muted-foreground" />

            <div>
              <p className="text-sm text-muted-foreground">Event Type</p>

              <Badge variant="secondary" className="capitalize mt-1">
                {event.type}
              </Badge>
            </div>
          </div>

          <Separator />

          <div className="flex items-start gap-4">
            <FileText className="mt-1 h-5 w-5 text-muted-foreground" />

            <div className="w-full">
              <p className="text-sm text-muted-foreground">Description</p>

              <div className="mt-2 rounded-lg border bg-muted/40 p-4">
                {event.description ? (
                  <p className="whitespace-pre-wrap text-sm leading-6">
                    {event.description}
                  </p>
                ) : (
                  <p className="text-sm italic text-muted-foreground">
                    No description provided.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t p-6">
          {/* <div className="grid grid-cols-2 gap-3"> */}
          {/*   <Button variant="outline" onClick={() => onEdit?.(event)}> */}
          {/*     <Pencil className="mr-2 h-4 w-4" /> */}
          {/*     Edit */}
          {/*   </Button> */}

          <Button
            variant="destructive"
            onClick={() => {
              onDelete?.(event);
            }}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </Button>
          {/* </div> */}
        </div>
      </SheetContent>
    </Sheet>
  );
}
