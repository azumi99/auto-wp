"use client"

import * as React from "react"
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts"
import { useIsMobile } from "@/hooks/use-mobile"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"

export const description = "Workflow performance chart"

const chartData = [
  { date: "2025-09-25", published: 12, failed: 3 },
  { date: "2025-09-26", published: 18, failed: 2 },
  { date: "2025-09-27", published: 22, failed: 4 },
  { date: "2025-09-28", published: 17, failed: 1 },
  { date: "2025-09-29", published: 25, failed: 5 },
  { date: "2025-09-30", published: 20, failed: 3 },
  { date: "2025-10-01", published: 24, failed: 1 },
  { date: "2025-10-02", published: 30, failed: 2 },
  { date: "2025-10-03", published: 26, failed: 4 },
  { date: "2025-10-04", published: 33, failed: 1 },
  { date: "2025-10-05", published: 29, failed: 2 },
  { date: "2025-10-06", published: 32, failed: 3 },
  { date: "2025-10-07", published: 27, failed: 4 },
  { date: "2025-10-08", published: 35, failed: 2 },
  { date: "2025-10-09", published: 28, failed: 3 },
  { date: "2025-10-10", published: 31, failed: 2 },
  { date: "2025-10-11", published: 34, failed: 1 },
  { date: "2025-10-12", published: 37, failed: 3 },
  { date: "2025-10-13", published: 40, failed: 2 },
]

const chartConfig = {
  published: {
    label: "Published Articles",
    color: "var(--primary)",
  },
  failed: {
    label: "Failed Articles",
    color: "var(--destructive)",
  },
} satisfies ChartConfig

export function ChartWorkflowPerformance() {
  const isMobile = useIsMobile()
  const [timeRange, setTimeRange] = React.useState("14d")

  React.useEffect(() => {
    if (isMobile) setTimeRange("7d")
  }, [isMobile])

  const filteredData = chartData.filter((item) => {
    const date = new Date(item.date)
    const referenceDate = new Date("2025-10-13")
    let daysToSubtract = 14
    if (timeRange === "7d") daysToSubtract = 7
    else if (timeRange === "30d") daysToSubtract = 30
    const startDate = new Date(referenceDate)
    startDate.setDate(startDate.getDate() - daysToSubtract)
    return date >= startDate
  })

  return (
    <Card className="@container/card">
      <CardHeader>
        <CardTitle>Workflow Article Generation</CardTitle>
        <CardDescription>Articles generated and published to WordPress</CardDescription>
        <CardAction>
          <ToggleGroup
            type="single"
            value={timeRange}
            onValueChange={setTimeRange}
            variant="outline"
            className="hidden *:data-[slot=toggle-group-item]:!px-4 @[767px]/card:flex"
          >
            <ToggleGroupItem value="30d">Last 30 days</ToggleGroupItem>
            <ToggleGroupItem value="14d">Last 14 days</ToggleGroupItem>
            <ToggleGroupItem value="7d">Last 7 days</ToggleGroupItem>
          </ToggleGroup>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="flex w-36 @[767px]/card:hidden" size="sm">
              <SelectValue placeholder="Last 14 days" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="30d" className="rounded-lg">
                Last 30 days
              </SelectItem>
              <SelectItem value="14d" className="rounded-lg">
                Last 14 days
              </SelectItem>
              <SelectItem value="7d" className="rounded-lg">
                Last 7 days
              </SelectItem>
            </SelectContent>
          </Select>
        </CardAction>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        <ChartContainer config={chartConfig} className="aspect-auto h-[250px] w-full">
          <AreaChart data={filteredData}>
            <defs>
              <linearGradient id="fillPublished" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-published)" stopOpacity={0.8} />
                <stop offset="95%" stopColor="var(--color-published)" stopOpacity={0.1} />
              </linearGradient>
              <linearGradient id="fillFailed" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-failed)" stopOpacity={0.6} />
                <stop offset="95%" stopColor="var(--color-failed)" stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
              tickFormatter={(value) => {
                const date = new Date(value)
                return date.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })
              }}
            />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  labelFormatter={(value) => {
                    return new Date(value).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })
                  }}
                  indicator="dot"
                />
              }
            />
            <Area
              dataKey="failed"
              type="natural"
              fill="url(#fillFailed)"
              stroke="var(--color-failed)"
              stackId="a"
            />
            <Area
              dataKey="published"
              type="natural"
              fill="url(#fillPublished)"
              stroke="var(--color-published)"
              stackId="a"
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}