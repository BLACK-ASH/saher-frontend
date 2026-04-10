"use client"

import { Bar, BarChart, CartesianGrid, Line, LineChart, XAxis } from "recharts"

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

export const description = "A linear line chart"

const chartData = [
  { date: "01-01-2026", workHours: 9 },
  { date: "02-01-2026", workHours: 8 },
  { date: "03-01-2026", workHours: 8.5 },
  { date: "04-01-2026", workHours: 7 },
  { date: "05-01-2026", workHours: 7.7 },
  { date: "06-01-2026", workHours: 8.7 },
  { date: "07-01-2026", workHours: 9 },
  { date: "08-01-2026", workHours: 8 },
  { date: "09-01-2026", workHours: 8.5 },
  { date: "10-01-2026", workHours: 7 },
  { date: "11-01-2026", workHours: 7.7 },
  { date: "12-01-2026", workHours: 8.7 },
  { date: "13-01-2026", workHours: 9 },
  { date: "14-01-2026", workHours: 8 },
  { date: "15-01-2026", workHours: 8.5 },
]

const chartConfig = {
  desktop: {
    label: "Desktop",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig

export function AttendanceChart({ className, ...props }: React.ComponentProps<"div">) {
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
              tickFormatter={(value) => value.slice(0, 2)}
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

