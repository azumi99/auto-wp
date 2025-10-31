"use client"

import { useState } from "react"
import { IconSearch, IconBook, IconSettings, IconQuestionMark, IconClock, IconShield, IconRocket, IconWorldWww, IconFileAi, IconBrandWordpress, IconWebhook, IconLayoutDashboard, IconAlertTriangle, IconCheck, IconChevronRight, IconExternalLink } from "@tabler/icons-react"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { toast } from "sonner"

const helpCategories = [
  {
    id: "getting-started",
    title: "Getting Started",
    description: "Learn the basics of WP Auto",
    icon: IconRocket,
    color: "bg-blue-500",
    articles: [
      {
        title: "Quick Start Guide",
        description: "Get up and running in 5 minutes",
        content: "Learn how to set up your first website, create your first article, and publish it automatically.",
        difficulty: "Beginner",
        readTime: "5 min"
      },
      {
        title: "Understanding the Dashboard",
        description: "Navigate your WP Auto dashboard",
        content: "Complete overview of all dashboard features, statistics, and monitoring tools.",
        difficulty: "Beginner",
        readTime: "3 min"
      },
      {
        title: "Adding Your First Website",
        description: "Connect WordPress to WP Auto",
        content: "Step-by-step guide to adding and configuring your WordPress website for automatic publishing.",
        difficulty: "Beginner",
        readTime: "7 min"
      }
    ]
  },
  {
    id: "articles",
    title: "Article Management",
    description: "Create and manage your content",
    icon: IconFileAi,
    color: "bg-green-500",
    articles: [
      {
        title: "Creating AI Articles",
        description: "Generate articles with AI",
        content: "Learn how to use AI to create high-quality articles from just a title or topic.",
        difficulty: "Beginner",
        readTime: "6 min"
      },
      {
        title: "Article Scheduling",
        description: "Schedule articles for automatic publishing",
        content: "Set up schedules to publish articles at optimal times for your audience.",
        difficulty: "Intermediate",
        readTime: "8 min"
      },
      {
        title: "Managing Article Status",
        description: "Track article progress through different stages",
        content: "Understanding the article lifecycle: pending, processing, published, failed.",
        difficulty: "Beginner",
        readTime: "4 min"
      }
    ]
  },
  {
    id: "websites",
    title: "Website Management",
    description: "Manage your WordPress sites",
    icon: IconWorldWww,
    color: "bg-purple-500",
    articles: [
      {
        title: "Connecting WordPress Sites",
        description: "Integrate WordPress with WP Auto",
        content: "Set up WordPress REST API credentials and test your connection.",
        difficulty: "Intermediate",
        readTime: "10 min"
      },
      {
        title: "Website Health Monitoring",
        description: "Monitor your website connection status",
        content: "Understanding website health checks and troubleshooting connection issues.",
        difficulty: "Intermediate",
        readTime: "5 min"
      },
      {
        title: "Managing Multiple Sites",
        description: "Handle multiple WordPress websites",
        content: "Best practices for managing and organizing multiple WordPress sites.",
        difficulty: "Advanced",
        readTime: "12 min"
      }
    ]
  },
  {
    id: "automation",
    title: "Automation & Workflows",
    description: "Set up automated workflows",
    icon: IconWebhook,
    color: "bg-orange-500",
    articles: [
      {
        title: "Using n8n Webhooks",
        description: "Integrate with n8n for advanced workflows",
        content: "Set up webhooks to connect WP Auto with n8n and create custom automation workflows.",
        difficulty: "Advanced",
        readTime: "15 min"
      },
      {
        title: "Creating Custom Workflows",
        description: "Design your automation workflows",
        content: "Build complex workflows combining article generation, scheduling, and publishing.",
        difficulty: "Advanced",
        readTime: "20 min"
      },
      {
        title: "AI Prompt Management",
        description: "Customize AI generation prompts",
        content: "Create and manage custom AI prompts for different types of content.",
        difficulty: "Intermediate",
        readTime: "8 min"
      }
    ]
  },
  {
    id: "monitoring",
    title: "Monitoring & Troubleshooting",
    description: "Monitor system health and troubleshoot issues",
    icon: IconAlertTriangle,
    color: "bg-red-500",
    articles: [
      {
        title: "Understanding System Logs",
        description: "Monitor system activities and errors",
        content: "Learn to read and understand system logs for troubleshooting.",
        difficulty: "Intermediate",
        readTime: "6 min"
      },
      {
        title: "Common Issues & Solutions",
        description: "Troubleshoot common problems",
        content: "Solutions for the most frequently encountered issues in WP Auto.",
        difficulty: "Beginner",
        readTime: "10 min"
      },
      {
        title: "Performance Optimization",
        description: "Optimize system performance",
        content: "Tips and tricks to get the best performance from WP Auto.",
        difficulty: "Advanced",
        readTime: "12 min"
      }
    ]
  },
  {
    id: "advanced",
    title: "Advanced Features",
    description: "Explore advanced capabilities",
    icon: IconSettings,
    color: "bg-indigo-500",
    articles: [
      {
        title: "API Documentation",
        description: "Integrate with external systems",
        content: "Complete API documentation for developers and advanced integrations.",
        difficulty: "Advanced",
        readTime: "25 min"
      },
      {
        title: "Custom Templates",
        description: "Create custom article templates",
        content: "Design and implement custom templates for article generation.",
        difficulty: "Advanced",
        readTime: "18 min"
      },
      {
        title: "Bulk Operations",
        description: "Perform bulk actions efficiently",
        content: "Process multiple articles or websites at once with bulk operations.",
        difficulty: "Intermediate",
        readTime: "8 min"
      }
    ]
  }
]

