"use client";

import * as React from "react";
import { IconLoader2 } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Workflow } from "@/src/lib/workflows/types";
import { createWorkflowClient, updateWorkflowClient } from "@/src/lib/workflows/client-actions";
import { getWebsitesClient } from "@/src/lib/websites/client-actions";
import { getAIPromptsClient } from "@/src/lib/ai_prompts/client-actions";
import { getWebhooksClient } from "@/src/lib/webhooks/client-actions";
import { Website } from "@/src/lib/websites/types";
import { Webhook } from "@/src/lib/webhooks/client-actions";
import { AIPrompt } from "@/src/lib/ai_prompts/types";

interface WorkflowFormProps {
    workflow?: Workflow | null;
    onClose: () => void;
    onSuccess?: () => void;
}

export function WorkflowForm({ workflow, onClose, onSuccess }: WorkflowFormProps) {
    const [submitting, setSubmitting] = React.useState(false);
    const [loading, setLoading] = React.useState(true); // Track loading state for dependencies
    const [websites, setWebsites] = React.useState<Website[]>([]);
    const [aiPrompts, setAIPrompts] = React.useState<AIPrompt[]>([]);
    const [webhooks, setWebhooks] = React.useState<Webhook[]>([]);

    const [formData, setFormData] = React.useState<Partial<Workflow>>({
        name: workflow?.name || "",
        description: workflow?.description || "",
        website_id: workflow?.website_id || "",
        prompt_template_id: workflow?.prompt_template_id || "",
        webhook_id: "",  // Will be set after data is loaded
        is_active: workflow?.is_active ?? true,
        schedule_type: workflow?.schedule_type || null,
    });

    React.useEffect(() => {
        loadDependencies();
    }, []);

    const loadDependencies = async () => {
        try {
            setLoading(true); // Set loading to true when starting to fetch
            const [websitesData, aiPromptsData, webhooksData] = await Promise.all([
                getWebsitesClient(),
                getAIPromptsClient(),
                getWebhooksClient()
            ]);
            setWebsites(websitesData);
            setAIPrompts(aiPromptsData);
            setWebhooks(webhooksData);

            // When data is loaded, update form data with proper IDs
            if (websitesData.length > 0 || webhooksData.length > 0) {
                setFormData(prev => {
                    const updatedData = { ...prev };
                    
                    // Set default website if not already set
                    if (websitesData.length > 0 && !prev.website_id) {
                        updatedData.website_id = websitesData[0].id;
                    }
                    
                    // Set default webhook if not already set
                    if (webhooksData.length > 0 && !prev.webhook_id) {
                        updatedData.webhook_id = webhooksData[0].id;
                    }
                    
                    return updatedData;
                });
            }
        } catch (error) {
            console.error('Error loading dependencies:', error);
            toast.error('Failed to load dependencies');
        } finally {
            setLoading(false); // Set loading to false when finished (whether success or error)
        }
    };

    // After dependencies are loaded, update form data to match workflow if editing
    React.useEffect(() => {
        if (!loading && workflow && websites.length > 0 && webhooks.length > 0) {
            // Find the webhook by URL if we're editing an existing workflow
            const matchingWebhook = webhooks.find(w => w.url === workflow.webhook_url);
            
            setFormData(prev => ({
                ...prev,
                name: workflow.name || "",
                description: workflow.description || "",
                website_id: workflow.website_id || "",
                prompt_template_id: workflow.prompt_template_id || "",
                webhook_id: matchingWebhook?.id || workflow.webhook_id || "",
                is_active: workflow.is_active ?? true,
                schedule_type: workflow.schedule_type || null,
            }));
        }
    }, [loading, websites, webhooks, workflow]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setSubmitting(true);

            // Validate required fields
            if (!formData.name) {
                toast.error("Please fill in the workflow name");
                return;
            }

            if (!formData.website_id || formData.website_id === "no-websites") {
                toast.error("Please create a website first before creating workflows");
                return;
            }

            // Transform webhook_id to webhook_url for backend compatibility
            const matchingWebhook = webhooks.find(w => w.id === formData.webhook_id);
            const submissionData = {
                ...formData,
                webhook_url: matchingWebhook?.url, // Map the selected ID to the actual URL for the backend
            };
            // Remove webhook_id from submission since the backend expects webhook_url
            delete (submissionData as any).webhook_id;

            if (workflow) {
                await updateWorkflowClient(workflow.id, submissionData);
                // Success toast is handled in the client action
            } else {
                await createWorkflowClient(submissionData);
                // Success toast is handled in the client action
            }
            onClose();
            if (onSuccess) {
                onSuccess();
            }
            // Realtime subscription will handle the update automatically - no need for router.refresh()
        } catch (error) {
            console.error("Error saving workflow:", error);
            toast.error(workflow ? "Failed to update workflow" : "Failed to create workflow");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="grid gap-4 p-4">
            <div className="grid gap-2">
                <Label htmlFor="name">Workflow Name *</Label>
                <Input
                    id="name"
                    placeholder="e.g. Daily Blog Post Generator"
                    value={formData.name || ""}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                />
            </div>

            <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                    id="description"
                    placeholder="Describe what this workflow does"
                    value={formData.description || ""}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={2}
                />
            </div>

            <div className="grid gap-2">
                <Label htmlFor="website_id">Target Website *</Label>
                <Select
                    key={`workflow-website-select-${websites.length}-${loading}`}
                    value={formData.website_id || ""}
                    onValueChange={(value) => setFormData({ ...formData, website_id: value })}
                    disabled={loading}
                >
                    <SelectTrigger>
                        <SelectValue placeholder="Select website" />
                    </SelectTrigger>
                    <SelectContent>
                        {loading ? (
                            <div className="flex items-center justify-center py-2">
                                <IconLoader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                                <span className="ml-2 text-sm text-muted-foreground">Loading websites...</span>
                            </div>
                        ) : websites.length > 0 ? (
                            websites.map((website) => (
                                <SelectItem key={website.id} value={website.id}>
                                    {website.name}
                                </SelectItem>
                            ))
                        ) : (
                            <div className="flex items-center justify-center py-2">
                                <span className="text-sm text-muted-foreground">No websites available</span>
                                <button
                                    type="button"
                                    className="ml-2 text-blue-600 hover:text-blue-800 hover:underline text-sm"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        window.location.href = '/websites';
                                    }}
                                >
                                    Create one
                                </button>
                            </div>
                        )}
                    </SelectContent>
                </Select>
            </div>

            <div className="grid gap-2">
                <Label htmlFor="prompt_template_id">AI Prompt Template</Label>
                <Select
                    key={`workflow-prompt-select-${aiPrompts.length}-${loading}`}
                    value={formData.prompt_template_id || ""}
                    onValueChange={(value) => setFormData({ ...formData, prompt_template_id: value })}
                    disabled={loading}
                >
                    <SelectTrigger>
                        <SelectValue placeholder="Select AI prompt" />
                    </SelectTrigger>
                    <SelectContent>
                        {loading ? (
                            <div className="flex items-center justify-center py-2">
                                <IconLoader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                                <span className="ml-2 text-sm text-muted-foreground">Loading AI prompts...</span>
                            </div>
                        ) : aiPrompts.length > 0 ? (
                            aiPrompts.map((prompt) => (
                                <SelectItem key={prompt.id} value={prompt.id}>
                                    {prompt.name}
                                </SelectItem>
                            ))
                        ) : (
                            <div className="flex items-center justify-center py-2">
                                <span className="text-sm text-muted-foreground">No AI prompts available</span>
                                <button
                                    type="button"
                                    className="ml-2 text-blue-600 hover:text-blue-800 hover:underline text-sm"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        window.location.href = '/ai-prompts';
                                    }}
                                >
                                    Create one
                                </button>
                            </div>
                        )}
                    </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                    Select the AI prompt template to use for content generation
                </p>
            </div>

            <div className="grid gap-2">
                <Label htmlFor="webhook_id">Webhook URL</Label>
                <Select
                    key={`workflow-webhook-select-${webhooks.length}-${loading}`}
                    value={formData.webhook_id || ""}
                    onValueChange={(value) => setFormData({ ...formData, webhook_id: value })}
                    disabled={loading}
                >
                    <SelectTrigger>
                        <SelectValue placeholder="Select webhook" />
                    </SelectTrigger>
                    <SelectContent>
                        {loading ? (
                            <div className="flex items-center justify-center py-2">
                                <IconLoader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                                <span className="ml-2 text-sm text-muted-foreground">Loading webhooks...</span>
                            </div>
                        ) : webhooks.length > 0 ? (
                            webhooks.map((webhook) => (
                                <SelectItem key={webhook.id} value={webhook.id}>
                                    {webhook.name}
                                </SelectItem>
                            ))
                        ) : (
                            <div className="flex items-center justify-center py-2">
                                <span className="text-sm text-muted-foreground">No webhooks available</span>
                                <button
                                    type="button"
                                    className="ml-2 text-blue-600 hover:text-blue-800 hover:underline text-sm"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        window.location.href = '/webhooks';
                                    }}
                                >
                                    Create one
                                </button>
                            </div>
                        )}
                    </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                    Select the webhook to trigger for content generation
                </p>
            </div>

            <div className="grid gap-2">
                <Label htmlFor="schedule_type">Schedule Type</Label>
                <Select
                    value={formData.schedule_type || ""}
                    onValueChange={(value) => setFormData({ ...formData, schedule_type: value as any })}
                    disabled={loading}
                >
                    <SelectTrigger>
                        <SelectValue placeholder="Select schedule type" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="manual">Manual (triggered manually)</SelectItem>
                        <SelectItem value="cron">Cron (scheduled)</SelectItem>
                        <SelectItem value="interval">Interval (recurring)</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div className="flex items-center justify-between space-x-2">
                <div>
                    <Label htmlFor="is_active" className="text-sm font-medium">
                        Active
                    </Label>
                    <p className="text-xs text-muted-foreground">
                        Whether this workflow is active
                    </p>
                </div>
                <Checkbox
                    id="is_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked as boolean })}
                />
            </div>

            <div className="flex justify-end gap-2 pt-4">
                <Button
                    variant="outline"
                    onClick={onClose}
                    disabled={submitting}
                    type="button"
                >
                    Cancel
                </Button>
                <Button type="submit" disabled={submitting}>
                    {submitting && <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {workflow ? "Save Changes" : "Create Workflow"}
                </Button>
            </div>
        </form>
    );
}