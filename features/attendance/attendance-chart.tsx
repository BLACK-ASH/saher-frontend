"use client";

import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { useAttendance } from "@/hooks/use-attendance";
import { getMonthYear, formatIstDate } from "@/lib/date";
import { DefaultLoader } from "@/components/loading";
import { NoData } from "@/components/no-data";

export const description = "A linear line chart";

const chartConfig = {
  desktop: {
    label: "Desktop",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig;

export function AttendanceChart({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const { attendancesList } = useAttendance();
  const { data, isLoading } = attendancesList;

  const chartData = data?.items.map((a) => ({
    date: a.date,
    workHours: a.workHours,
  }));

  if (isLoading) return <DefaultLoader className="col-span-2" />;
  if (!chartData || chartData.length === 0)
    return (
      <NoData
        className="col-span-2"
        title="No Chart To Show."
        description="Please Refresh or You Don't Have Any Attendance To Show This Chart."
      />
    );

  const firstDay = chartData[0]?.date;

  return (
    <Card className={className} {...props}>
      <CardHeader>
        <CardTitle>This Month Work Hour</CardTitle>
        <CardDescription>{getMonthYear(firstDay)}</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-[20vh] w-full"
        >
          <BarChart
            accessibilityLayer
            data={chartData}
            margin={{
              left: 12,
              right: 12,
            }}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(value) => formatIstDate(value)}
            />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            <Bar dataKey="workHours" fill="var(--color-desktop)" radius={4} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
