"use client"

import { useState, useEffect, useCallback } from "react"
import { IconArticle, IconRefresh, IconDots, IconTrash, IconRocket, IconEye, IconCalendar, IconChevronLeft, IconChevronRight, IconSearch, IconWifi, IconWifiOff } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { getArticlesClient, deleteArticleClient } from "@/src/lib/articles/client-actions"
import { GenerateArticleForm } from "@/src/screens/articles/generate-article-form"
import { ArticleProgressTracker } from "@/components/article-progress-tracker"
import { RealtimeProvider, useRealtimeArticles } from "@/components/realtime-provider"
import { useCurrentUser } from "@/hooks/use-auth"
import type { Article } from "@/src/lib/articles/types"
import { formatDateTime } from "@/src/lib/utils/date"

// Inner component that uses the realtime context
function ArticlesPageContent() {
  const { user } = useCurrentUser()
  const { articles: realtimeArticles, isConnected, connectionError } = useRealtimeArticles()

  const [articles, setArticles] = useState<Article[]>([])
  const [loading, setLoading] = useState(true)
  const [generateDialogOpen, setGenerateDialogOpen] = useState(false)
  const [scheduledDialogOpen, setScheduledDialogOpen] = useState(false)
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [filterGenerationType, setFilterGenerationType] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState<string>("")
  const [debouncedSearch, setDebouncedSearch] = useState<string>("")
  const [useRealtime, setUseRealtime] = useState(true)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  })

  // Use realtime data when available and enabled
  const currentArticles = useRealtime && realtimeArticles ? realtimeArticles : articles

  const loadArticles = async (page?: number, search?: string) => {
    try {
      setLoading(true)
      const result = await getArticles(
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
    } catch (error) {
      console.error('Failed to load articles:', error)
      toast.error('Failed to load articles')
    } finally {
      setLoading(false)
    }
  }

  // Initial load
  useEffect(() => {
    if (!useRealtime && user) {
      loadArticles()
    }
  }, [filterStatus, filterGenerationType, debouncedSearch, useRealtime, user])

  // Search debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery)
    }, 500)

    return () => clearTimeout(timer)
  }, [searchQuery])

  // Refresh function
  const handleRefresh = useCallback(() => {
    if (!useRealtime) {
      loadArticles()
    } else {
      // Realtime data updates automatically, just show a toast
      toast.success('Data is updated in real-time')
    }
  }, [useRealtime, loadArticles])

  const handleDeleteArticle = async (id: string) => {
    try {
      await deleteArticle(id)
      toast.success('Article deleted successfully')
      if (!useRealtime) {
        loadArticles()
      }
    } catch (error) {
      console.error('Failed to delete article:', error)
      toast.error('Failed to delete article')
    }
  }

  // Get scheduled articles for progress tracker
  const scheduledArticles = currentArticles?.filter(article =>
    ['pending', 'scheduled', 'processing'].includes(article.status)
  ) || []

  // Filter articles for display
  const filteredArticles = currentArticles?.filter(article => {
    const matchesStatus = filterStatus === 'all' || article.status === filterStatus
    const matchesGenerationType = filterGenerationType === 'all' || article.generation_type === filterGenerationType
    const matchesSearch = !debouncedSearch ||
      article.title.toLowerCase().includes(debouncedSearch.toLowerCase())
    return matchesStatus && matchesGenerationType && matchesSearch
  }) || []

  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <p>Please log in to view articles.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with Realtime Status */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Articles</h1>
          <p className="text-muted-foreground">
            Manage your AI-generated articles and track their progress
          </p>
        </div>
        <div className="flex items-center gap-4">
          {/* Realtime Status */}
          <div className="flex items-center gap-2">
            {connectionError ? (
              <>
                <IconWifiOff className="h-4 w-4 text-red-500" />
                <Badge variant="destructive" className="text-xs">
                  Realtime Error
                </Badge>
              </>
            ) : useRealtime && isConnected ? (
              <>
                <IconWifi className="h-4 w-4 text-green-500" />
                <Badge variant="default" className="text-xs bg-green-100 text-green-800">
                  Live Updates
                </Badge>
              </>
            ) : (
              <>
                <IconWifiOff className="h-4 w-4 text-gray-500" />
                <Badge variant="outline" className="text-xs">
                  Manual Refresh
                </Badge>
              </>
            )}
          </div>

          {/* Toggle Realtime */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setUseRealtime(!useRealtime)}
          >
            {useRealtime ? 'Disable Realtime' : 'Enable Realtime'}
          </Button>

          {/* Refresh Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={loading}
          >
            <IconRefresh className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>

          {/* Generate Article Button */}
          <Dialog open={generateDialogOpen} onOpenChange={setGenerateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <IconRocket className="h-4 w-4 mr-2" />
                Generate Article
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Generate New Article</DialogTitle>
                <DialogDescription>
                  Create a new AI-generated article with your custom prompts
                </DialogDescription>
              </DialogHeader>
              <GenerateArticleForm
                onSuccess={() => {
                  setGenerateDialogOpen(false)
                  if (!useRealtime) {
                    loadArticles()
                  }
                }}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Article Progress Tracker */}
      {scheduledArticles.length > 0 && (
        <ArticleProgressTracker
          articles={scheduledArticles}
          userId={user.id}
          onRefresh={() => {
            if (!useRealtime) {
              loadArticles()
            }
          }}
        />
      )}

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <div className="flex-1">
              <Input
                placeholder="Search articles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full"
              />
            </div>
            <Tabs value={filterStatus} onValueChange={setFilterStatus} className="w-full md:w-auto">
              <TabsList>
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="pending">Pending</TabsTrigger>
                <TabsTrigger value="processing">Processing</TabsTrigger>
                <TabsTrigger value="posted">Posted</TabsTrigger>
                <TabsTrigger value="failed">Failed</TabsTrigger>
              </TabsList>
            </Tabs>
            <Tabs value={filterGenerationType} onValueChange={setFilterGenerationType} className="w-full md:w-auto">
              <TabsList>
                <TabsTrigger value="all">All Types</TabsTrigger>
                <TabsTrigger value="instant">Instant</TabsTrigger>
                <TabsTrigger value="scheduled">Scheduled</TabsTrigger>
                <TabsTrigger value="cron">Cron</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardContent>
      </Card>

      {/* Articles List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Articles ({filteredArticles.length})</span>
            {useRealtime && (
              <Badge variant="outline" className="text-xs">
                Auto-updating
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading && !currentArticles ? (
            <div className="flex items-center justify-center h-32">
              <IconRefresh className="h-6 w-6 animate-spin mr-2" />
              Loading articles...
            </div>
          ) : filteredArticles.length === 0 ? (
            <div className="text-center py-12">
              <IconArticle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No articles found</h3>
              <p className="text-muted-foreground mb-4">
                {debouncedSearch || filterStatus !== 'all' || filterGenerationType !== 'all'
                  ? 'Try adjusting your filters or search query'
                  : 'Get started by generating your first article'}
              </p>
              {!debouncedSearch && filterStatus === 'all' && filterGenerationType === 'all' && (
                <Button onClick={() => setGenerateDialogOpen(true)}>
                  <IconRocket className="h-4 w-4 mr-2" />
                  Generate Your First Article
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredArticles.map((article) => (
                <div key={article.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold mb-2">{article.title}</h3>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                        <span className="flex items-center gap-1">
                          <IconCalendar className="h-3 w-3" />
                          {formatDateTime(article.created_at)}
                        </span>
                        <Badge variant={
                          article.status === 'posted' ? 'default' :
                          article.status === 'processing' ? 'secondary' :
                          article.status === 'failed' ? 'destructive' : 'outline'
                        }>
                          {article.status}
                        </Badge>
                        {article.generation_type && (
                          <Badge variant="outline">
                            {article.generation_type}
                          </Badge>
                        )}
                        {article.websites && (
                          <span>Website: {article.websites.name}</span>
                        )}
                      </div>
                      {article.scheduled_at && (
                        <p className="text-sm text-muted-foreground">
                          Scheduled for: {formatDateTime(article.scheduled_at)}
                        </p>
                      )}
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <IconDots className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <IconEye className="h-4 w-4 mr-2" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-red-600"
                          onClick={() => handleDeleteArticle(article.id)}
                        >
                          <IconTrash className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// Main component with RealtimeProvider wrapper
export default function RealtimeArticlesPage() {
  const { user } = useCurrentUser()

  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <p>Please log in to view articles.</p>
      </div>
    )
  }

  return (
    <RealtimeProvider
      userId={user.id}
      initialData={{
        articles: []
      }}
    >
      <ArticlesPageContent />
    </RealtimeProvider>
  )
}