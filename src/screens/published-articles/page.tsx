"use client";

import * as React from "react";
import {
    IconSearch,
    IconLoader2,
    IconExternalLink,
    IconPhoto,
    IconCalendar,
    IconUser,
    IconBrandWordpress,
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
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { getPublishedArticlesClient } from "@/src/lib/published_articles/client-actions";
import { toast } from "sonner";
import { PublishedArticle } from "@/src/lib/published_articles/types";
import { formatDateTime } from "@/src/lib/utils/date";
import { usePublishedArticlesRealtime } from "@/hooks/use-supabase-realtime";
import { createClient } from "@/lib/supabaseClient";

export default function PublishedArticlesPage() {
    const [publishedArticles, setPublishedArticles] = React.useState<PublishedArticle[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [userId, setUserId] = React.useState<string | null>(null);
    const [searchQuery, setSearchQuery] = React.useState("");

    // Initialize user and load data
    React.useEffect(() => {
        const initializeUser = async () => {
            try {
                const supabase = createClient()
                const { data: { user } } = await supabase.auth.getUser()
                if (user) {
                    setUserId(user.id)
                    loadPublishedArticles()
                }
            } catch (error) {
                console.error('Error getting user:', error)
                toast.error('Failed to authenticate')
            }
        }
        initializeUser()
    }, [])

    const loadPublishedArticles = async () => {
        try {
            setLoading(true);
            const publishedArticlesData = await getPublishedArticlesClient();
            setPublishedArticles(publishedArticlesData);
        } catch (error) {
            console.error('Error loading published articles:', error);
            toast.error('Failed to load published articles');
        } finally {
            setLoading(false);
        }
    };

    // Setup realtime subscription - this will fetch data and handle realtime updates
    const { data: realtimeData, isConnected, error: realtimeError, loading: realtimeLoading, reconnect } = usePublishedArticlesRealtime(
        userId || '',
        null // Let the hook fetch its own data
    )

    // Use realtime data as primary source, fallback to initial data only during initial load
    const currentArticles = realtimeData || publishedArticles
    const isLoading = loading || (realtimeLoading && !realtimeData)

    // Update local state when realtime data changes
    React.useEffect(() => {
        if (realtimeData) {
            console.log('Published Articles updated via realtime:', realtimeData.length, 'items')
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
        console.log('Published Articles state update:', {
            realtimeDataCount: realtimeData?.length || 0,
            initialDataCount: publishedArticles.length,
            currentDataCount: currentArticles.length,
            isConnected,
            isLoading
        })
    }, [realtimeData, publishedArticles, currentArticles, isConnected, isLoading])

    // Sort published articles by published_at in descending order (newest first)
    const sortedArticles = React.useMemo(() => {
        return [...currentArticles].sort((a, b) =>
            new Date(b.published_at).getTime() - new Date(a.published_at).getTime()
        )
    }, [currentArticles])

    const filteredPublishedArticles = sortedArticles.filter((article) =>
        article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        article.excerpt.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (isLoading) {
        return (
            <div className="flex flex-1 items-center justify-center min-h-[400px]">
                <div className="flex flex-col items-center gap-2">
                    <IconLoader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">Loading published articles...</p>
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
                            <h1 className="text-3xl font-bold tracking-tight">Published Articles</h1>
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
                            View all articles that have been successfully published to WordPress
                        </p>
                    </div>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                Total Published
                            </CardTitle>
                            <IconBrandWordpress className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{publishedArticles.length}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">This Month</CardTitle>
                            <IconCalendar className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {publishedArticles.filter(a =>
                                    new Date(a.published_at).getMonth() === new Date().getMonth() &&
                                    new Date(a.published_at).getFullYear() === new Date().getFullYear()
                                ).length}
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Avg. Monthly</CardTitle>
                            <IconUser className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {publishedArticles.length > 0
                                    ? (publishedArticles.length / (new Date().getMonth() + 1)).toFixed(1)
                                    : 0}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <Card>
                    <CardHeader>
                        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                            <div className="space-y-1">
                                <CardTitle>All Published Articles</CardTitle>
                                <CardDescription>
                                    {filteredPublishedArticles.length} {filteredPublishedArticles.length === 1 ? 'article' : 'articles'} found
                                </CardDescription>
                            </div>
                            <div className="relative w-full md:w-64">
                                <IconSearch className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search articles..."
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
                                {filteredPublishedArticles.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-12 text-center">
                                        <IconBrandWordpress className="h-12 w-12 text-muted-foreground/50 mb-4" />
                                        <h3 className="text-lg font-semibold">No published articles found</h3>
                                        <p className="text-sm text-muted-foreground mt-2">
                                            {searchQuery ? 'Try adjusting your search' : 'Articles will appear here once they are published'}
                                        </p>
                                    </div>
                                ) : (
                                    filteredPublishedArticles.map((article) => (
                                        <Card key={article.id}>
                                            <CardContent className="p-6">
                                                <div className="flex flex-col md:flex-row gap-4">
                                                    <div className="flex-shrink-0">
                                                        {article.image_url ? (
                                                            <div className="bg-muted rounded-lg overflow-hidden w-32 h-20">
                                                                <img
                                                                    src={article.image_url}
                                                                    alt={article.title}
                                                                    className="w-full h-full object-cover"
                                                                    onError={(e) => {
                                                                        const target = e.target as HTMLImageElement;
                                                                        target.onerror = null;
                                                                        target.src = "/placeholder-image.jpg";
                                                                    }}
                                                                />
                                                            </div>
                                                        ) : (
                                                            <div className="bg-muted rounded-lg w-32 h-20 flex items-center justify-center">
                                                                <IconPhoto className="h-8 w-8 text-muted-foreground" />
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="flex-1 space-y-2">
                                                        <div className="flex items-start justify-between">
                                                            <h3 className="font-semibold text-lg">{article.title}</h3>
                                                        </div>
                                                        <p className="text-sm text-muted-foreground line-clamp-2">
                                                            {article.excerpt}
                                                        </p>
                                                        <div className="flex flex-wrap gap-2 pt-2">
                                                            <Badge variant="secondary" className="text-xs">
                                                                <IconCalendar className="mr-1 h-3 w-3" />
                                                                {formatDateTime(article.published_at)}
                                                            </Badge>
                                                            <a
                                                                href={article.post_url}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline"
                                                            >
                                                                <IconExternalLink className="h-3 w-3" />
                                                                View Post
                                                            </a>
                                                        </div>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))
                                )}
                            </div>
                            <ScrollBar orientation="horizontal" />
                        </ScrollArea>
                    </CardContent>
                </Card>
            </div>
        </AuthGuard>
    );
}