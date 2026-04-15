"use client"

import { TrendingUp } from "lucide-react"
import { Cell, LabelList, Pie, PieChart } from "recharts"

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { useAdminAttendanceCorrection } from "@/hooks/use-admin-attendance-correction"
import { DefaultLoader } from "@/components/loading"
import { NoData } from "@/components/no-data"

export const description = "A pie chart with a label list"

const chartConfig = {
  status: {
    label: "Status",
  },
  pending: {
    label: "Pending",
    color: "var(--chart-1)",
  },
  approve: {
    label: "Approve",
    color: "var(--chart-2)",
  },
  reject: {
    label: "Reject",
    color: "var(--chart-3)",
  },
} satisfies ChartConfig

export function AttendanceCorrectionChart() {
  const { allCorrections } = useAdminAttendanceCorrection()
  const { data, isLoading } = allCorrections

  if (isLoading) return <DefaultLoader className="col-span-2" />
  if (!data) return <NoData className="col-span-2" title="No Chart To Show." description="Please Refresh or You Don't Have Any Attendance To Show This Chart." />

  const counts = {
    pending: 0,
    approve: 0,
    reject: 0,
  }

  data.forEach((item) => {
    if (item.status in counts) {
      counts[item.status]++
    }
  })

  const chartData = [
    { status: "pending", count: counts.pending, fill: "var(--chart-1)" },
    { status: "approve", count: counts.approve, fill: "var(--chart-2)" },
    { status: "reject", count: counts.reject, fill: "var(--chart-5)" },
  ]

  return (
    <Card className="flex flex-col">
      <CardHeader className="items-center pb-0">
        <CardTitle>Attendance Correction Status</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square max-h-62.5 [&_.recharts-text]:fill-background"
        >
          <PieChart>
            <ChartTooltip
              content={<ChartTooltipContent nameKey="count" hideLabel />}
            />
            <Pie data={chartData} dataKey="count">
              <LabelList
                dataKey="status"
                className="fill-background"
                stroke="none"
                fontSize={12}
                formatter={(value) =>
                  chartConfig[value as keyof typeof chartConfig]?.label
                }
              />
            </Pie>
          </PieChart>
        </ChartContainer>
      </CardContent>
      {/* <CardFooter className="flex-col gap-2 text-sm"> */}
      {/*   <div className="flex items-center gap-2 leading-none font-medium"> */}
      {/*     Trending up by 5.2% this month <TrendingUp className="h-4 w-4" /> */}
      {/*   </div> */}
      {/*   <div className="leading-none text-muted-foreground"> */}
      {/*     Showing total count for the last 6 months */}
      {/*   </div> */}
      {/* </CardFooter> */}
    </Card>
  )
}

