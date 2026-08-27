"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatIstDateTime } from "@/lib/date";

interface TimelineEvent {
  label: string;
  date?: string;
  user?: string;
}

interface LifecycleTimelineProps {
  bill: {
    date: string;
    updatedAt?: string;
    settleDate?: string;
    user?: string;
    manager?: string;
  };
}

export function LifecycleTimeline({ bill }: LifecycleTimelineProps) {
  // D-17: Actor/time sub-lines only where source data exists, never fabricated.
  const events: TimelineEvent[] = [
    { label: "Submitted", date: bill.date, user: bill.user },
    { label: "Handled", date: bill.updatedAt, user: bill.manager },
    { label: "Settled", date: bill.settleDate, user: bill.manager },
  ].filter((e) => !!e.date); // Filter out unrecorded events

  return (
    <Card className="bg-muted/50">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">Lifecycle</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative ml-3 border-l-2 border-muted pb-4">
          {events.map((event, i) => (
            <div key={event.label} className="relative mb-6 last:mb-0">
              <div className={`absolute -left-[25px] top-1 h-3 w-3 rounded-full ${i === events.length - 1 ? 'bg-green-500' : 'bg-muted-foreground'}`} />
              <div className="ml-4">
                <p className="text-sm font-medium">{event.label}</p>
                <p className="text-xs text-muted-foreground">
                  {formatIstDateTime(event.date)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}