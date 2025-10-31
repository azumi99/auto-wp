"use client";

import * as React from "react";
import { IconLoader2 } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { AIPrompt } from "@/src/lib/ai_prompts/types";
import { createAIPromptClient, updateAIPromptClient } from "@/src/lib/ai_prompts/client-actions";

interface AIPromptFormProps {
    aiPrompt?: AIPrompt | null;
    onClose: () => void;
    onSuccess?: () => void;
}

export function AIPromptForm({ aiPrompt, onClose, onSuccess }: AIPromptFormProps) {
    const [submitting, setSubmitting] = React.useState(false);
    const [formData, setFormData] = React.useState<Partial<AIPrompt>>({
        name: aiPrompt?.name || "",
        template: aiPrompt?.template || "",
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setSubmitting(true);
            if (aiPrompt) {
                await updateAIPromptClient(aiPrompt.id, formData);
                // Success toast is handled in the client action
            } else {
                await createAIPromptClient(formData);
                // Success toast is handled in the client action
            }
            onClose();
            if (onSuccess) {
                onSuccess();
            }
            // Realtime subscription will handle the update automatically - no need for router.refresh()
        } catch (error) {
            console.error("Error saving AI prompt:", error);
            toast.error(aiPrompt ? "Failed to update AI prompt" : "Failed to create AI prompt");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="grid gap-4 p-4 flex-1">
            <div className="grid gap-2">
                <Label htmlFor="name">Prompt Name *</Label>
                <Input
                    id="name"
                    placeholder="e.g. Default SEO Blog Prompt"
                    value={formData.name || ""}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                />
                <p className="text-xs text-muted-foreground">
                    A descriptive name for this AI prompt template
                </p>
            </div>
            <div className="grid gap-2 flex-1">
                <Label htmlFor="template">Prompt Template *</Label>
                <div className="flex-1 min-h-0">
                    <Textarea
                        id="template"
                        placeholder="Enter your AI prompt template here. You can use variables like {topic}, {keyword}, etc."
                        value={formData.template || ""}
                        onChange={(e) => setFormData({ ...formData, template: e.target.value })}
                        rows={8}
                        required
                        className="h-full min-h-[200px]"
                    />
                </div>
                <p className="text-xs text-muted-foreground">
                    The template used for generating content. Use variables like &#123;topic&#125;, &#123;style&#125;, &#123;keyword&#125; that will be replaced during generation.
                </p>
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
                    {aiPrompt ? "Save Changes" : "Create Prompt"}
                </Button>
            </div>
        </form>
    );
}