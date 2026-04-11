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

export const description = "A linear line chart"

const chartConfig = {
  desktop: {
    label: "Desktop",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig

export function AttendanceChart({ className, ...props }: React.ComponentProps<"div">) {
  const { attendances } = useAttendance({ filter: "month" })
  const { data, isLoading } = attendances

  const chartData = data?.attendances?.map((a) => ({
    date: a.date,
    workHours: a.workHours,
  }))

  if (isLoading) return <p>Loading ...</p>
  if (!chartData) return <p>Chart Not Available.</p>

  return (
    <Card className={className} {...props}>
      <CardHeader>
        <CardTitle>This Month Work Hour</CardTitle>
        <CardDescription>January 2024</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}
          className="aspect-auto h-40 w-full"
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

