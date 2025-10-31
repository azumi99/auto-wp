"use client"

import * as React from "react"
import { IconLoader2 } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { Website } from "@/src/lib/websites/types"
import { createWebsiteClient, updateWebsiteClient } from "@/src/lib/websites/client-actions"
import { useRouter } from "next/navigation"

interface WebsiteFormProps {
    website?: Website | null
    onClose: () => void
    onSuccess?: () => void
}

export function WebsiteForm({ website, onClose, onSuccess }: WebsiteFormProps) {
    const router = useRouter()
    const [submitting, setSubmitting] = React.useState(false)
    const [formData, setFormData] = React.useState<Partial<Website>>({
        name: website?.name || "",
        url: website?.url || "",
        wp_username: website?.wp_username || "",
        wp_password: website?.wp_password || "",
        wp_token: website?.wp_token || null,
    })

    const handleSubmit = async () => {
        console.log('handleSubmit called with website:', website, 'and formData:', formData)
        try {
            setSubmitting(true)
            if (website) {
                console.log('Calling updateWebsiteClient with id:', website.id)
                await updateWebsiteClient(website.id, formData)
                console.log('updateWebsiteClient completed successfully')
                // Success toast is handled in the client action
            } else {
                console.log('Calling createWebsiteClient with formData:', formData)
                await createWebsiteClient(formData)
                console.log('createWebsiteClient completed successfully')
                // Success toast is handled in the client action
            }
            onClose()
            if (onSuccess) {
                onSuccess()
            }
            // Refresh to ensure UI updates
            router.refresh()
        } catch (error) {
            console.error("Error saving website:", error)
            toast.error("Failed to save website")
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <div className="grid gap-4 p-4">
            <div className="grid gap-2">
                <Label htmlFor="name">Website Name *</Label>
                <Input
                    id="name"
                    placeholder="My Awesome Blog"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                />
            </div>
            <div className="grid gap-2">
                <Label htmlFor="url">Website URL *</Label>
                <Input
                    id="url"
                    type="url"
                    placeholder="https://my-awesome-blog.com"
                    value={formData.url}
                    onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                    required
                />
            </div>
            <div className="grid gap-2">
                <Label htmlFor="wp_username">WordPress Username *</Label>
                <Input
                    id="wp_username"
                    placeholder="wordpress_user"
                    value={formData.wp_username || ""}
                    onChange={(e) => setFormData({ ...formData, wp_username: e.target.value })}
                    required
                />
            </div>
            <div className="grid gap-2">
                <Label htmlFor="wp_password">WordPress Password *</Label>
                <Input
                    id="wp_password"
                    type="password"
                    placeholder="WordPress application password"
                    value={formData.wp_password || ""}
                    onChange={(e) => setFormData({ ...formData, wp_password: e.target.value })}
                    required
                />
            </div>
            <div className="grid gap-2">
                <Label htmlFor="wp_token">WordPress JWT/API Token</Label>
                <Input
                    id="wp_token"
                    type="password"
                    placeholder="Optional JWT token"
                    value={formData.wp_token || ""}
                    onChange={(e) => setFormData({ ...formData, wp_token: e.target.value })}
                />
            </div>
            <div className="flex justify-end gap-2">
                <Button
                    variant="outline"
                    onClick={onClose}
                    disabled={submitting}
                >
                    Cancel
                </Button>
                <Button onClick={handleSubmit} disabled={submitting || !formData.name || !formData.url}>
                    {submitting && <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {website ? "Save Changes" : "Create Website"}
                </Button>
            </div>
        </div>
    )
}