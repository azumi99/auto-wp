"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { IconArticle, IconRefresh, IconDots, IconTrash, IconRocket, IconEye, IconCalendar, IconChevronLeft, IconChevronRight, IconSearch, IconWifi, IconWifiOff, IconCloudCheck, IconCloudOff } from "@tabler/icons-react"
import { AuthGuard } from "@/components/auth-guard"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { getArticlesClient } from "@/src/lib/articles/client-actions"
import { deleteArticleClient } from "@/src/lib/articles/client-actions"
import { GenerateArticleForm } from "@/src/screens/articles/generate-article-form"
import type { Article } from "@/src/lib/articles/types"
import { formatDateTime } from "@/src/lib/utils/date"
import { useArticlesRealtime } from "@/hooks/use-supabase-realtime"
import { createClient } from "@/lib/supabaseClient"


export default function ArticlesPage() {
  const [articles, setArticles] = useState<Article[]>([])

  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)
  const [generateDialogOpen, setGenerateDialogOpen] = useState(false)
  const [scheduledDialogOpen, setScheduledDialogOpen] = useState(false)
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [filterGenerationType, setFilterGenerationType] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState<string>("")
  const [debouncedSearch, setDebouncedSearch] = useState<string>("")
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  })

  // Initialize user and load data
  useEffect(() => {
    const initializeUser = async () => {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          setUserId(user.id)
          loadArticles()

        }
      } catch (error) {
        console.error('Error getting user:', error)
        toast.error('Failed to authenticate')
      }
    }
    initializeUser()
  }, [])
  console.log('ArticlesPage: articles state initialized with', articles, 'articles')

  const loadArticles = async (page?: number, search?: string) => {
    try {
      setLoading(true)
      const result = await getArticlesClient(
        page || pagination.page,
        pagination.limit,
        filterStatus,
        filterGenerationType,
        search || debouncedSearch
      )
      setArticles(result.articles)
      setPagination(prev => ({
        ...prev,
        page: result.page,
        total: result.total,
        totalPages: result.totalPages
      }))
    } catch (error: any) {
      toast.error(error.message || "Failed to load articles")
    } finally {
      setLoading(false)
    }
  }

  // Setup realtime subscription - this will fetch data and handle realtime updates
  const { data: realtimeData, isConnected, error: realtimeError, loading: realtimeLoading } = useArticlesRealtime(
    userId || '',
    undefined // Let the hook fetch its own data
  )

  // Log realtime updates for debugging
  useEffect(() => {
    if (realtimeData) {
      console.log('Realtime articles data updated:', realtimeData)
      loadArticles()
    }
  }, [realtimeData])

  // Use realtime data as primary source, fallback to initial data only during initial load
  const currentArticles = Array.isArray(realtimeData) ? realtimeData : Array.isArray(articles) ? articles : []
  const isLoading = loading || (realtimeLoading && !realtimeData)

  // Sort articles by created_at in descending order (newest first)
  const sortedArticles = useMemo(() => {
    return [...currentArticles].sort((a, b) =>
      new Date(b.created_at || b.updated_at).getTime() - new Date(a.created_at || a.updated_at).getTime()
    )
  }, [currentArticles])

  // Apply client-side filtering to sorted articles with useMemo to prevent re-computation
  const filteredArticles = useMemo(() => {
    return sortedArticles.filter((article) => {
      const matchesSearch = !debouncedSearch ||
        article.title.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        (article.websites?.name && article.websites.name.toLowerCase().includes(debouncedSearch.toLowerCase())) ||
        (article.webhooks?.name && article.webhooks.name.toLowerCase().includes(debouncedSearch.toLowerCase()))

      const matchesStatus = filterStatus === "all" || article.status === filterStatus
      const matchesGenerationType = filterGenerationType === "all" || article.generation_type === filterGenerationType

      return matchesSearch && matchesStatus && matchesGenerationType
    })
  }, [sortedArticles, debouncedSearch, filterStatus, filterGenerationType])

  // Debug filtered articles to see changes
  useEffect(() => {
    console.log('Filtered articles updated:', filteredArticles?.length || 0)
  }, [filteredArticles?.length])

  // Debug current articles to see changes
  useEffect(() => {
    console.log('Current articles updated:', currentArticles?.length || 0)
  }, [currentArticles?.length])

  // Debug realtime data to see changes
  useEffect(() => {
    console.log('Realtime data updated:', realtimeData?.length || 0)
  }, [realtimeData?.length])

  // Handle realtime connection errors
  useEffect(() => {
    if (realtimeError) {
      console.error('Realtime connection error:', realtimeError)
      toast.error(`Realtime updates unavailable: ${realtimeError.message}`)
    }
  }, [realtimeError])

  // Debug realtime status (only in development)
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('Articles state update:', {
        realtimeDataCount: realtimeData?.length || 0,
        initialDataCount: (articles?.length || 0),
        currentDataCount: (currentArticles?.length || 0),
        filteredDataCount: (filteredArticles?.length || 0),
        isConnected,
        isLoading,
        error: realtimeError?.message
      })
    }
  }, [(realtimeData?.length || 0), (articles?.length || 0), (currentArticles?.length || 0), (filteredArticles?.length || 0), isConnected, isLoading, realtimeError?.message])

  // Debounced search effect
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery)
    }, 300) // 300ms debounce

    return () => clearTimeout(timer)
  }, [searchQuery])

  // Reset to page 1 when filters or search changes
  useEffect(() => {
    setPagination(prev => ({ ...prev, page: 1 })) // Reset page
    // Filtering is now done client-side, no need to reload from server
  }, [filterStatus, filterGenerationType, debouncedSearch])

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this article?")) return

    try {
      await deleteArticleClient(id)
      // Success toast is handled in the client action
      // Data will be updated automatically via realtime subscription
    } catch (error: any) {
      // Error toast is handled in the client action
    }
  }

  const handleSuccess = () => {
    setGenerateDialogOpen(false)
    setScheduledDialogOpen(false)
    // Data will be updated automatically via realtime subscription
  }

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setPagination(prev => ({ ...prev, page: newPage }))
      // No need to loadArticles since we're using client-side filtering
      // Data is already available in currentArticles
    }
  }

  const handleSearchChange = (value: string) => {
    setSearchQuery(value)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "published": return "bg-green-100 text-green-800 border-green-200"
      case "draft": return "bg-gray-100 text-gray-800 border-gray-200"
      case "scheduled": return "bg-blue-100 text-blue-800 border-blue-200"
      case "failed": return "bg-red-100 text-red-800 border-red-200"
      case "archived": return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "pending": return "bg-orange-100 text-orange-800 border-orange-200"
      case "processing": return "bg-purple-100 text-purple-800 border-purple-200"
      case "posted": return "bg-emerald-100 text-emerald-800 border-emerald-200"
      default: return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getGenerationTypeColor = (type: string) => {
    switch (type) {
      case "manual": return "bg-violet-100 text-violet-800 border-violet-200"
      case "scheduled": return "bg-amber-100 text-amber-800 border-amber-200"
      default: return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getGenerationTypeIcon = (type: string) => {
    switch (type) {
      case "manual": return <IconRocket className="h-3 w-3" />
      case "scheduled": return <IconCalendar className="h-3 w-3" />
      default: return <IconRocket className="h-3 w-3" />
    }
  }

  return (
    <AuthGuard>
      <div className="flex flex-col gap-6 p-4 md:p-6">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <h1 className="text-2xl md:text-3xl font-bold">Articles</h1>
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
              <p className="text-muted-foreground text-sm md:text-base">
                Generate AI content for your websites - Manual, Scheduled, or Recurring
              </p>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Button variant="outline" size="icon" onClick={() => loadArticles()} className="shrink-0">
                <IconRefresh className="h-4 w-4" />
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="default" className="shrink-0">
                    <IconRocket className="h-4 w-4 mr-2" />
                    <span className="hidden sm:inline">Generate Article</span>
                    <span className="sm:hidden">Generate</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setGenerateDialogOpen(true)}>
                    <IconRocket className="h-4 w-4 mr-2" />
                    Generate Now (Manual)
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setScheduledDialogOpen(true)}>
                    <IconCalendar className="h-4 w-4 mr-2" />
                    Schedule for Later
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Search Bar */}
          <div className="w-full sm:max-w-md">
            <div className="relative">
              <IconSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search articles by title, website, or workflow..."
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-10 w-full"
              />
            </div>
          </div>
        </div>

        <Dialog open={generateDialogOpen} onOpenChange={setGenerateDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Generate AI Article (Manual)</DialogTitle>
              <DialogDescription>
                Generate content immediately for your website
              </DialogDescription>
            </DialogHeader>
            <GenerateArticleForm onSuccess={handleSuccess} generationType="manual" />
          </DialogContent>
        </Dialog>

        <Dialog open={scheduledDialogOpen} onOpenChange={setScheduledDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Schedule Article Generation</DialogTitle>
              <DialogDescription>
                Schedule article generation for a specific date and time
              </DialogDescription>
            </DialogHeader>
            <GenerateArticleForm onSuccess={handleSuccess} generationType="scheduled" />
          </DialogContent>
        </Dialog>

        <div className="space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex flex-col sm:flex-row gap-4">
              {/* <div>
                <label className="text-sm font-medium mb-2 block">Status</label>
                <Tabs value={filterStatus} onValueChange={setFilterStatus}>
                  <TabsList className="w-full sm:w-auto flex flex-wrap h-auto">
                    <TabsTrigger value="all" className="text-xs">All</TabsTrigger>
                    <TabsTrigger value="draft" className="text-xs">Draft</TabsTrigger>
                    <TabsTrigger value="scheduled" className="text-xs">Scheduled</TabsTrigger>
                    <TabsTrigger value="posted" className="text-xs">Published</TabsTrigger>
                    <TabsTrigger value="failed" className="text-xs">Failed</TabsTrigger>
                    <TabsTrigger value="pending" className="text-xs">Pending</TabsTrigger>
                    <TabsTrigger value="processing" className="text-xs">Processing</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div> */}

              <div>
                <label className="text-sm font-medium mb-2 block">Type</label>
                <Tabs value={filterGenerationType} onValueChange={setFilterGenerationType}>
                  <TabsList className="w-full sm:w-auto flex flex-wrap h-auto">
                    <TabsTrigger value="all" className="text-xs">All Types</TabsTrigger>
                    <TabsTrigger value="manual" className="text-xs">Manual</TabsTrigger>
                    <TabsTrigger value="scheduled" className="text-xs">Scheduled</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </div>

            <div className="text-sm text-muted-foreground lg:text-right">
              {pagination.total > 0 && (
                <div>
                  Showing {((pagination.page || 1) - 1) * (pagination.limit || 10) + 1} to {Math.min((pagination.page || 1) * (pagination.limit || 10), pagination.total || 0)} of {pagination.total || 0} articles
                </div>
              )}
              {loading && <div className="text-blue-600">Loading...</div>}
            </div>
          </div>
        </div>

        <div className="grid gap-4">
          {isLoading ? (
            <div className="grid gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
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
              ))}
            </div>
          ) : !isLoading && (currentArticles?.length || 0) === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-16 px-4">
                <IconSearch className="h-16 w-16 text-muted-foreground mb-6" />
                <h3 className="text-xl font-semibold mb-2 text-center">
                  {searchQuery ? "No articles found" : "No articles yet"}
                </h3>
                <p className="text-muted-foreground mb-6 text-center max-w-md">
                  {searchQuery
                    ? `No articles found matching "${searchQuery}". Try different keywords or clear the search.`
                    : "Get started by generating your first AI article"
                  }
                </p>
                <div className="flex flex-col gap-3 items-center">
                  {searchQuery ? (
                    <Button variant="outline" onClick={() => handleSearchChange("")} size="lg">
                      Clear Search
                    </Button>
                  ) : (
                    <>
                      <Button onClick={() => setGenerateDialogOpen(true)} size="lg">
                        <IconRocket className="h-4 w-4 mr-2" />
                        Generate Article
                      </Button>
                      <p className="text-xs text-muted-foreground text-center">
                        Note: You need to create a{' '}
                        <a href="/websites" className="text-blue-600 hover:underline font-medium">
                          website
                        </a>{' '}
                        and{' '}
                        <a href="/webhooks" className="text-blue-600 hover:underline font-medium">
                          webhook
                        </a>{' '}
                        first
                      </p>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="grid gap-4 md:gap-6">
                {(() => {
                  // Apply pagination to filtered articles
                  const page = pagination.page || 1
                  const limit = pagination.limit || 10
                  const startIndex = (page - 1) * limit
                  const endIndex = startIndex + limit
                  const paginatedArticles = filteredArticles.slice(startIndex, endIndex)

                  return paginatedArticles.map((article) => (
                    <Card key={article.id} className="hover:shadow-lg transition-all duration-200 border-border/50 hover:border-border">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <CardTitle className="text-lg md:text-xl leading-tight break-words">{article.title}</CardTitle>
                            {article.content && (
                              <CardDescription className="mt-2 line-clamp-2">
                                {article.content.substring(0, 150)}...
                              </CardDescription>
                            )}
                            <div className="flex flex-wrap gap-2 mt-3">
                              <div className="text-sm text-muted-foreground">
                                <span className="font-medium">Website:</span>{' '}
                                {article.websites?.name || 'Unknown'}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                <span className="font-medium">Workflow:</span>{' '}
                                {article.webhooks?.name || 'Unknown'}
                              </div>
                            </div>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="shrink-0">
                                <IconDots className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {article.wp_post_url && (
                                <DropdownMenuItem asChild>
                                  <a href={article.wp_post_url} target="_blank" rel="noopener noreferrer">
                                    <IconEye className="h-4 w-4 mr-2" />
                                    View Post
                                  </a>
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem
                                onClick={() => handleDelete(article.id)}
                                className="text-red-600"
                              >
                                <IconTrash className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="flex flex-wrap gap-2 items-center mb-3">
                          <Badge className={`${getStatusColor(article.status || 'draft')} border font-medium`} variant="default">
                            {article.status || 'draft'}
                          </Badge>
                          <Badge className={`${getGenerationTypeColor(article.generation_type || 'manual')} border font-medium`} variant="default">
                            {getGenerationTypeIcon(article.generation_type || 'manual')}
                            <span className="ml-1">{article.generation_type || 'manual'}</span>
                          </Badge>
                          {article.generation_message && (
                            <Badge variant="outline" className="bg-blue-500 text-white dark:bg-blue-800">
                              {article.generation_message}
                            </Badge>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-3 gap-y-2 items-center text-xs text-muted-foreground">
                          {article.word_count && (
                            <span className="flex items-center gap-1">
                              <span>•</span>
                              {article.word_count} words
                            </span>
                          )}
                          {article.generation_time_seconds && (
                            <span className="flex items-center gap-1">
                              <span>•</span>
                              Generated in {article.generation_time_seconds}s
                            </span>
                          )}
                          {article.scheduled_at && (
                            <span className="flex items-center gap-1">
                              <span>•</span>
                              Scheduled: {formatDateTime(article.scheduled_at)}
                            </span>
                          )}
                          <span className="flex items-center gap-1 ml-auto">
                            <span>•</span>
                            {formatDateTime(article.created_at)}
                          </span>
                        </div>
                        {article.tags && (article.tags?.length || 0) > 0 && (
                          <div className="flex flex-wrap gap-1 mt-3">
                            {(article.tags || []).slice(0, 5).map((tag: any, i: any) => (
                              <Badge key={i} variant="secondary" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                            {(article.tags?.length || 0) > 5 && (
                              <Badge variant="secondary" className="text-xs">
                                +{(article.tags?.length || 0) - 5} more
                              </Badge>
                            )}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))
                })()}
              </div>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="flex justify-center mt-6">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(pagination.page - 1)}
                      disabled={pagination.page <= 1}
                    >
                      <IconChevronLeft className="h-4 w-4" />
                      Previous
                    </Button>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                        const pageNum = i + 1
                        const isCurrentPage = pageNum === pagination.page
                        const showPage = pageNum === 1 ||
                          pageNum === pagination.totalPages ||
                          (pageNum >= pagination.page - 1 && pageNum <= pagination.page + 1)

                        if (!showPage && pageNum === pagination.page - 2) {
                          return <span key={pageNum} className="px-2 text-muted-foreground">...</span>
                        }
                        if (!showPage && pageNum === pagination.page + 2) {
                          return <span key={pageNum} className="px-2 text-muted-foreground">...</span>
                        }

                        if (!showPage) return null

                        return (
                          <Button
                            key={pageNum}
                            variant={isCurrentPage ? "default" : "outline"}
                            size="sm"
                            onClick={() => handlePageChange(pageNum)}
                            className="min-w-[32px]"
                          >
                            {pageNum}
                          </Button>
                        )
                      })}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(pagination.page + 1)}
                      disabled={pagination.page >= pagination.totalPages}
                    >
                      Next
                      <IconChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </AuthGuard>
  )
}
