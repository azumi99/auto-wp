"use client"

import * as React from "react"
import {
    IconPlus,
    IconEdit,
    IconTrash,
    IconDots,
    IconWorldWww,
    IconSearch,
    IconLoader2,
    IconWorld,
    IconWifi,
    IconWifiOff,
} from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { getWebsitesClient } from "@/src/lib/websites/client-actions"
import { deleteWebsiteClient } from "@/src/lib/websites/client-actions"
import { toast } from "sonner"
import { Website } from "@/src/lib/websites/types"
import { WebsiteForm } from "./website-form"
import { useWebsitesRealtime } from "@/hooks/use-supabase-realtime"
import { createClient } from "@/lib/supabaseClient"
import { supabase } from "@/lib/supabase"
export default function WebsitesPage() {
    const [websites, setWebsites] = React.useState<Website[]>([])
    const [loading, setLoading] = React.useState(true)
    const [userId, setUserId] = React.useState<string | null>(null)
    const [searchQuery, setSearchQuery] = React.useState("")
    const [isFormOpen, setIsFormOpen] = React.useState(false)
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false)
    const [selectedWebsite, setSelectedWebsite] = React.useState<Website | null>(null)
    const [submitting, setSubmitting] = React.useState(false)

    // Initialize user and load data
    React.useEffect(() => {
        const initializeUser = async () => {
            try {
                const supabase = createClient()
                const { data: { user } } = await supabase.auth.getUser()
                if (user) {
                    setUserId(user.id)
                    loadData()
                }
            } catch (error) {
                console.error('Error getting user:', error)
                toast.error('Failed to authenticate')
            }
        }
        initializeUser()
    }, [])

    const loadData = async () => {
        try {
            setLoading(true)
            const websitesData = await getWebsitesClient()
            setWebsites(websitesData)
        } catch (error) {
            console.error('Error loading data:', error)
            toast.error('Failed to load data')
        } finally {
            setLoading(false)
        }
    }

    // Setup realtime subscription - this will fetch data and handle realtime updates
    const { data: realtimeData, isConnected, error: realtimeError, loading: realtimeLoading } = useWebsitesRealtime(
        userId || '',
        undefined
    )

    // Use realtime data as primary source, fallback to initial data only during initial load
    const currentWebsites = realtimeData || websites
    const isLoading = loading || (realtimeLoading && !realtimeData)

    // Debug logging
    React.useEffect(() => {
        console.log('Websites state update:', {
            realtimeDataCount: realtimeData?.length || 0,
            initialDataCount: websites.length,
            currentDataCount: currentWebsites.length,
            isConnected,
            isLoading
        })
    }, [realtimeData, websites, currentWebsites, isConnected, isLoading])

    // Handle realtime connection errors
    React.useEffect(() => {
        if (realtimeError) {
            console.error('Realtime connection error:', realtimeError)
            toast.error(`Realtime updates unavailable: ${realtimeError.message}`)
        }
    }, [realtimeError])

    // Debug realtime status
    React.useEffect(() => {
        console.log('Websites realtime status:', {
            isConnected,
            loading: realtimeLoading,
            error: realtimeError?.message,
            userId: userId || 'null',
            dataCount: realtimeData?.length || 0
        })
    }, [isConnected, realtimeLoading, realtimeError, userId, realtimeData])

    // Sort websites by created_at in descending order (newest first)
    const sortedWebsites = React.useMemo(() => {
        return [...currentWebsites].sort((a, b) =>
            new Date(b.created_at || b.updated_at).getTime() - new Date(a.created_at || a.updated_at).getTime()
        )
    }, [currentWebsites])

    const filteredWebsites = sortedWebsites.filter((website) =>
        website.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        website.url.toLowerCase().includes(searchQuery.toLowerCase())
    )


    // const handleDelete = async () => {
    //     // if (!selectedWebsite) return
    //     // console.log('handleDelete called for website:', selectedWebsite)

    //     try {
    //         // setSubmitting(true)
    //         // console.log('Calling deleteWebsite with id:', selectedWebsite.id)
    //         // const result = await deleteWebsite(selectedWebsite.id)
    //         // console.log('deleteWebsite result:', result)
    //         // toast.success('Website deleted successfully')
    //         // setIsDeleteDialogOpen(false)
    //         // setSelectedWebsite(null)

    //         await supabase
    //             .from('websites')
    //             .delete()
    //             .eq('id', selectedWebsite.id)
    //             .eq('user_id', selectedWebsite.user_id)
    //         // Data will be updated automatically via realtime subscription
    //     } catch (error) {
    //         console.error('Error deleting website:', error)
    //         toast.error('Failed to delete website')
    //     } finally {
    //         setSubmitting(false)
    //     }
    // }

    const supabase = createClient()

    const handleDelete = async () => {
        if (!selectedWebsite) {
            toast.error('No website selected.')
            return
        }

        try {
            setSubmitting(true)
            console.log('Calling deleteWebsiteClient with id:', selectedWebsite.id)
            const result = await deleteWebsiteClient(selectedWebsite.id)
            console.log('deleteWebsiteClient result:', result)
            // Success toast is handled in the client action
            setIsDeleteDialogOpen(false)
            setSelectedWebsite(null)
            // Data will be updated automatically via realtime subscription
        } catch (error) {
            console.error('Error deleting website:', error)
            // Error toast is handled in the client action
        } finally {
            setSubmitting(false)
        }
    }
    const openEditDialog = (website: Website) => {
        setSelectedWebsite(website)
        setIsFormOpen(true)
    }

    const openDeleteDialog = (website: Website) => {
        setSelectedWebsite(website)
        setIsDeleteDialogOpen(true)
    }

    const getStatusBadge = (status: string) => {
        const variants: Record<string, any> = {
            active: { variant: "default", label: "Active" },
            inactive: { variant: "secondary", label: "Inactive" },
            maintenance: { variant: "destructive", label: "Maintenance" },
        }
        const config = variants[status] || variants.active
        return <Badge variant={config.variant}>{config.label}</Badge>
    }

    const activeWebsites = currentWebsites.filter(w => w.status === 'active').length
    const inactiveWebsites = currentWebsites.filter(w => w.status === 'inactive').length

    if (isLoading) {
        return (
            <div className="flex flex-1 items-center justify-center min-h-[400px]">
                <div className="flex flex-col items-center gap-2">
                    <IconLoader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">Loading websites...</p>
                    {realtimeLoading && (
                        <p className="text-xs text-muted-foreground">Connecting to realtime updates...</p>
                    )}
                </div>
            </div>
        )
    }

    return (
        <div className="flex flex-1 flex-col gap-4 p-4 md:gap-6 md:p-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <h1 className="text-3xl font-bold tracking-tight">Websites</h1>
                        <div className="flex items-center gap-1">
                            {isConnected ? (
                                <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                                    <IconWifi className="w-3 h-3 mr-1" />
                                    Live
                                </Badge>
                            ) : (
                                <Badge variant="outline" className="text-xs bg-gray-50 text-gray-700 border-gray-200">
                                    <IconWifiOff className="w-3 h-3 mr-1" />
                                    Offline
                                </Badge>
                            )}
                        </div>
                    </div>
                    <p className="text-sm text-muted-foreground">
                        Manage your WordPress websites and their settings
                    </p>
                </div>
                <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                    <DialogTrigger asChild>
                        <Button onClick={() => setSelectedWebsite(null)}>
                            <IconPlus className="mr-2 h-4 w-4" />
                            Add Website
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[500px]">
                        <DialogHeader>
                            <DialogTitle>{selectedWebsite ? "Edit Website" : "Create New Website"}</DialogTitle>
                            <DialogDescription>
                                {selectedWebsite ? "Update website information and settings" : "Add a new website to manage content"}
                            </DialogDescription>
                        </DialogHeader>
                        <WebsiteForm website={selectedWebsite} onClose={() => setIsFormOpen(false)} />
                    </DialogContent>
                </Dialog>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Total Websites
                        </CardTitle>
                        <IconWorldWww className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{currentWebsites.length}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Websites</CardTitle>
                        <IconWorldWww className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{activeWebsites}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Inactive Websites</CardTitle>
                        <IconWorldWww className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{inactiveWebsites}</div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div className="space-y-1">
                            <CardTitle>All Websites</CardTitle>
                            <CardDescription>
                                {filteredWebsites.length} {filteredWebsites.length === 1 ? 'website' : 'websites'} found
                            </CardDescription>
                        </div>
                        <div className="relative w-full md:w-64">
                            <IconSearch className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search websites..."
                                className="pl-8"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <ScrollArea className="w-full">
                        <div className="space-y-4">
                            {filteredWebsites.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-12 text-center">
                                    <IconWorldWww className="h-12 w-12 text-muted-foreground/50 mb-4" />
                                    <h3 className="text-lg font-semibold">No websites found</h3>
                                    <p className="text-sm text-muted-foreground mt-2">
                                        {searchQuery ? 'Try adjusting your search' : 'Get started by creating your first website'}
                                    </p>
                                    {!searchQuery && (
                                        <Button className="mt-4" onClick={() => setIsFormOpen(true)}>
                                            <IconPlus className="mr-2 h-4 w-4" />
                                            Add Website
                                        </Button>
                                    )}
                                </div>
                            ) : (
                                filteredWebsites.map((website) => (
                                    <Card key={website.id}>
                                        <CardContent className="flex items-center justify-between p-6">
                                            <div className="flex items-center gap-4 flex-1">
                                                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                                                    <IconWorldWww className="h-6 w-6 text-primary" />
                                                </div>
                                                <div className="flex-1 space-y-1">
                                                    <div className="flex items-center gap-2">
                                                        <h3 className="font-semibold">{website.name}</h3>
                                                        {getStatusBadge(website.status || 'active')}
                                                    </div>
                                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                        <a
                                                            href={website.url}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="text-blue-600 hover:underline inline-flex items-center gap-1"
                                                        >
                                                            <IconWorld className="h-3 w-3" />
                                                            {website.url.replace(/^https?:\/\//, "")}
                                                        </a>
                                                    </div>
                                                    <div className="text-xs text-muted-foreground">
                                                        <span>Created {new Date(website.created_at).toLocaleDateString()}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon">
                                                        <IconDots className="h-4 w-4" />
                                                        <span className="sr-only">Actions</span>
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem onClick={() => openEditDialog(website)}>
                                                        <IconEdit className="mr-2 h-4 w-4" />
                                                        Edit
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        className="text-destructive focus:text-destructive"
                                                        onClick={() => openDeleteDialog(website)}
                                                    >
                                                        <IconTrash className="mr-2 h-4 w-4" />
                                                        Delete
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </CardContent>
                                    </Card>
                                ))
                            )}
                        </div>
                        <ScrollBar orientation="horizontal" />
                    </ScrollArea>
                </CardContent>
            </Card>

            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently delete{" "}
                            <span className="font-semibold text-foreground">{selectedWebsite?.name}</span> and
                            all associated data. This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setSelectedWebsite(null)} disabled={submitting}>
                            Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            disabled={submitting}
                        >
                            {submitting && <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Delete Website
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}