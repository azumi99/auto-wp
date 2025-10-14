"use client"

import {
  IconFileText,
  IconRobot,
  IconServerBolt,
  IconTrendingUp,
  IconTrendingDown,
  IconBrandWordpress,
} from "@tabler/icons-react"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export function SectionCards() {
  return (
    <div className="grid grid-cols-1 gap-4 px-4 lg:px-6 md:grid-cols-2 xl:grid-cols-4">
      {/* Total WordPress Articles */}
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Total Articles</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl flex items-center gap-2">
            <IconBrandWordpress className="size-5 text-primary" />
            124
          </CardTitle>
          <CardAction>
            <Badge variant="outline" className="flex items-center gap-1">
              <IconTrendingUp className="size-4 text-green-500" />
              +8.3%
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="flex gap-2 font-medium">
            More articles published this week
            <IconTrendingUp className="size-4 text-green-500" />
          </div>
          <div className="text-muted-foreground">
            Compared to last 7 days
          </div>
        </CardFooter>
      </Card>

      {/* AI Generated Content */}
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>AI Generated</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl flex items-center gap-2">
            <IconRobot className="size-5 text-primary" />
            38
          </CardTitle>
          <CardAction>
            <Badge variant="outline" className="flex items-center gap-1">
              <IconTrendingUp className="size-4 text-green-500" />
              +12%
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="flex gap-2 font-medium">
            AI content generation increased
            <IconTrendingUp className="size-4 text-green-500" />
          </div>
          <div className="text-muted-foreground">
            Based on workflow triggers
          </div>
        </CardFooter>
      </Card>

      {/* Active Workflows */}
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Active Workflows</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl flex items-center gap-2">
            <IconServerBolt className="size-5 text-primary" />
            5
          </CardTitle>
          <CardAction>
            <Badge variant="outline" className="flex items-center gap-1">
              <IconTrendingDown className="size-4 text-red-500" />
              -1
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="flex gap-2 font-medium">
            One workflow stopped <IconTrendingDown className="size-4 text-red-500" />
          </div>
          <div className="text-muted-foreground">
            Check n8n connections
          </div>
        </CardFooter>
      </Card>

      {/* Publish Success Rate */}
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Publish Success Rate</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl flex items-center gap-2">
            96%
          </CardTitle>
          <CardAction>
            <Badge variant="outline" className="flex items-center gap-1">
              <IconTrendingUp className="size-4 text-green-500" />
              +4%
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="flex gap-2 font-medium">
            Stable connection with WordPress
            <IconTrendingUp className="size-4 text-green-500" />
          </div>
          <div className="text-muted-foreground">
            Posting success via API
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}
