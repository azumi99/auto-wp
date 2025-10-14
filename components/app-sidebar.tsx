"use client"

import * as React from "react"
import { usePathname } from "next/navigation"
import {
  IconActivity,
  IconArticle,
  IconBrandWordpress,
  IconBuilding,
  IconChartBar,
  IconClockPlay,
  IconFileAi,
  IconHelp,
  IconInnerShadowTop,
  IconKey,
  IconLayoutDashboard,
  IconLogs,
  IconNotification,
  IconSearch,
  IconSettings,
  IconUsers,
  IconWebhook,
  IconWorldWww,
} from "@tabler/icons-react"

import { NavDocuments } from "@/components/nav-documents"
import { NavMain } from "@/components/nav-main"
import { NavSecondary } from "@/components/nav-secondary"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname()

  const data = {
    user: {
      name: "Ilham Bintang",
      email: "ilham@example.com",
      avatar: "/avatars/shadcn.jpg",
    },
    navMain: [
      {
        title: "Dashboard",
        url: "/dashboard",
        icon: IconLayoutDashboard,
        isActive: pathname === "/dashboard",
      },
      {
        title: "Companies",
        url: "/companies",
        icon: IconBuilding,
        isActive: pathname.startsWith("/companies"),
      },
      {
        title: "Websites",
        url: "/websites",
        icon: IconWorldWww,
        isActive: pathname.startsWith("/websites"),
      },
      {
        title: "Articles",
        url: "/articles",
        icon: IconArticle,
        isActive: pathname.startsWith("/articles"),
      },
      {
        title: "Workflows",
        url: "/workflows",
        icon: IconClockPlay,
        isActive: pathname.startsWith("/workflows"),
      },
    ],
    navManagement: [
      {
        name: "Credentials",
        url: "/credentials",
        icon: IconKey,
        isActive: pathname.startsWith("/credentials"),
      },
      {
        name: "AI Prompts",
        url: "/prompts",
        icon: IconFileAi,
        isActive: pathname.startsWith("/prompts"),
      },
      {
        name: "Execution Logs",
        url: "/logs",
        icon: IconLogs,
        isActive: pathname.startsWith("/logs"),
      },
    ],
    navAnalytics: [
      {
        name: "Analytics",
        url: "/analytics",
        icon: IconChartBar,
        isActive: pathname.startsWith("/analytics"),
      },
      {
        name: "Activity Feed",
        url: "/activity",
        icon: IconActivity,
        isActive: pathname.startsWith("/activity"),
      },
      {
        name: "Notifications",
        url: "/notifications",
        icon: IconNotification,
        isActive: pathname.startsWith("/notifications"),
      },
    ],
    navSecondary: [
      {
        title: "n8n Webhooks",
        url: "/webhooks",
        icon: IconWebhook,
        isActive: pathname.startsWith("/webhooks"),
      },
      {
        title: "WordPress",
        url: "/wordpress",
        icon: IconBrandWordpress,
        isActive: pathname.startsWith("/wordpress"),
      },
      {
        title: "Team",
        url: "/team",
        icon: IconUsers,
        isActive: pathname.startsWith("/team"),
      },
      {
        title: "Settings",
        url: "/settings",
        icon: IconSettings,
        isActive: pathname.startsWith("/settings"),
      },
      {
        title: "Help Center",
        url: "/help",
        icon: IconHelp,
        isActive: pathname.startsWith("/help"),
      },
      {
        title: "Search",
        url: "/search",
        icon: IconSearch,
        isActive: pathname.startsWith("/search"),
      },
    ],
  }

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <a href="/">
                <IconInnerShadowTop className="!size-5" />
                <span className="text-base font-semibold">WP Auto</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavDocuments items={data.navManagement} title="Management" />
        <NavDocuments items={data.navAnalytics} title="Insights" />
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
    </Sidebar>
  )
}