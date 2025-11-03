"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Bot,
  PenTool,
  Globe,
  BarChart3,
  Clock,
  Shield,
  ArrowRight,
  CheckCircle,
  Sparkles,
  TrendingUp,
  Users,
  Calendar,
  FileText,
  Cpu,
  Link,
  Database,
  Image,
  List,
  Search,
  Target,
  Play,
  ChevronRight,
  Star,
  Rocket,
  Layers,
  Sun,
  Moon,
  Zap,
  Timer,
  Settings2,
  LayoutGrid,
  Pen,
  User,
  LogOut
} from "lucide-react";
import { LoginForm } from "@/components/login-form";
import { useTheme } from "next-themes";
import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function Home() {
  const [showLogin, setShowLogin] = useState(false);
  const [activeFeature, setActiveFeature] = useState(0);
  const [isAnimated, setIsAnimated] = useState(false);
  const { user, loading, isAuthenticated, signOut } = useAuth();
  const { theme, setTheme } = useTheme();
  const router = useRouter();

  const handleLogin = () => {
    router.push('/login');
    // toast.success('Silakan masuk ke halaman login', {
    //   description: 'Silakan dialihkan ke dashboard Anda'
    // });
  };

  const handleLogout = async () => {
    try {
      await signOut();
      toast.success('Berhasil logout', {
        description: 'Anda telah berhasil logout'
      });
    } catch (error) {
      toast.error('Gagal logout', {
        description: 'Terjadi kesalahan saat logout'
      });
    }
  };

  useEffect(() => {
    setIsAnimated(true);
    const interval = setInterval(() => {
      setActiveFeature((prev) => (prev + 1) % 6);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // Redirect authenticated users to dashboard
  useEffect(() => {
    // if (!loading && isAuthenticated) {
    //   router.push('/dashboard');
    // }
  }, [loading, isAuthenticated, router]);

  const coreFeatures = [
    {
      icon: PenTool,
      title: "AI Article + Image Generation",
      description: "Generate complete articles with relevant images automatically",
      color: "text-blue-600 dark:text-blue-400"
    },
    {
      icon: Rocket,
      title: "Auto WordPress Publishing",
      description: "Instantly publish articles to your WordPress sites automatically",
      color: "text-emerald-600 dark:text-emerald-400"
    },
    {
      icon: FileText,
      title: "Title to Article Magic",
      description: "Just provide article titles, AI creates full engaging content",
      color: "text-violet-600 dark:text-violet-400"
    },
    {
      icon: Timer,
      title: "Smart Scheduling System",
      description: "Schedule posts at optimal times for maximum engagement",
      color: "text-amber-600 dark:text-amber-400"
    },
    {
      icon: LayoutGrid,
      title: "Multi-Site Management",
      description: "Manage unlimited WordPress websites from one dashboard",
      color: "text-rose-600 dark:text-rose-400"
    },
    {
      icon: Target,
      title: "Built-in SEO Optimization",
      description: "All articles automatically optimized for search engines",
      color: "text-cyan-600 dark:text-cyan-400"
    }
  ];

  if (showLogin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-6">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Welcome Back
              </h1>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="h-8 w-8 hover:bg-blue-50 dark:hover:bg-gray-800 transition-colors"
                aria-label="Toggle theme"
              >
                <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              </Button>
            </div>
            <p className="text-gray-600 dark:text-gray-400">
              Login to manage your AI-powered content
            </p>
          </div>
          <LoginForm />
          <div className="mt-4 text-center">
            <Button
              variant="ghost"
              onClick={() => setShowLogin(false)}
              className="text-sm"
            >
              ← Back to Home
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-900 dark:to-slate-900 transition-colors duration-500">
      {/* Navigation */}
      <nav className="border-b border-gray-200/30 dark:border-gray-700/30 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl backdrop-saturate-150 sticky top-0 z-50 transition-all duration-500">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="flex justify-between items-center h-18">
            <div className="flex items-center space-x-4">
              <div className="relative group">
                <Bot className="h-9 w-9 text-blue-600 dark:text-blue-400 transition-all duration-300 group-hover:scale-110" />
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse shadow-lg"></div>
              </div>
              <div className="flex flex-col">
                <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent leading-tight">
                  WP Auto
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                  WordPress Article Automation
                </span>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="h-9 w-9 hover:bg-blue-50 dark:hover:bg-gray-800 transition-all duration-300 rounded-lg"
                aria-label="Toggle theme"
              >
                <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              </Button>
              <div className="w-px h-6 bg-gray-300 dark:bg-gray-600"></div>
              {!loading && isAuthenticated ? (
                // Show very simple Profile section when user is logged in
                <div className="flex items-center space-x-3">
                  <div className="flex items-center ">
                    {user?.avatar ? (
                      <img
                        src={user.avatar}
                        alt={user.name || 'User'}
                        className="w-6 h-6 object-cover rounded-full"
                      />
                    ) : (
                      <User className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    onClick={() => {
                      router.push('/dashboard');
                    }}
                    className="hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors h-9 px-3"
                  >
                    Dashboard
                  </Button>

                </div>
              ) : (
                // Show Login buttons when user is not logged in
                <>
                  <Button
                    variant="ghost"
                    onClick={handleLogin}
                    className="hover:bg-blue-50 dark:hover:bg-gray-800 transition-all duration-300 h-10 px-5 font-medium rounded-lg"
                  >
                    Login
                  </Button>
                  <Button
                    onClick={handleLogin}
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 h-10 px-6 font-semibold rounded-lg"
                  >
                    Get Started
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-28 sm:py-32 lg:py-36 px-6">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/3 via-transparent to-purple-600/3 dark:from-blue-600/8 dark:to-purple-600/8"></div>
        <div className="max-w-7xl mx-auto relative">
          <div className="text-center max-w-6xl mx-auto">
            <div className={`transition-all duration-1000 ${isAnimated ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
              <Badge className="mb-10 bg-gradient-to-r from-blue-100 via-indigo-100 to-purple-100 text-blue-800 dark:from-blue-900 dark:via-indigo-900 dark:to-purple-900 dark:text-blue-100 border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 px-5 py-3">
                <PenTool className="w-4 h-4 mr-2 text-blue-700 dark:text-blue-300" />
                <span className="text-blue-800 dark:text-blue-100">AI-Powered WordPress Article Automation</span>
              </Badge>
            </div>
            <h1 className={`text-5xl sm:text-6xl lg:text-7xl font-bold text-gray-900 dark:text-white mb-8 leading-tight transition-all duration-1200 delay-200 ${isAnimated ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}>
              Transform Article Ideas Into
              <span className="block bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent mt-3">
                Complete WordPress Posts
              </span>
            </h1>
            <p className={`text-lg sm:text-xl lg:text-2xl text-gray-600 dark:text-gray-400 mb-12 leading-relaxed max-w-5xl mx-auto transition-all duration-1200 delay-400 ${isAnimated ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}>
              Just provide article titles, and our AI creates complete articles with images,
              SEO optimization, and auto-posts them to your WordPress sites. Manage unlimited blogs
              from one dashboard with smart scheduling.
            </p>
            <div className={`flex flex-col sm:flex-row gap-6 justify-center transition-all duration-1200 delay-600 ${isAnimated ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}>
              <Button
                size="lg"
                onClick={() => window.location.href = '/login'}
                className="h-14 sm:h-16 px-8 sm:px-12 text-base sm:text-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-2xl hover:shadow-blue-500/25 transition-all duration-300 transform hover:scale-105 hover:-translate-y-1 font-semibold"
              >
                Start Automating Now
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="h-14 sm:h-16 px-8 sm:px-12 text-base sm:text-lg border-2 border-gray-300 dark:border-gray-600 hover:border-blue-500 dark:hover:border-blue-400 transition-all duration-300 transform hover:scale-105 hover:-translate-y-1 font-semibold"
              >
                <Play className="mr-2 h-5 w-5 text-gray-700 dark:text-gray-300" />
                <span className="text-gray-700 dark:text-gray-300">Watch Demo</span>
              </Button>
            </div>
          </div>

          {/* Interactive Features Preview */}
          <div className="mt-20 sm:mt-24 grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
            {coreFeatures.slice(0, 3).map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Card
                  key={index}
                  className={`bg-white/90 dark:bg-gray-800/90 backdrop-blur-md border-gray-200/40 dark:border-gray-700/40 hover:shadow-2xl hover:scale-105 transition-all duration-500 cursor-pointer rounded-2xl ${activeFeature === index ? 'ring-2 ring-blue-500/50 shadow-2xl' : ''}`}
                  onMouseEnter={() => setActiveFeature(index)}
                >
                  <CardContent className="p-8 text-center">
                    <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-600 mb-6 group-hover:scale-110 transition-transform duration-300`}>
                      <Icon className={`h-8 w-8 ${feature.color}`} />
                    </div>
                    <h3 className="font-bold text-gray-900 dark:text-white mb-3 text-lg">{feature.title}</h3>
                    <p className="text-gray-600 dark:text-gray-400 leading-relaxed text-sm">{feature.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Core Features Section */}
      <section className="py-24 sm:py-28 lg:py-32 px-6 bg-gradient-to-br from-gray-50 via-white to-blue-50 dark:from-gray-900 dark:via-slate-900 dark:to-slate-900">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">

            <Badge className="mb-10 bg-gradient-to-r from-blue-100 via-indigo-100 to-purple-100 text-blue-800 dark:from-blue-900 dark:via-indigo-900 dark:to-purple-900 dark:text-blue-100 border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 px-5 py-3">
              <Star className="w-5 h-5 text-blue-600 dark:text-blue-400 mr-2" />
              <span className="text-sm font-semibold text-blue-800 dark:text-blue-100">Core Features</span>
            </Badge>
            <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white mb-8">
              Complete WordPress Automation
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-4xl mx-auto leading-relaxed">
              Six powerful features that transform how you create and manage WordPress content
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {coreFeatures.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Card
                  key={index}
                  className={`group relative overflow-hidden bg-white dark:bg-gray-800/90 border-gray-200/50 dark:border-gray-700/50 hover:shadow-2xl transition-all duration-500 cursor-pointer transform hover:-translate-y-3 rounded-3xl backdrop-blur-sm ${activeFeature === index ? 'ring-2 ring-blue-500/20 dark:ring-blue-400/30 shadow-2xl' : ''
                    }`}
                  onMouseEnter={() => setActiveFeature(index)}
                  onMouseLeave={() => setActiveFeature(-1)}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/0 via-transparent to-purple-500/0 dark:from-blue-400/0 dark:to-purple-400/0 group-hover:from-blue-500/2 group-hover:to-purple-500/2 dark:group-hover:from-blue-400/3 dark:group-hover:to-purple-400/3 transition-all duration-700"></div>
                  <CardHeader className="relative z-10 pb-4">
                    <div className="flex items-start justify-between mb-6">
                      <div className={`p-4 rounded-2xl bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-600 group-hover:scale-110 transition-all duration-400 shadow-md border border-gray-200 dark:border-gray-600`}>
                        <Icon className={`h-8 w-8 ${feature.color} transition-colors duration-300`} />
                      </div>
                      {activeFeature === index && (
                        <div className="flex space-x-1 mt-1">
                          <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                          <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse delay-75"></div>
                          <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse delay-150"></div>
                        </div>
                      )}
                    </div>
                    <CardTitle className="text-xl font-bold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-all duration-300 mb-4 leading-tight">
                      {feature.title}
                    </CardTitle>
                    <CardDescription className="text-gray-600 dark:text-gray-300 leading-relaxed text-base">
                      {feature.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="relative z-10 pt-2">
                    <Button
                      variant="ghost"
                      className="w-full group-hover:bg-blue-50 dark:group-hover:bg-blue-900/30 transition-all duration-300 h-12 font-medium rounded-xl border border-gray-200 dark:border-gray-700 hover:border-blue-400 dark:hover:border-blue-500 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400"
                    >
                      Learn more
                      <ChevronRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform duration-300" />
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24 sm:py-28 lg:py-32 px-6 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-900/10 dark:via-indigo-900/10 dark:to-purple-900/10">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <div className="inline-flex items-center px-5 py-3 bg-white dark:bg-gray-800 rounded-full mb-8 shadow-lg border border-gray-200 dark:border-gray-700">
              <Timer className="w-5 h-5 text-blue-600 dark:text-blue-400 mr-2" />
              <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">How It Works</span>
            </div>
            <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white mb-8">
              Simple 4-Step Process
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-4xl mx-auto leading-relaxed">
              From article ideas to published WordPress posts in minutes
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
            {[
              {
                step: 1,
                title: "Add Article Titles",
                description: "Simply provide article title ideas you want to create",
                icon: FileText,
                color: "from-blue-500 to-blue-600"
              },
              {
                step: 2,
                title: "AI Creates Content",
                description: "AI generates complete articles with images and SEO optimization",
                icon: PenTool,
                color: "from-emerald-500 to-emerald-600"
              },
              {
                step: 3,
                title: "Schedule Posts",
                description: "Set your preferred posting schedule for each WordPress site",
                icon: Timer,
                color: "from-violet-500 to-violet-600"
              },
              {
                step: 4,
                title: "Auto-Publish",
                description: "Articles are automatically posted at the optimal time",
                icon: Rocket,
                color: "from-amber-500 to-amber-600"
              }
            ].map((step, index) => {
              const Icon = step.icon;
              return (
                <div
                  key={index}
                  className={`relative group transition-all duration-800 ${isAnimated ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
                  style={{ transitionDelay: `${index * 150}ms` }}
                >
                  <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 text-center shadow-lg hover:shadow-2xl transition-all duration-400 transform hover:-translate-y-3 cursor-pointer border border-gray-100 dark:border-gray-700">
                    <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r ${step.color} text-white mb-6 group-hover:scale-110 transition-transform duration-400 shadow-lg`}>
                      <span className="text-2xl font-bold">{step.step}</span>
                    </div>
                    <div className="h-12 flex items-center justify-center mb-5">
                      <Icon className="h-8 w-8 text-gray-400 dark:text-gray-600 group-hover:text-blue-500 transition-colors duration-300" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3">{step.title}</h3>
                    <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">{step.description}</p>
                  </div>

                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 px-4 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Trusted by WordPress Content Creators
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
              Join thousands who are already automating their WordPress content
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {[
              { number: "10K+", label: "Articles Created Daily", color: "text-blue-600 dark:text-blue-400" },
              { number: "500+", label: "WordPress Sites", color: "text-green-600 dark:text-green-400" },
              { number: "95%", label: "Time Saved", color: "text-purple-600 dark:text-purple-400" },
              { number: "24/7", label: "Auto Posting", color: "text-orange-600 dark:text-orange-400" }
            ].map((stat, index) => (
              <div
                key={index}
                className={`text-center group transition-all duration-500 ${isAnimated ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
                style={{ transitionDelay: `${index * 100}ms` }}
              >
                <div className={`text-4xl md:text-5xl font-bold ${stat.color} mb-2 group-hover:scale-110 transition-transform duration-300`}>
                  {stat.number}
                </div>
                <div className="text-gray-600 dark:text-gray-400 font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-24 px-4 bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-slate-900">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-green-100 to-blue-100 dark:from-green-900/20 dark:to-blue-900/20 rounded-full mb-6">
              <Target className="w-4 h-4 text-green-600 dark:text-green-400 mr-2" />
              <span className="text-sm font-medium text-green-800 dark:text-green-200">Benefits</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
              Why Choose WP Auto?
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
              Experience the power of automated WordPress content creation
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {[
              {
                title: "Save 20+ Hours Per Week",
                description: "Stop writing articles manually. Let AI create content while you focus on growing your business.",
                icon: Clock,
                color: "text-blue-600"
              },
              {
                title: "Never Run Out of Content",
                description: "Generate unlimited articles from simple title ideas. Your content pipeline is always full.",
                icon: Zap,
                color: "text-green-600"
              },
              {
                title: "Perfect SEO Every Time",
                description: "All articles are automatically optimized for search engines with proper formatting and keywords.",
                icon: Search,
                color: "text-purple-600"
              },
              {
                title: "Manage Multiple Sites Easily",
                description: "Control unlimited WordPress blogs from one dashboard. Scale your content empire effortlessly.",
                icon: Layers,
                color: "text-orange-600"
              }
            ].map((benefit, index) => {
              const Icon = benefit.icon;
              return (
                <div
                  key={index}
                  className={`group bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 ${isAnimated ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-10'
                    }`}
                  style={{ transitionDelay: `${index * 150}ms` }}
                >
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                      <div className={`p-3 rounded-xl bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-600 group-hover:scale-110 transition-transform duration-300`}>
                        <Icon className={`h-6 w-6 ${benefit.color}`} />
                      </div>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {benefit.title}
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                        {benefit.description}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-24 px-4 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 via-transparent to-purple-600/20"></div>
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>

        <div className="max-w-5xl mx-auto text-center relative z-10">
          <div className={`transition-all duration-1000 ${isAnimated ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-20'}`}>
            <div className="inline-flex items-center px-6 py-3 bg-white/10 backdrop-blur-sm rounded-full mb-8">
              <Rocket className="w-5 h-5 text-white mr-2 animate-bounce" />
              <span className="text-white font-medium">Start Your WordPress Automation Journey</span>
            </div>
            <h2 className="text-4xl md:text-6xl font-bold text-white mb-6 leading-tight">
              Ready to Transform Your
              <span className="block text-yellow-300">WordPress Content Strategy?</span>
            </h2>
            <p className="text-xl md:text-2xl text-blue-100 mb-12 max-w-3xl mx-auto leading-relaxed">
              Join thousands of WordPress site owners who are saving 20+ hours every week
              by automating their article creation and publishing
            </p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center mb-8">
              <Button
                size="lg"
                variant="secondary"
                onClick={() => window.location.href = '/login'}
                className="h-16 px-12 text-lg bg-white text-blue-600 hover:bg-blue-50 shadow-2xl hover:shadow-white/25 transition-all duration-300 transform hover:scale-105 hover:-translate-y-1 font-semibold"
              >
                Start Free Trial
                <ArrowRight className="ml-2 h-6 w-6" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="h-16 px-12 text-lg border-2 border-white text-white hover:bg-white hover:text-blue-600 transition-all duration-300 transform hover:scale-105 hover:-translate-y-1 font-semibold"
              >
                <Play className="mr-2 h-5 w-5 text-gray-700 dark:text-gray-300" />
                <span className="text-gray-700 dark:text-gray-300">Watch Demo</span>
              </Button>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 justify-center text-blue-100 text-sm">
              <div className="flex items-center">
                <CheckCircle className="w-4 h-4 mr-2 text-green-300" />
                <span>No credit card required</span>
              </div>
              <div className="flex items-center">
                <CheckCircle className="w-4 h-4 mr-2 text-green-300" />
                <span>Setup in 5 minutes</span>
              </div>
              <div className="flex items-center">
                <CheckCircle className="w-4 h-4 mr-2 text-green-300" />
                <span>Cancel anytime</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-16 px-4 bg-gradient-to-br from-gray-900 to-slate-900 text-gray-300">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
            <div>
              <div className="flex items-center space-x-3 mb-6">
                <div className="relative">
                  <Bot className="h-10 w-10 text-blue-400" />
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                </div>
                <span className="text-2xl font-bold text-white">WP Auto</span>
              </div>
              <p className="text-gray-400 leading-relaxed mb-6">
                Transform your WordPress content strategy with AI-powered automation.
                Create, schedule, and publish articles automatically.
              </p>
              <div className="flex space-x-4">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 dark:from-blue-600 dark:to-blue-700 rounded-xl flex items-center justify-center text-white text-sm font-bold transition-all duration-300 transform hover:scale-105 cursor-pointer shadow-lg">
                  <Bot className="w-5 h-5" />
                </div>
                <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 dark:from-emerald-600 dark:to-emerald-700 rounded-xl flex items-center justify-center text-white text-sm font-bold transition-all duration-300 transform hover:scale-105 cursor-pointer shadow-lg">
                  <Globe className="w-5 h-5" />
                </div>
              </div>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-6">Product</h4>
              <ul className="space-y-3 text-sm">
                <li><a href="#" className="hover:text-blue-400 dark:hover:text-blue-300 transition-colors duration-200">AI Article Generation</a></li>
                <li><a href="#" className="hover:text-blue-400 dark:hover:text-blue-300 transition-colors duration-200">WordPress Integration</a></li>
                <li><a href="#" className="hover:text-blue-400 dark:hover:text-blue-300 transition-colors duration-200">Content Scheduling</a></li>
                <li><a href="#" className="hover:text-blue-400 dark:hover:text-blue-300 transition-colors duration-200">Multi-Site Management</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-6">Company</h4>
              <ul className="space-y-3 text-sm">
                <li><a href="#" className="hover:text-blue-400 dark:hover:text-blue-300 transition-colors duration-200">About Us</a></li>
                <li><a href="#" className="hover:text-blue-400 dark:hover:text-blue-300 transition-colors duration-200">Blog</a></li>
                <li><a href="#" className="hover:text-blue-400 dark:hover:text-blue-300 transition-colors duration-200">Contact</a></li>
                <li><a href="#" className="hover:text-blue-400 dark:hover:text-blue-300 transition-colors duration-200">Support</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-6">Legal</h4>
              <ul className="space-y-3 text-sm">
                <li><a href="#" className="hover:text-blue-400 dark:hover:text-blue-300 transition-colors duration-200">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-blue-400 dark:hover:text-blue-300 transition-colors duration-200">Terms of Service</a></li>
                <li><a href="#" className="hover:text-blue-400 dark:hover:text-blue-300 transition-colors duration-200">Security</a></li>
                <li><a href="#" className="hover:text-blue-400 dark:hover:text-blue-300 transition-colors duration-200">GDPR</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-12 pt-8 text-center text-sm text-gray-500">
            <p>&copy; 2024 WP Auto. All rights reserved. Built with ❤️ for WordPress creators.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
