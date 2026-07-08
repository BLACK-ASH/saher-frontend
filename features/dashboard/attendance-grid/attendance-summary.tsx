"use client";

import { CheckCircle2, XCircle, Clock3, AlarmClock } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type AttendanceSummaryProps = {
  present: number;
  absent: number;
  halfDay: number;
  late: number;
};

export default function AttendanceSummary({
  present,
  absent,
  halfDay,
  late,
}: AttendanceSummaryProps) {
  const cards = [
    {
      title: "Present",
      value: present,
      icon: CheckCircle2,
      color: "text-green-600",
    },
    {
      title: "Absent",
      value: absent,
      icon: XCircle,
      color: "text-red-600",
    },
    {
      title: "Half Day",
      value: halfDay,
      icon: Clock3,
      color: "text-yellow-600",
    },
    {
      title: "Late",
      value: late,
      icon: AlarmClock,
      color: "text-orange-600",
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon;

        return (
          <Card key={card.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {card.title}
              </CardTitle>

              <Icon className={`h-5 w-5 ${card.color}`} />
            </CardHeader>

            <CardContent>
              <div className="text-3xl font-bold">{card.value}</div>

              <p className="mt-1 text-xs text-muted-foreground">
                Total {card.title.toLowerCase()} records
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
