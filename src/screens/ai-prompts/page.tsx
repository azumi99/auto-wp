"use client";

import * as React from "react";
import {
    IconPlus,
    IconEdit,
    IconTrash,
    IconDots,
    IconFileAi,
    IconSearch,
    IconLoader2,
    IconCopy,
    IconCheck,
    IconWifi,
    IconWifiOff,
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
import { Badge } from "@/components/ui/badge";
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { getAIPromptsClient } from "@/src/lib/ai_prompts/client-actions";
import { deleteAIPromptClient } from "@/src/lib/ai_prompts/client-actions";
import { toast } from "sonner";
import { AIPrompt } from "@/src/lib/ai_prompts/types";
import { AIPromptForm } from "./ai-prompt-form";
import { useAIPromptsRealtime } from "@/hooks/use-supabase-realtime";
import { createClient } from "@/lib/supabaseClient";


export default function AIPromptsPage() {
    const [aiPrompts, setAIPrompts] = React.useState<AIPrompt[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [userId, setUserId] = React.useState<string | null>(null);
    const [searchQuery, setSearchQuery] = React.useState("");
    const [isFormOpen, setIsFormOpen] = React.useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
    const [selectedAIPrompt, setSelectedAIPrompt] = React.useState<AIPrompt | null>(null);
    const [submitting, setSubmitting] = React.useState(false);
    const [copiedId, setCopiedId] = React.useState<string | null>(null);

    // Initialize user and load data
    React.useEffect(() => {
        const initializeUser = async () => {
            try {
                const supabase = createClient()
                const { data: { user } } = await supabase.auth.getUser()
                if (user) {
                    setUserId(user.id)
                    loadAIPrompts()
                }
            } catch (error) {
                console.error('Error getting user:', error)
                toast.error('Failed to authenticate')
            }
        }
        initializeUser()
    }, [])

    const loadAIPrompts = async () => {
        try {
            setLoading(true);
            const aiPromptsData = await getAIPromptsClient();
            setAIPrompts(aiPromptsData);
        } catch (error) {
            console.error('Error loading AI prompts:', error);
            toast.error('Failed to load AI prompts');
        } finally {
            setLoading(false);
        }
    }

    // Setup realtime subscription - this will fetch data and handle realtime updates
    const { data: realtimeData, isConnected, error: realtimeError, loading: realtimeLoading, reconnect } = useAIPromptsRealtime(
        userId || '',
        undefined // Let the hook fetch its own data
    )

    // Use realtime data as primary source, fallback to initial data only during initial load
    const currentPrompts = realtimeData || aiPrompts
    const isLoading = loading || (realtimeLoading && !realtimeData)

    // Update local state when realtime data changes
    React.useEffect(() => {
        if (realtimeData) {
            console.log('AI Prompts updated via realtime:', realtimeData.length, 'items')
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
        console.log('AI Prompts state update:', {
            realtimeDataCount: realtimeData?.length || 0,
            initialDataCount: aiPrompts.length,
            currentDataCount: currentPrompts.length,
            isConnected,
            isLoading
        })
    }, [realtimeData, aiPrompts, currentPrompts, isConnected, isLoading]);

    // Sort AI prompts by created_at in descending order (newest first)
    const sortedAIPrompts = React.useMemo(() => {
        return [...currentPrompts].sort((a, b) =>
            new Date(b.created_at || b.updated_at).getTime() - new Date(a.created_at || a.updated_at).getTime()
        )
    }, [currentPrompts])

    const filteredAIPrompts = sortedAIPrompts.filter((prompt) =>
        prompt.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        prompt.template.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleDelete = async () => {
        if (!selectedAIPrompt) return;

        try {
            setSubmitting(true);
            await deleteAIPromptClient(selectedAIPrompt.id);
            // Success toast is handled in the client action
            setIsDeleteDialogOpen(false);
            setSelectedAIPrompt(null);
            // Data will be updated automatically via realtime subscription
        } catch (error) {
            // Error toast is handled in the client action
        } finally {
            setSubmitting(false);
        }
    };

    const openEditDialog = (aiPrompt: AIPrompt) => {
        setSelectedAIPrompt(aiPrompt);
        setIsFormOpen(true);
    };

    const openDeleteDialog = (aiPrompt: AIPrompt) => {
        setSelectedAIPrompt(aiPrompt);
        setIsDeleteDialogOpen(true);
    };

    const copyToClipboard = async (text: string, id: string) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopiedId(id);
            toast.success("Prompt copied to clipboard");
            setTimeout(() => setCopiedId(null), 2000);
        } catch (err) {
            console.error('Failed to copy text: ', err);
            toast.error("Failed to copy prompt");
        }
    };

    if (isLoading) {
        return (
            <div className="flex flex-1 items-center justify-center min-h-[400px]">
                <div className="flex flex-col items-center gap-2">
                    <IconLoader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">Loading AI prompts...</p>
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
                            <h1 className="text-3xl font-bold tracking-tight">AI Prompts</h1>
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
                            Manage your AI prompt templates for content generation
                        </p>
                    </div>
                    <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                        <DialogTrigger asChild>
                            <Button onClick={() => setSelectedAIPrompt(null)}>
                                <IconPlus className="mr-2 h-4 w-4" />
                                Add Prompt
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-hidden flex flex-col">
                            <DialogHeader>
                                <DialogTitle>{selectedAIPrompt ? "Edit Prompt" : "Create New Prompt"}</DialogTitle>
                                <DialogDescription>
                                    {selectedAIPrompt
                                        ? "Update your AI prompt template"
                                        : "Create a new AI prompt template for content generation"}
                                </DialogDescription>
                            </DialogHeader>
                            <div className="flex-1 overflow-y-auto px-1">
                                <AIPromptForm
                                    aiPrompt={selectedAIPrompt}
                                    onClose={() => {
                                        setIsFormOpen(false);
                                        setSelectedAIPrompt(null);
                                    }}
                                    onSuccess={() => {
                                        // Form succeeded - realtime will handle updates automatically
                                        console.log('AI prompt form succeeded - realtime will update data')
                                    }}
                                />
                            </div>
                        </DialogContent>
                    </Dialog>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                Total Prompts
                            </CardTitle>
                            <IconFileAi className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{aiPrompts.length}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Recently Updated</CardTitle>
                            <IconFileAi className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {aiPrompts.length > 0
                                    ? new Date(aiPrompts[0].updated_at).toLocaleDateString()
                                    : 'N/A'}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <Card>
                    <CardHeader>
                        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                            <div className="space-y-1">
                                <CardTitle>All AI Prompts</CardTitle>
                                <CardDescription>
                                    {filteredAIPrompts.length} {filteredAIPrompts.length === 1 ? 'prompt' : 'prompts'} found
                                </CardDescription>
                            </div>
                            <div className="relative w-full md:w-64">
                                <IconSearch className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search prompts..."
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
                                {filteredAIPrompts.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-12 text-center">
                                        <IconFileAi className="h-12 w-12 text-muted-foreground/50 mb-4" />
                                        <h3 className="text-lg font-semibold">No AI prompts found</h3>
                                        <p className="text-sm text-muted-foreground mt-2">
                                            {searchQuery ? 'Try adjusting your search' : 'Get started by creating your first AI prompt'}
                                        </p>
                                        {!searchQuery && (
                                            <Button className="mt-4" onClick={() => setIsFormOpen(true)}>
                                                <IconPlus className="mr-2 h-4 w-4" />
                                                Add Prompt
                                            </Button>
                                        )}
                                    </div>
                                ) : (
                                    filteredAIPrompts.map((prompt) => (
                                        <Card key={prompt.id}>
                                            <CardContent className="flex items-start justify-between p-6">
                                                <div className="flex-1 space-y-3">
                                                    <div className="flex items-center gap-2">
                                                        <h3 className="font-semibold">{prompt.name}</h3>
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => copyToClipboard(prompt.template, prompt.id)}
                                                            className="h-7 gap-1"
                                                        >
                                                            {copiedId === prompt.id ? (
                                                                <>
                                                                    <IconCheck className="h-3.5 w-3.5" />
                                                                    <span>Copied!</span>
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <IconCopy className="h-3.5 w-3.5" />
                                                                    <span>Copy</span>
                                                                </>
                                                            )}
                                                        </Button>
                                                    </div>
                                                    <div className="text-sm text-muted-foreground">
                                                        {prompt.template.substring(0, 200)}{prompt.template.length > 200 ? '...' : ''}
                                                    </div>
                                                    <div className="text-xs text-muted-foreground">
                                                        Created {new Date(prompt.created_at).toLocaleDateString()}
                                                        {prompt.created_at !== prompt.updated_at && (
                                                            <span>, Updated {new Date(prompt.updated_at).toLocaleDateString()}</span>
                                                        )}
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
                                                        <DropdownMenuItem onClick={() => openEditDialog(prompt)}>
                                                            <IconEdit className="mr-2 h-4 w-4" />
                                                            Edit
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            className="text-destructive focus:text-destructive"
                                                            onClick={() => openDeleteDialog(prompt)}
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
                                <span className="font-semibold text-foreground">{selectedAIPrompt?.name}</span> and
                                any associated configurations. This action cannot be undone.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel onClick={() => setSelectedAIPrompt(null)} disabled={submitting}>
                                Cancel
                            </AlertDialogCancel>
                            <AlertDialogAction
                                onClick={handleDelete}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                disabled={submitting}
                            >
                                {submitting && <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Delete Prompt
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
        </AuthGuard>
    );
}