"use client"

import { Bar, BarChart, CartesianGrid, XAxis } from "recharts"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { useAttendance } from "@/hooks/use-attendance"
import { getMonthYear } from "@/lib/utils/time"

export const description = "A linear line chart"

const chartConfig = {
  desktop: {
    label: "Desktop",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig

export function AttendanceChart({ className, ...props }: React.ComponentProps<"div">) {
  const { attendancesList } = useAttendance({ filter: "month" })
  const { data, isLoading } = attendancesList

  const chartData = data?.map((a) => ({
    date: a.date,
    workHours: a.workHours,
  }))

  if (isLoading) return <p>Loading ...</p>
  if (!chartData) return <p>Chart Not Available.</p>

  const firstDay = new Date(chartData[0]?.date)

  return (
    <Card className={className} {...props}>
      <CardHeader>
        <CardTitle>This Month Work Hour</CardTitle>
        <CardDescription>{getMonthYear(firstDay)}</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}
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
              tickFormatter={(value) =>
                new Date(value).toLocaleDateString("en-IN", { day: "2-digit" })
              }
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
  )
}

