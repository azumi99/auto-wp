"use client"

import { useState, useEffect } from "react"
import { IconPlus, IconArticle, IconRefresh, IconDots, IconPencil, IconTrash, IconRocket, IconEye } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "sonner"
import { getArticles, deleteArticle } from "@/src/lib/articles/actions"
import { ArticleForm } from "@/src/screens/articles/article-form"
import { GenerateArticleForm } from "@/src/screens/articles/generate-article-form"
import type { Article } from "@/src/lib/articles/types"

export default function ArticlesPage() {
  const [articles, setArticles] = useState<Article[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [generateDialogOpen, setGenerateDialogOpen] = useState(false)
  const [filterStatus, setFilterStatus] = useState<string>("all")

  const loadArticles = async () => {
    try {
      setLoading(true)
      const data = await getArticles()
      setArticles(data)
    } catch (error: any) {
      toast.error(error.message || "Failed to load articles")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadArticles()
  }, [])

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this article?")) return

    try {
      await deleteArticle(id)
      toast.success("Article deleted successfully")
      loadArticles()
    } catch (error: any) {
      toast.error(error.message || "Failed to delete article")
    }
  }

  const handleEdit = (article: Article) => {
    setSelectedArticle(article)
    setDialogOpen(true)
  }

  const handleAdd = () => {
    setSelectedArticle(null)
    setDialogOpen(true)
  }

  const handleSuccess = () => {
    setDialogOpen(false)
    setGenerateDialogOpen(false)
    setSelectedArticle(null)
    loadArticles()
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "published": return "bg-green-500/10 text-green-500"
      case "draft": return "bg-gray-500/10 text-gray-500"
      case "scheduled": return "bg-blue-500/10 text-blue-500"
      case "failed": return "bg-red-500/10 text-red-500"
      case "archived": return "bg-yellow-500/10 text-yellow-500"
      default: return "bg-gray-500/10 text-gray-500"
    }
  }

  const filteredArticles = filterStatus === "all"
    ? articles
    : articles.filter(a => a.status === filterStatus)

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Articles</h1>
          <p className="text-muted-foreground">
            Manage and generate content for your websites
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={loadArticles}>
            <IconRefresh className="h-4 w-4" />
          </Button>
          <Dialog open={generateDialogOpen} onOpenChange={setGenerateDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="default">
                <IconRocket className="h-4 w-4 mr-2" />
                Generate Article
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Generate AI Article</DialogTitle>
                <DialogDescription>
                  Use AI to generate content for your website
                </DialogDescription>
              </DialogHeader>
              <GenerateArticleForm onSuccess={handleSuccess} />
            </DialogContent>
          </Dialog>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" onClick={handleAdd}>
                <IconPlus className="h-4 w-4 mr-2" />
                Manual Article
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {selectedArticle ? "Edit Article" : "Create Manual Article"}
                </DialogTitle>
                <DialogDescription>
                  {selectedArticle
                    ? "Update article information below"
                    : "Create a new article manually"}
                </DialogDescription>
              </DialogHeader>
              <ArticleForm
                article={selectedArticle}
                onSuccess={handleSuccess}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs value={filterStatus} onValueChange={setFilterStatus}>
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="draft">Draft</TabsTrigger>
          <TabsTrigger value="scheduled">Scheduled</TabsTrigger>
          <TabsTrigger value="published">Published</TabsTrigger>
          <TabsTrigger value="failed">Failed</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="grid gap-4">
        {loading ? (
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
        ) : filteredArticles.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <IconArticle className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {filterStatus === "all" ? "No articles yet" : `No ${filterStatus} articles`}
              </h3>
              <p className="text-muted-foreground mb-4">
                Get started by generating your first AI article
              </p>
              <Button onClick={() => setGenerateDialogOpen(true)}>
                <IconRocket className="h-4 w-4 mr-2" />
                Generate Article
              </Button>
            </CardContent>
          </Card>
        ) : (
          filteredArticles.map((article) => (
            <Card key={article.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{article.title}</CardTitle>
                    <CardDescription className="mt-1">
                      {article.excerpt || "No excerpt available"}
                    </CardDescription>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
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
                      <DropdownMenuItem onClick={() => handleEdit(article)}>
                        <IconPencil className="h-4 w-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
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
              <CardContent>
                <div className="flex flex-wrap gap-2 items-center">
                  <Badge className={getStatusColor(article.status)}>
                    {article.status}
                  </Badge>
                  {article.ai_model && (
                    <Badge variant="outline">
                      {article.ai_model}
                    </Badge>
                  )}
                  {article.word_count && (
                    <span className="text-xs text-muted-foreground">
                      {article.word_count} words
                    </span>
                  )}
                  {article.generation_time_seconds && (
                    <span className="text-xs text-muted-foreground">
                      Generated in {article.generation_time_seconds}s
                    </span>
                  )}
                  <span className="text-xs text-muted-foreground ml-auto">
                    {new Date(article.created_at).toLocaleDateString()}
                  </span>
                </div>
                {article.tags && article.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {article.tags.slice(0, 5).map((tag, i) => (
                      <Badge key={i} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
