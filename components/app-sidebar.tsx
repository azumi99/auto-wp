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
        title: "Monitoring",
        url: "/dashboard/monitoring",
        icon: IconActivity,
        isActive: pathname === "/dashboard/monitoring",
      },
      {
        title: "Logs",
        url: "/dashboard/logs",
        icon: IconLogs,
        isActive: pathname === "/dashboard/logs",
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
        name: "AI Prompts",
        url: "/ai-prompts",
        icon: IconFileAi,
        isActive: pathname.startsWith("/ai-prompts"),
      },
      {
        name: "Published Articles",
        url: "/published-articles",
        icon: IconBrandWordpress,
        isActive: pathname.startsWith("/published-articles"),
      },
      {
        name: "n8n Webhooks",
        url: "/webhooks",
        icon: IconWebhook,
        isActive: pathname.startsWith("/webhooks"),
      },
    ],
    navSecondary: [
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
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
    </Sidebar>
  )
}