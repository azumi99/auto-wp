"use client"

import * as React from "react"
import { IconLoader2 } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"

import { createWebhookClient, updateWebhookClient } from "@/src/lib/webhooks/client-actions"
import { Webhook } from "@/src/lib/webhooks/types"

interface WebhookFormProps {
    webhook?: Webhook | null
    onClose: () => void
    onSuccess?: () => void
}

export function WebhookForm({ webhook, onClose, onSuccess }: WebhookFormProps) {
    const [submitting, setSubmitting] = React.useState(false)
    const [formData, setFormData] = React.useState<Partial<Webhook>>({
        name: webhook?.name || "",
        url: webhook?.url || "",
        active: webhook?.active ?? true,
    })

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            setSubmitting(true)

            // Validate required fields
            if (!(formData.name ?? "").trim()) {
                toast.error("Please enter a webhook name")
                return
            }

            if (!(formData.url ?? "").trim()) {
                toast.error("Please enter a webhook URL")
                return
            }

            if (webhook) {
                await updateWebhookClient(webhook.id, formData)
                // Success toast is handled in the client action
            } else {
                await createWebhookClient({
                    name: formData.name ?? "",
                    url: formData.url ?? "",
                    active: formData.active
                })
                // Success toast is handled in the client action
            }

            onClose()
            if (onSuccess) {
                onSuccess()
            }
            // Realtime subscription will handle the update automatically - no need for router.refresh()
        } catch (error) {
            console.error("Error saving webhook:", error)
            toast.error("Failed to save webhook")
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="name">Webhook Name *</Label>
                <Input
                    id="name"
                    placeholder="e.g. WordPress Webhook"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                />
            </div>

            <div className="space-y-2">
                <Label htmlFor="url">Webhook URL *</Label>
                <Input
                    id="url"
                    type="url"
                    placeholder="https://your-webhook-endpoint.com/webhook"
                    value={formData.url}
                    onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                    required
                />
            </div>

            <div className="flex items-center space-x-2">
                <input
                    type="checkbox"
                    id="active"
                    checked={formData.active}
                    onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                    className="rounded border-gray-300"
                />
                <Label htmlFor="active">Enable webhook</Label>
            </div>

            <div className="flex justify-end gap-2">
                <Button
                    type="button"
                    variant="outline"
                    onClick={onClose}
                    disabled={submitting}
                >
                    Cancel
                </Button>
                <Button
                    type="submit"
                    disabled={submitting || !formData.name || !formData.url}
                >
                    {submitting && <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {webhook ? "Save Changes" : "Create Webhook"}
                </Button>
            </div>
        </form>
    )
}