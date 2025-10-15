"use client"

import { useState, useEffect } from "react"
import { IconPlus, IconWorldWww, IconRefresh, IconDots, IconPencil, IconTrash, IconCheck, IconX } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { toast } from "sonner"
import { getWebsites, deleteWebsite } from "@/src/lib/websites/actions"
import { WebsiteForm } from "@/src/screens/websites/website-form"
import type { Website } from "@/src/lib/websites/types"

export default function WebsitesPage() {
  const [websites, setWebsites] = useState<Website[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedWebsite, setSelectedWebsite] = useState<Website | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)

  const loadWebsites = async () => {
    try {
      setLoading(true)
      const data = await getWebsites()
      setWebsites(data)
    } catch (error: any) {
      toast.error(error.message || "Failed to load websites")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadWebsites()
  }, [])

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this website?")) return

    try {
      await deleteWebsite(id)
      toast.success("Website deleted successfully")
      loadWebsites()
    } catch (error: any) {
      toast.error(error.message || "Failed to delete website")
    }
  }

  const handleEdit = (website: Website) => {
    setSelectedWebsite(website)
    setDialogOpen(true)
  }

  const handleAdd = () => {
    setSelectedWebsite(null)
    setDialogOpen(true)
  }

  const handleSuccess = () => {
    setDialogOpen(false)
    setSelectedWebsite(null)
    loadWebsites()
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-green-500/10 text-green-500"
      case "inactive": return "bg-gray-500/10 text-gray-500"
      case "maintenance": return "bg-yellow-500/10 text-yellow-500"
      default: return "bg-gray-500/10 text-gray-500"
    }
  }

  const getHealthIcon = (status: string) => {
    switch (status) {
      case "healthy": return <IconCheck className="h-4 w-4 text-green-500" />
      case "warning": return <span className="text-yellow-500">!</span>
      case "error": return <IconX className="h-4 w-4 text-red-500" />
      default: return <span className="text-gray-500">?</span>
    }
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Websites</h1>
          <p className="text-muted-foreground">
            Manage your WordPress websites
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={loadWebsites}>
            <IconRefresh className="h-4 w-4" />
          </Button>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={handleAdd}>
                <IconPlus className="h-4 w-4 mr-2" />
                Add Website
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {selectedWebsite ? "Edit Website" : "Add New Website"}
                </DialogTitle>
                <DialogDescription>
                  {selectedWebsite
                    ? "Update website information below"
                    : "Add a new WordPress website to manage"}
                </DialogDescription>
              </DialogHeader>
              <WebsiteForm
                website={selectedWebsite}
                onSuccess={handleSuccess}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid gap-4">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {loading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-6 bg-muted rounded w-3/4" />
                  <div className="h-4 bg-muted rounded w-1/2" />
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="h-4 bg-muted rounded" />
                    <div className="h-4 bg-muted rounded w-5/6" />
                  </div>
                </CardContent>
              </Card>
            ))
          ) : websites.length === 0 ? (
            <Card className="col-span-full">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <IconWorldWww className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No websites yet</h3>
                <p className="text-muted-foreground mb-4">
                  Get started by adding your first WordPress website
                </p>
                <Button onClick={handleAdd}>
                  <IconPlus className="h-4 w-4 mr-2" />
                  Add Website
                </Button>
              </CardContent>
            </Card>
          ) : (
            websites.map((website) => (
              <Card key={website.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg flex items-center gap-2">
                        {getHealthIcon(website.health_status)}
                        {website.name}
                      </CardTitle>
                      <CardDescription className="mt-1">
                        <a
                          href={website.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:underline"
                        >
                          {website.url}
                        </a>
                      </CardDescription>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <IconDots className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEdit(website)}>
                          <IconPencil className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDelete(website.id)}
                          className="text-red-600"
                        >
                          <IconTrash className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {website.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {website.description}
                      </p>
                    )}
                    <div className="flex items-center justify-between">
                      <Badge className={getStatusColor(website.status)}>
                        {website.status}
                      </Badge>
                      {website.wordpress_version && (
                        <span className="text-xs text-muted-foreground">
                          WP {website.wordpress_version}
                        </span>
                      )}
                    </div>
                    {website.last_health_check && (
                      <p className="text-xs text-muted-foreground">
                        Last check: {new Date(website.last_health_check).toLocaleString()}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