const frequentlyAskedQuestions = [
  {
    question: "How do I connect my WordPress site to WP Auto?",
    answer: "To connect your WordPress site, go to Websites > Add Website, enter your site URL, username, and application password. You can create an application password in WordPress under Users > Profile > Application Passwords."
  },
  {
    question: "What types of articles can WP Auto generate?",
    answer: "WP Auto can generate various types of articles including blog posts, news articles, how-to guides, listicles, product reviews, and more. The AI adapts the content based on your title and custom prompts."
  },
  {
    question: "How often does the scheduler run?",
    answer: "The scheduler runs every 5 minutes by default, checking for scheduled articles that need to be processed and published. You can configure the frequency in the scheduler settings."
  },
  {
    question: "Can I edit articles before they're published?",
    answer: "Yes! Articles in 'pending' or 'draft' status can be edited before publishing. You can modify the title, content, images, and scheduling settings."
  },
  {
    question: "What happens if an article fails to publish?",
    answer: "Failed articles are marked with 'failed' status and error details are logged. You can retry publishing, fix the issue (usually connection problems), or edit the article and try again."
  },
  {
    question: "Is my data secure?",
    answer: "Yes, WP Auto uses industry-standard encryption for data transmission and storage. Your WordPress credentials are encrypted, and we follow security best practices to protect your information."
  }
]

const quickStartSteps = [
  {
    step: 1,
    title: "Create Account",
    description: "Sign up for WP Auto and verify your email address.",
    icon: IconCheck,
    status: "completed"
  },
  {
    step: 2,
    title: "Add WordPress Site",
    description: "Connect your WordPress website using REST API credentials.",
    icon: IconWorldWww,
    status: "pending"
  },
  {
    step: 3,
    title: "Create First Article",
    description: "Generate your first AI article from a title.",
    icon: IconFileAi,
    status: "pending"
  },
  {
    step: 4,
    title: "Schedule Publishing",
    description: "Set up schedule for automatic publishing.",
    icon: IconClock,
    status: "pending"
  }
]

