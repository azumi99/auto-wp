"use client"

import * as React from "react"
import {
    IconPlus,
    IconEdit,
    IconTrash,
    IconDots,
    IconClockPlay,
    IconSearch,
    IconLoader2,
    IconWifi,
    IconWifiOff,
} from "@tabler/icons-react"
import { AuthGuard } from "@/components/auth-guard"
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
import { getWorkflowsClient } from "@/src/lib/workflows/client-actions"
import { deleteWorkflowClient } from "@/src/lib/workflows/client-actions"
import { toast } from "sonner"
import { Workflow } from "@/src/lib/workflows/types"
import { WorkflowForm } from "./workflow-form"
import { useWorkflowsRealtime } from "@/hooks/use-supabase-realtime"
import { createClient } from "@/lib/supabaseClient"

async function checkAndRedirectForWorkflowCreation(): Promise<boolean> {
    // Add any logic needed before allowing workflow creation.
    // For now, always allow.
    return true;
}

export default function WorkflowsPage() {
    const [workflows, setWorkflows] = React.useState<Workflow[]>([])
    const [loading, setLoading] = React.useState(true)
    const [userId, setUserId] = React.useState<string | null>(null)
    const [searchQuery, setSearchQuery] = React.useState("")
    const [isFormOpen, setIsFormOpen] = React.useState(false)
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false)
    const [selectedWorkflow, setSelectedWorkflow] = React.useState<Workflow | null>(null)
    const [submitting, setSubmitting] = React.useState(false)

    // Initialize user and load data
    React.useEffect(() => {
        const initializeUser = async () => {
            try {
                const supabase = createClient()
                const { data: { user } } = await supabase.auth.getUser()
                if (user) {
                    setUserId(user.id)
                    loadWorkflows()
                }
            } catch (error) {
                console.error('Error getting user:', error)
                toast.error('Failed to authenticate')
            }
        }
        initializeUser()
    }, [])

    const loadWorkflows = async () => {
        try {
            setLoading(true)
            const data = await getWorkflowsClient()
            setWorkflows(data)
        } catch (error) {
            console.error('Error loading workflows:', error)
            toast.error('Failed to load workflows')
        } finally {
            setLoading(false)
        }
    }

    // Setup realtime subscription - this will fetch data and handle realtime updates
    const { data: realtimeData, isConnected, error: realtimeError, loading: realtimeLoading, reconnect } = useWorkflowsRealtime(
        userId || '',
        undefined // Let the hook fetch its own data
    )

    // Use realtime data as primary source, fallback to initial data only during initial load
    const currentWorkflows = realtimeData || workflows
    const isLoading = loading || (realtimeLoading && !realtimeData)

    // Update local state when realtime data changes
    React.useEffect(() => {
        if (realtimeData) {
            console.log('Workflows updated via realtime:', realtimeData.length, 'items')
        }
    }, [realtimeData])

    // Handle realtime connection errors
    React.useEffect(() => {
        if (realtimeError) {
            console.error('Realtime connection error:', realtimeError)
            toast.error(`Realtime updates unavailable: ${realtimeError.message}`)
        }
    }, [realtimeError])

    // Debug logging
    React.useEffect(() => {
        console.log('Workflows state update:', {
            realtimeDataCount: realtimeData?.length || 0,
            initialDataCount: workflows.length,
            currentDataCount: currentWorkflows.length,
            isConnected,
            isLoading
        })
    }, [realtimeData, workflows, currentWorkflows, isConnected, isLoading])

    // Sort workflows by created_at in descending order (newest first)
    const sortedWorkflows = React.useMemo(() => {
        return [...currentWorkflows].sort((a, b) =>
            new Date(b.created_at || b.updated_at).getTime() - new Date(a.created_at || a.updated_at).getTime()
        )
    }, [currentWorkflows])

    const filteredWorkflows = sortedWorkflows.filter((workflow) =>
        workflow.name.toLowerCase().includes(searchQuery.toLowerCase())
    )

    const handleDelete = async () => {
        if (!selectedWorkflow) return

        try {
            setSubmitting(true)
            await deleteWorkflowClient(selectedWorkflow.id)
            // Success toast is handled in the client action
            setIsDeleteDialogOpen(false)
            setSelectedWorkflow(null)
            // Data will be updated automatically via realtime subscription
        } catch (error) {
            // Error toast is handled in the client action
        } finally {
            setSubmitting(false)
        }
    }

    const openEditDialog = (workflow: Workflow) => {
        setSelectedWorkflow(workflow)
        setIsFormOpen(true)
    }

    const openDeleteDialog = (workflow: Workflow) => {
        setSelectedWorkflow(workflow)
        setIsDeleteDialogOpen(true)
    }

    const getStatusBadge = (isActive: boolean) => {
        return isActive ? (
            <Badge variant="default">Active</Badge>
        ) : (
            <Badge variant="secondary">Inactive</Badge>
        )
    }

    if (isLoading) {
        return (
            <div className="flex flex-1 items-center justify-center min-h-[400px]">
                <div className="flex flex-col items-center gap-2">
                    <IconLoader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">Loading workflows...</p>
                    {realtimeLoading && (
                        <p className="text-xs text-muted-foreground">Connecting to realtime updates...</p>
                    )}
                </div>
            </div>
        )
    }

    return (
        <AuthGuard>
            <div className="flex flex-1 flex-col gap-4 p-4 md:gap-6 md:p-6">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <h1 className="text-3xl font-bold tracking-tight">Workflows</h1>
                            <div className="flex items-center gap-1">
                                {isConnected ? (
                                    <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                                        <IconWifi className="w-3 h-3 mr-1" />
                                        Live
                                    </Badge>
                                ) : (
                                    <div className="flex items-center gap-2">
                                        <Badge variant="outline" className="text-xs bg-red-50 text-red-700 border-red-200">
                                            <IconWifiOff className="w-3 h-3 mr-1" />
                                            Offline
                                        </Badge>
                                        {realtimeError && (
                                            <Button size="sm" variant="outline" onClick={reconnect} className="text-xs h-6 px-2">
                                                Reconnect
                                            </Button>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                        <p className="text-sm text-muted-foreground">
                            Manage your automation workflows
                        </p>
                    </div>
                    <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                        <DialogTrigger asChild>
                            <Button onClick={() => setSelectedWorkflow(null)}>
                                <IconPlus className="mr-2 h-4 w-4" />
                                Add Workflow
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[500px]">
                            <DialogHeader>
                                <DialogTitle>{selectedWorkflow ? "Edit Workflow" : "Create New Workflow"}</DialogTitle>
                                <DialogDescription>
                                    {selectedWorkflow ? "Update workflow information and settings" : "Add a new workflow to automate content generation"}
                                </DialogDescription>
                            </DialogHeader>
                            <WorkflowForm
                                workflow={selectedWorkflow}
                                onClose={() => setIsFormOpen(false)}
                                onSuccess={() => {
                                    // Form succeeded - realtime will handle updates automatically
                                    console.log('Workflow form succeeded - realtime will update data')
                                }}
                            />
                        </DialogContent>
                    </Dialog>
                </div>

                <Card>
                    <CardHeader>
                        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                            <div className="space-y-1">
                                <CardTitle>All Workflows</CardTitle>
                                <CardDescription>
                                    {filteredWorkflows.length} {filteredWorkflows.length === 1 ? 'workflow' : 'workflows'} found
                                </CardDescription>
                            </div>
                            <div className="relative w-full md:w-64">
                                <IconSearch className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search workflows..."
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
                                {filteredWorkflows.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-12 text-center">
                                        <IconClockPlay className="h-12 w-12 text-muted-foreground/50 mb-4" />
                                        <h3 className="text-lg font-semibold">No workflows found</h3>
                                        <p className="text-sm text-muted-foreground mt-2">
                                            {searchQuery ? 'Try adjusting your search' : 'Get started by creating your first workflow'}
                                        </p>
                                        {!searchQuery && (
                                            <Button className="mt-4" onClick={async () => {
                                                const canProceed = await checkAndRedirectForWorkflowCreation()
                                                if (canProceed) {
                                                    setIsFormOpen(true)
                                                }
                                            }}>
                                                <IconPlus className="mr-2 h-4 w-4" />
                                                Add Workflow
                                            </Button>
                                        )}
                                    </div>
                                ) : (
                                    filteredWorkflows.map((workflow) => (
                                        <Card key={workflow.id}>
                                            <CardContent className="flex items-center justify-between p-6">
                                                <div className="flex items-center gap-4 flex-1">
                                                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                                                        <IconClockPlay className="h-6 w-6 text-primary" />
                                                    </div>
                                                    <div className="flex-1 space-y-1">
                                                        <div className="flex items-center gap-2">
                                                            <h3 className="font-semibold">{workflow.name}</h3>
                                                            {getStatusBadge(workflow.is_active)}
                                                        </div>
                                                        <div className="text-sm text-muted-foreground">
                                                            <span>{workflow.description}</span>
                                                        </div>
                                                        <div className="text-xs text-muted-foreground">
                                                            <span>Created {new Date(workflow.created_at).toLocaleDateString()}</span>
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
                                                        <DropdownMenuItem onClick={() => openEditDialog(workflow)}>
                                                            <IconEdit className="mr-2 h-4 w-4" />
                                                            Edit
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            className="text-destructive focus:text-destructive"
                                                            onClick={() => openDeleteDialog(workflow)}
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
                                <span className="font-semibold text-foreground">{selectedWorkflow?.name}</span>.
                                This action cannot be undone.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel onClick={() => setSelectedWorkflow(null)} disabled={submitting}>
                                Cancel
                            </AlertDialogCancel>
                            <AlertDialogAction
                                onClick={handleDelete}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                disabled={submitting}
                            >
                                {submitting && <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Delete Workflow
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
        </AuthGuard>
    )
}