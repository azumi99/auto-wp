"use client";

import * as React from "react";
import {
    IconPlus,
    IconEdit,
    IconTrash,
    IconDots,
    IconWebhook,
    IconSearch,
    IconLoader2,
    IconCheck,
    IconX,
    IconWifi,
    IconWifiOff
} from "@tabler/icons-react";
import { AuthGuard } from "@/components/auth-guard";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { getWebhooksClient } from "@/src/lib/webhooks/client-actions";
import { deleteWebhookClient } from "@/src/lib/webhooks/client-actions";
import { toast } from "sonner";
import { Webhook } from "@/src/lib/webhooks/types";
import { WebhookForm } from "./webhook-form";
import { useWebhooksRealtime } from "@/hooks/use-supabase-realtime";
import { createClient } from "@/lib/supabaseClient";


export default function WebhooksPage() {
    const [webhooks, setWebhooks] = React.useState<Webhook[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [userId, setUserId] = React.useState<string | null>(null);
    const [searchQuery, setSearchQuery] = React.useState("");
    const [isFormOpen, setIsFormOpen] = React.useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
    const [selectedWebhook, setSelectedWebhook] = React.useState<Webhook | null>(null);
    const [submitting, setSubmitting] = React.useState(false);

    // Initialize user and load data
    React.useEffect(() => {
        const initializeUser = async () => {
            try {
                const supabase = createClient();
                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                    setUserId(user.id);
                    loadWebhooks();
                }
            } catch (error) {
                console.error('Error getting user:', error);
                toast.error('Failed to authenticate');
            }
        };
        initializeUser();
    }, []);

    const loadWebhooks = async () => {
        try {
            setLoading(true);
            const webhooksData = await getWebhooksClient();
            setWebhooks(webhooksData);
        } catch (error) {
            console.error('Error loading webhooks:', error);
            toast.error('Failed to load webhooks');
        } finally {
            setLoading(false);
        }
    };

    // Setup realtime subscription - this will fetch data and handle realtime updates
    const { data: realtimeData, isConnected, error: realtimeError, loading: realtimeLoading, reconnect } = useWebhooksRealtime(
        userId || '',
        undefined // Let the hook fetch its own data
    );

    // Use realtime data as primary source, fallback to initial data only during initial load
    const currentWebhooks = realtimeData || webhooks;
    const isLoading = loading || (realtimeLoading && !realtimeData);

    // Update local state when realtime data changes
    React.useEffect(() => {
        if (realtimeData) {
            console.log('Webhooks updated via realtime:', realtimeData.length, 'items');
        }
    }, [realtimeData]);

    // Handle realtime connection errors
    React.useEffect(() => {
        if (realtimeError) {
            console.error('Realtime connection error:', realtimeError);
            toast.error(`Realtime updates unavailable: ${realtimeError.message}`);
        }
    }, [realtimeError]);

    // Debug logging
    React.useEffect(() => {
        console.log('Webhooks state update:', {
            realtimeDataCount: realtimeData?.length || 0,
            initialDataCount: webhooks.length,
            currentDataCount: currentWebhooks.length,
            isConnected,
            isLoading
        });
    }, [realtimeData, webhooks, currentWebhooks, isConnected, isLoading]);

    // Sort webhooks by created_at in descending order (newest first)
    const sortedWebhooks = React.useMemo(() => {
        return [...currentWebhooks].sort((a, b) =>
            new Date(b.created_at || b.updated_at).getTime() - new Date(a.created_at || a.updated_at).getTime()
        )
    }, [currentWebhooks])

    const filteredWebhooks = sortedWebhooks.filter((webhook) =>
        webhook.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        webhook.url.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleDelete = async () => {
        if (!selectedWebhook) return;

        try {
            setSubmitting(true);
            await deleteWebhookClient(selectedWebhook.id);
            // Success toast is handled in the client action
            setIsDeleteDialogOpen(false);
            setSelectedWebhook(null);
            // Data will be updated automatically via realtime subscription
        } catch (error) {
            // Error toast is handled in the client action
        } finally {
            setSubmitting(false);
        }
    };

    const openEditDialog = (webhook: Webhook) => {
        setSelectedWebhook(webhook);
        setIsFormOpen(true);
    };

    const openDeleteDialog = (webhook: Webhook) => {
        setSelectedWebhook(webhook);
        setIsDeleteDialogOpen(true);
    };

    const getStatusBadge = (active: boolean) => {
        return active ? (
            <Badge variant="default" className="bg-green-600 hover:bg-green-600">
                <IconCheck className="mr-1 h-3 w-3" />
                Active
            </Badge>
        ) : (
            <Badge variant="destructive">
                <IconX className="mr-1 h-3 w-3" />
                Inactive
            </Badge>
        );
    };

    if (isLoading) {
        return (
            <div className="flex flex-1 items-center justify-center min-h-[400px]">
                <div className="flex flex-col items-center gap-2">
                    <IconLoader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">Loading webhooks...</p>
                    {realtimeLoading && (
                        <p className="text-xs text-muted-foreground">Connecting to realtime updates...</p>
                    )}
                </div>
            </div>
        );
    }

    return (
        <AuthGuard>
            <div className="flex flex-1 flex-col gap-4 p-4 md:gap-6 md:p-6">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <h1 className="text-3xl font-bold tracking-tight">Webhooks</h1>
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
                            Manage your n8n webhook endpoints for content generation
                        </p>
                    </div>
                    <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                        <DialogTrigger asChild>
                            <Button onClick={() => setSelectedWebhook(null)}>
                                <IconPlus className="mr-2 h-4 w-4" />
                                Add Webhook
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[500px]">
                            <DialogHeader>
                                <DialogTitle>{selectedWebhook ? "Edit Webhook" : "Create New Webhook"}</DialogTitle>
                                <DialogDescription>
                                    {selectedWebhook
                                        ? "Update webhook details and settings"
                                        : "Add a new n8n webhook endpoint to trigger content generation"}
                                </DialogDescription>
                            </DialogHeader>
                            <WebhookForm
                                webhook={selectedWebhook}
                                onClose={() => {
                                    setIsFormOpen(false);
                                    setSelectedWebhook(null);
                                }}
                                onSuccess={() => {
                                    // Form succeeded - realtime will handle updates automatically
                                    console.log('Webhook form succeeded - realtime will update data')
                                }}
                            />
                        </DialogContent>
                    </Dialog>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                Total Webhooks
                            </CardTitle>
                            <IconWebhook className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{currentWebhooks.length}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Active Webhooks</CardTitle>
                            <IconCheck className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{currentWebhooks.filter(w => w.active).length}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Inactive Webhooks</CardTitle>
                            <IconX className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{currentWebhooks.filter(w => !w.active).length}</div>
                        </CardContent>
                    </Card>
                </div>

                <Card>
                    <CardHeader>
                        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                            <div className="space-y-1">
                                <CardTitle>All Webhooks</CardTitle>
                                <CardDescription>
                                    {filteredWebhooks.length} {filteredWebhooks.length === 1 ? 'webhook' : 'webhooks'} found
                                </CardDescription>
                            </div>
                            <div className="relative w-full md:w-64">
                                <IconSearch className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search webhooks..."
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
                                {filteredWebhooks.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-12 text-center">
                                        <IconWebhook className="h-12 w-12 text-muted-foreground/50 mb-4" />
                                        <h3 className="text-lg font-semibold">No webhooks found</h3>
                                        <p className="text-sm text-muted-foreground mt-2">
                                            {searchQuery ? 'Try adjusting your search' : 'Get started by adding your first webhook'}
                                        </p>
                                        {!searchQuery && (
                                            <Button className="mt-4" onClick={() => setIsFormOpen(true)}>
                                                <IconPlus className="mr-2 h-4 w-4" />
                                                Add Webhook
                                            </Button>
                                        )}
                                    </div>
                                ) : (
                                    filteredWebhooks.map((webhook) => (
                                        <Card key={webhook.id}>
                                            <CardContent className="flex items-center justify-between p-6">
                                                <div className="flex items-center gap-4 flex-1">
                                                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                                                        <IconWebhook className="h-6 w-6 text-primary" />
                                                    </div>
                                                    <div className="flex-1 space-y-1">
                                                        <div className="flex items-center gap-2">
                                                            <h3 className="font-semibold">{webhook.name}</h3>
                                                            {getStatusBadge(webhook.active)}
                                                        </div>
                                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                            <code className="text-xs bg-muted px-2 py-1 rounded break-all">
                                                                {webhook.url}
                                                            </code>
                                                        </div>
                                                        <div className="text-xs text-muted-foreground">
                                                            <span>Created {new Date(webhook.created_at).toLocaleDateString()}</span>
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
                                                        <DropdownMenuItem onClick={() => openEditDialog(webhook)}>
                                                            <IconEdit className="mr-2 h-4 w-4" />
                                                            Edit
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            className="text-destructive focus:text-destructive"
                                                            onClick={() => openDeleteDialog(webhook)}
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
                                <span className="font-semibold text-foreground">{selectedWebhook?.name}</span> and
                                any associated configurations. This action cannot be undone.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel onClick={() => setSelectedWebhook(null)} disabled={submitting}>
                                Cancel
                            </AlertDialogCancel>
                            <AlertDialogAction
                                onClick={handleDelete}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                disabled={submitting}
                            >
                                {submitting && <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Delete Webhook
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
        </AuthGuard>
    );
}