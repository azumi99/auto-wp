"use client"

import * as React from "react"
import {
    IconPlus,
    IconEdit,
    IconTrash,
    IconDots,
    IconBuilding,
    IconUsers,
    IconWorld,
    IconSearch,
    IconLoader2
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
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
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
import { Separator } from "@/components/ui/separator"
import { getCompanies, createCompany, updateCompany, deleteCompany } from "@/src/lib/company/companies"
import { toast } from "sonner"

interface Company {
    id: string
    name: string
    slug: string
    description: string | null
    website_url: string | null
    status: string
    member_count?: number
    website_count?: number
    created_at: string
    owner_id: string
}

export default function CompanyPage() {
    const [companies, setCompanies] = React.useState<Company[]>([])
    const [loading, setLoading] = React.useState(true)
    const [searchQuery, setSearchQuery] = React.useState("")
    const [isCreateDialogOpen, setIsCreateDialogOpen] = React.useState(false)
    const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false)
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false)
    const [selectedCompany, setSelectedCompany] = React.useState<Company | null>(null)
    const [submitting, setSubmitting] = React.useState(false)
    const [formData, setFormData] = React.useState<any>({
        name: "",
        slug: "",
        description: "",
        website_url: "",
        status: "active",
    })

    React.useEffect(() => {
        loadCompanies()
    }, [])

    const loadCompanies = async () => {
        try {
            setLoading(true)
            const data = await getCompanies()
            setCompanies(data)
        } catch (error) {
            console.error('Error loading companies:', error)
            toast.error('Failed to load companies')
        } finally {
            setLoading(false)
        }
    }

    const filteredCompanies = companies.filter((company) =>
        company.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        company.slug.toLowerCase().includes(searchQuery.toLowerCase())
    )

    const handleCreate = async () => {
        try {
            setSubmitting(true)
            await createCompany({
                ...formData,
                owner_id: '1', // Replace with actual user ID from auth context
            })
            toast.success('Company created successfully')
            setIsCreateDialogOpen(false)
            resetForm()
            loadCompanies()
        } catch (error) {
            console.error('Error creating company:', error)
            toast.error('Failed to create company')
        } finally {
            setSubmitting(false)
        }
    }

    const handleEdit = async () => {
        if (!selectedCompany) return

        try {
            setSubmitting(true)
            await updateCompany(selectedCompany.id, formData)
            toast.success('Company updated successfully')
            setIsEditDialogOpen(false)
            resetForm()
            loadCompanies()
        } catch (error) {
            console.error('Error updating company:', error)
            toast.error('Failed to update company')
        } finally {
            setSubmitting(false)
        }
    }

    const handleDelete = async () => {
        if (!selectedCompany) return

        try {
            setSubmitting(true)
            await deleteCompany(selectedCompany.id)
            toast.success('Company deleted successfully')
            setIsDeleteDialogOpen(false)
            setSelectedCompany(null)
            loadCompanies()
        } catch (error) {
            console.error('Error deleting company:', error)
            toast.error('Failed to delete company')
        } finally {
            setSubmitting(false)
        }
    }

    const openEditDialog = (company: Company) => {
        setSelectedCompany(company)
        setFormData({
            name: company.name,
            slug: company.slug,
            description: company.description || "",
            website_url: company.website_url || "",
            status: company.status,
        })
        setIsEditDialogOpen(true)
    }

    const openDeleteDialog = (company: Company) => {
        setSelectedCompany(company)
        setIsDeleteDialogOpen(true)
    }

    const resetForm = () => {
        setFormData({
            name: "",
            slug: "",
            description: "",
            website_url: "",
            status: "active",
        })
        setSelectedCompany(null)
    }

    const generateSlug = (name: string) => {
        return name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/(^-|-$)/g, "")
    }

    const handleNameChange = (value: string) => {
        setFormData({
            ...formData,
            name: value,
            slug: generateSlug(value),
        })
    }

    const getStatusBadge = (status: string) => {
        const variants: Record<string, any> = {
            active: { variant: "default", label: "Active" },
            inactive: { variant: "secondary", label: "Inactive" },
            suspended: { variant: "destructive", label: "Suspended" },
        }
        const config = variants[status] || variants.active
        return <Badge variant={config.variant}>{config.label}</Badge>
    }

    const totalMembers = companies.reduce((sum, c) => sum + (c.member_count || 0), 0)
    const totalWebsites = companies.reduce((sum, c) => sum + (c.website_count || 0), 0)

    if (loading) {
        return (
            <div className="flex flex-1 items-center justify-center min-h-[400px]">
                <div className="flex flex-col items-center gap-2">
                    <IconLoader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">Loading companies...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="flex flex-1 flex-col gap-4 p-4 md:gap-6 md:p-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="space-y-1">
                    <h1 className="text-3xl font-bold tracking-tight">Companies</h1>
                    <p className="text-sm text-muted-foreground">
                        Manage your organizations and their settings
                    </p>
                </div>
                <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <IconPlus className="mr-2 h-4 w-4" />
                            Add Company
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[500px]">
                        <DialogHeader>
                            <DialogTitle>Create New Company</DialogTitle>
                            <DialogDescription>
                                Add a new company to manage websites and content
                            </DialogDescription>
                        </DialogHeader>
                        <ScrollArea className="max-h-[60vh]">
                            <div className="grid gap-4 p-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="name">Company Name *</Label>
                                    <Input
                                        id="name"
                                        placeholder="Tech Ventures Inc"
                                        value={formData.name}
                                        onChange={(e) => handleNameChange(e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="slug">Slug *</Label>
                                    <Input
                                        id="slug"
                                        placeholder="tech-ventures"
                                        value={formData.slug}
                                        onChange={(e) =>
                                            setFormData({ ...formData, slug: e.target.value })
                                        }
                                        required
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        URL-friendly version of the name
                                    </p>
                                </div>
                                <Separator />
                                <div className="grid gap-2">
                                    <Label htmlFor="description">Description</Label>
                                    <Textarea
                                        id="description"
                                        placeholder="Brief description of the company"
                                        value={formData.description}
                                        onChange={(e) =>
                                            setFormData({ ...formData, description: e.target.value })
                                        }
                                        rows={3}
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="website_url">Website URL</Label>
                                    <Input
                                        id="website_url"
                                        type="url"
                                        placeholder="https://example.com"
                                        value={formData.website_url}
                                        onChange={(e) =>
                                            setFormData({ ...formData, website_url: e.target.value })
                                        }
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="status">Status</Label>
                                    <Select
                                        value={formData.status}
                                        onValueChange={(value) =>
                                            setFormData({ ...formData, status: value })
                                        }
                                    >
                                        <SelectTrigger id="status">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="active">Active</SelectItem>
                                            <SelectItem value="inactive">Inactive</SelectItem>
                                            <SelectItem value="suspended">Suspended</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </ScrollArea>
                        <DialogFooter>
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setIsCreateDialogOpen(false)
                                    resetForm()
                                }}
                                disabled={submitting}
                            >
                                Cancel
                            </Button>
                            <Button onClick={handleCreate} disabled={submitting || !formData.name || !formData.slug}>
                                {submitting && <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Create Company
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Total Companies
                        </CardTitle>
                        <IconBuilding className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{companies.length}</div>
                        <p className="text-xs text-muted-foreground">
                            Active organizations
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Members</CardTitle>
                        <IconUsers className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalMembers}</div>
                        <p className="text-xs text-muted-foreground">
                            Across all companies
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Websites</CardTitle>
                        <IconWorld className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalWebsites}</div>
                        <p className="text-xs text-muted-foreground">
                            Managed websites
                        </p>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div className="space-y-1">
                            <CardTitle>All Companies</CardTitle>
                            <CardDescription>
                                {filteredCompanies.length} {filteredCompanies.length === 1 ? 'company' : 'companies'} found
                            </CardDescription>
                        </div>
                        <div className="relative w-full md:w-64">
                            <IconSearch className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search companies..."
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
                            {filteredCompanies.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-12 text-center">
                                    <IconBuilding className="h-12 w-12 text-muted-foreground/50 mb-4" />
                                    <h3 className="text-lg font-semibold">No companies found</h3>
                                    <p className="text-sm text-muted-foreground mt-2">
                                        {searchQuery ? 'Try adjusting your search' : 'Get started by creating your first company'}
                                    </p>
                                    {!searchQuery && (
                                        <Button className="mt-4" onClick={() => setIsCreateDialogOpen(true)}>
                                            <IconPlus className="mr-2 h-4 w-4" />
                                            Add Company
                                        </Button>
                                    )}
                                </div>
                            ) : (
                                filteredCompanies.map((company) => (
                                    <Card key={company.id}>
                                        <CardContent className="flex items-center justify-between p-6">
                                            <div className="flex items-center gap-4 flex-1">
                                                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                                                    <IconBuilding className="h-6 w-6 text-primary" />
                                                </div>
                                                <div className="flex-1 space-y-1">
                                                    <div className="flex items-center gap-2">
                                                        <h3 className="font-semibold">{company.name}</h3>
                                                        {getStatusBadge(company.status)}
                                                    </div>
                                                    <div className="flex flex-col gap-1 text-sm text-muted-foreground md:flex-row md:items-center md:gap-4">
                                                        <span className="font-mono">{company.slug}</span>
                                                        {company.website_url && (
                                                            <>
                                                                <Separator orientation="vertical" className="hidden h-4 md:block" />
                                                                <a
                                                                    href={company.website_url}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="text-blue-600 hover:underline inline-flex items-center gap-1"
                                                                >
                                                                    <IconWorld className="h-3 w-3" />
                                                                    {company.website_url.replace(/^https?:\/\//, "")}
                                                                </a>
                                                            </>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                                        <span className="inline-flex items-center gap-1">
                                                            <IconUsers className="h-3 w-3" />
                                                            {company.member_count || 0} members
                                                        </span>
                                                        <span className="inline-flex items-center gap-1">
                                                            <IconWorld className="h-3 w-3" />
                                                            {company.website_count || 0} websites
                                                        </span>
                                                        <Separator orientation="vertical" className="h-3" />
                                                        <span>Created {new Date(company.created_at).toLocaleDateString()}</span>
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
                                                    <DropdownMenuItem onClick={() => openEditDialog(company)}>
                                                        <IconEdit className="mr-2 h-4 w-4" />
                                                        Edit
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        className="text-destructive focus:text-destructive"
                                                        onClick={() => openDeleteDialog(company)}
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

            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>Edit Company</DialogTitle>
                        <DialogDescription>
                            Update company information and settings
                        </DialogDescription>
                    </DialogHeader>
                    <ScrollArea className="max-h-[60vh]">
                        <div className="grid gap-4 p-4">
                            <div className="grid gap-2">
                                <Label htmlFor="edit-name">Company Name *</Label>
                                <Input
                                    id="edit-name"
                                    value={formData.name}
                                    onChange={(e) => handleNameChange(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="edit-slug">Slug *</Label>
                                <Input
                                    id="edit-slug"
                                    value={formData.slug}
                                    onChange={(e) =>
                                        setFormData({ ...formData, slug: e.target.value })
                                    }
                                    required
                                />
                            </div>
                            <Separator />
                            <div className="grid gap-2">
                                <Label htmlFor="edit-description">Description</Label>
                                <Textarea
                                    id="edit-description"
                                    value={formData.description}
                                    onChange={(e) =>
                                        setFormData({ ...formData, description: e.target.value })
                                    }
                                    rows={3}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="edit-website">Website URL</Label>
                                <Input
                                    id="edit-website"
                                    type="url"
                                    value={formData.website_url}
                                    onChange={(e) =>
                                        setFormData({ ...formData, website_url: e.target.value })
                                    }
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="edit-status">Status</Label>
                                <Select
                                    value={formData.status}
                                    onValueChange={(value) =>
                                        setFormData({ ...formData, status: value })
                                    }
                                >
                                    <SelectTrigger id="edit-status">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="active">Active</SelectItem>
                                        <SelectItem value="inactive">Inactive</SelectItem>
                                        <SelectItem value="suspended">Suspended</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </ScrollArea>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => {
                                setIsEditDialogOpen(false)
                                resetForm()
                            }}
                            disabled={submitting}
                        >
                            Cancel
                        </Button>
                        <Button onClick={handleEdit} disabled={submitting || !formData.name || !formData.slug}>
                            {submitting && <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Save Changes
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently delete{" "}
                            <span className="font-semibold text-foreground">{selectedCompany?.name}</span> and
                            all associated data including websites, articles, and workflows.
                            This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setSelectedCompany(null)} disabled={submitting}>
                            Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            disabled={submitting}
                        >
                            {submitting && <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Delete Company
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}