export default function HelpCenterPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")

  const filteredCategories = helpCategories.filter(category => {
    if (selectedCategory === "all") return true
    return category.id === selectedCategory
  })

  const searchResults = searchQuery
    ? helpCategories.flatMap(category =>
        category.articles.map(article => ({
          ...article,
          category: category.title,
          categoryId: category.id
        }))
      ).filter(article =>
        article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        article.description.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : []

  const handleContactSupport = () => {
    toast.success("Support request sent! We'll respond within 24 hours.")
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "Beginner": return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
      case "Intermediate": return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
      case "Advanced": return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
      default: return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
    }
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Help Center</h1>
          <p className="text-muted-foreground">Everything you need to master WP Auto</p>
        </div>
        <Button onClick={handleContactSupport} className="gap-2">
          <IconQuestionMark className="h-4 w-4" />
          Contact Support
        </Button>
      </div>

      {/* Quick Start Guide */}
      <Card className="border-2 border-blue-200 dark:border-blue-800 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
            <IconRocket className="h-5 w-5" />
            Quick Start Guide
          </CardTitle>
          <CardDescription>
            New to WP Auto? Follow these steps to get started quickly.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            {quickStartSteps.map((step) => (
              <div key={step.step} className="flex items-start gap-3 p-3 rounded-lg bg-white/50 dark:bg-gray-800/50">
                <div className={`p-2 rounded-lg ${
                  step.status === "completed" ? "bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-300" : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                }`}>
                  <step.icon className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="font-medium">Step {step.step}: {step.title}</h4>
                  <p className="text-sm text-muted-foreground">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Search */}
      <div className="relative">
        <IconSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          placeholder="Search for help articles, guides, and tutorials..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {searchQuery && (
        <Card>
          <CardHeader>
            <CardTitle>Search Results</CardTitle>
            <CardDescription>Found {searchResults.length} results for "{searchQuery}"</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {searchResults.map((result, index) => (
                <div key={index} className="flex items-start justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
                  <div>
                    <h4 className="font-medium">{result.title}</h4>
                    <p className="text-sm text-muted-foreground">{result.description}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="outline" className="text-xs">{result.category}</Badge>
                      <span className="text-xs text-muted-foreground">{result.readTime} read</span>
                      <Badge className={`text-xs ${getDifficultyColor(result.difficulty)}`}>{result.difficulty}</Badge>
                    </div>
                  </div>
                  <IconChevronRight className="h-4 w-4 text-muted-foreground mt-1" />
                </div>
              ))}
            </div>
            {searchResults.length === 0 && (
              <div className="text-center py-8">
                <IconSearch className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No results found for "{searchQuery}"</p>
                <Button variant="outline" className="mt-4" onClick={() => setSearchQuery("")}>
                  Clear Search
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {!searchQuery && (
        <>
          {/* Categories Tabs */}
          <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
            <TabsList className="grid w-full grid-cols-7">
              <TabsTrigger value="all">All</TabsTrigger>
              {helpCategories.map((category) => (
                <TabsTrigger key={category.id} value={category.id} className="text-xs">
                  {category.title}
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value="all" className="mt-6">
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {helpCategories.map((category) => (
                  <Card key={category.id} className="hover:shadow-lg transition-shadow cursor-pointer">
                    <CardHeader>
                      <div className="flex items-center gap-2">
                        <div className={`p-2 rounded-lg ${category.color} bg-opacity-10`}>
                          <category.icon className={`h-5 w-5 ${category.color.replace('bg-', 'text-')}`} />
                        </div>
                        <CardTitle className="text-lg">{category.title}</CardTitle>
                      </div>
                      <CardDescription>{category.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {category.articles.slice(0, 3).map((article, index) => (
                          <div key={index} className="flex items-center justify-between p-2 rounded hover:bg-muted/50 transition-colors">
                            <div>
                              <p className="text-sm font-medium">{article.title}</p>
                              <p className="text-xs text-muted-foreground">{article.readTime} read</p>
                            </div>
                            <IconChevronRight className="h-3 w-3 text-muted-foreground" />
                          </div>
                        ))}
                        {category.articles.length > 3 && (
                          <p className="text-xs text-muted-foreground pt-2">
                            +{category.articles.length - 3} more articles
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {filteredCategories.map((category) => (
              <TabsContent key={category.id} value={category.id} className="mt-6">
                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <div className={`p-2 rounded-lg ${category.color} bg-opacity-10`}>
                        <category.icon className={`h-5 w-5 ${category.color.replace('bg-', 'text-')}`} />
                      </div>
                      <div>
                        <CardTitle>{category.title}</CardTitle>
                        <CardDescription>{category.description}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {category.articles.map((article, index) => (
                        <div key={index} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors cursor-pointer">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4 className="font-medium mb-2">{article.title}</h4>
                              <p className="text-sm text-muted-foreground mb-3">{article.description}</p>
                              <div className="flex items-center gap-2">
                                <Badge className={`text-xs ${getDifficultyColor(article.difficulty)}`}>
                                  {article.difficulty}
                                </Badge>
                                <span className="text-xs text-muted-foreground flex items-center gap-1">
                                  <IconClock className="h-3 w-3" />
                                  {article.readTime}
                                </span>
                              </div>
                            </div>
                            <IconChevronRight className="h-4 w-4 text-muted-foreground mt-1" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            ))}
          </Tabs>
        </>
      )}

      {/* FAQ Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IconQuestionMark className="h-5 w-5" />
            Frequently Asked Questions
          </CardTitle>
          <CardDescription>Quick answers to common questions</CardDescription>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            {frequentlyAskedQuestions.map((faq, index) => (
              <AccordionItem key={index} value={`item-${index}`}>
                <AccordionTrigger className="text-left">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>

      {/* Additional Resources */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <IconBook className="h-5 w-5" />
              Additional Resources
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <a href="#" className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors">
              <div>
                <p className="font-medium">API Documentation</p>
                <p className="text-sm text-muted-foreground">Complete API reference</p>
              </div>
              <IconExternalLink className="h-4 w-4 text-muted-foreground" />
            </a>
            <a href="#" className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors">
              <div>
                <p className="font-medium">Video Tutorials</p>
                <p className="text-sm text-muted-foreground">Step-by-step video guides</p>
              </div>
              <IconExternalLink className="h-4 w-4 text-muted-foreground" />
            </a>
            <a href="#" className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors">
              <div>
                <p className="font-medium">Community Forum</p>
                <p className="text-sm text-muted-foreground">Connect with other users</p>
              </div>
              <IconExternalLink className="h-4 w-4 text-muted-foreground" />
            </a>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <IconShield className="h-5 w-5" />
              Support & Security
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <a href="#" className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors">
              <div>
                <p className="font-medium">Security Guidelines</p>
                <p className="text-sm text-muted-foreground">Keep your account secure</p>
              </div>
              <IconExternalLink className="h-4 w-4 text-muted-foreground" />
            </a>
            <a href="#" className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors">
              <div>
                <p className="font-medium">Privacy Policy</p>
                <p className="text-sm text-muted-foreground">How we protect your data</p>
              </div>
              <IconExternalLink className="h-4 w-4 text-muted-foreground" />
            </a>
            <a href="#" className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors">
              <div>
                <p className="font-medium">Terms of Service</p>
                <p className="text-sm text-muted-foreground">Usage terms and conditions</p>
              </div>
              <IconExternalLink className="h-4 w-4 text-muted-foreground" />
            </a>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}