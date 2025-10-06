"use client"

import { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { BarChart3, PieChart, Clock, TrendingUp, ExternalLink, Loader2, Globe, Calendar } from "lucide-react"
import type { DetectedFeature } from "@/lib/feature-detector"

interface DashboardPanelProps {
  features: DetectedFeature[]
}

interface WebStatusFeature {
  feature_id: string
  name: string
  baseline: {
    status: "widely" | "newly"
    low_date: string
  } | null
  browser_implementations: {
    chrome?: { version: string; date: string; status: string }
    firefox?: { version: string; date: string; status: string }
    safari?: { version: string; date: string; status: string }
    edge?: { version: string; date: string; status: string }
  }
  usage?: {
    chrome?: { daily: number }
  }
}

export function DashboardPanel({ features }: DashboardPanelProps) {
  const [webStatusData, setWebStatusData] = useState<WebStatusFeature[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [stats, setStats] = useState({
    widelyAvailable: 0,
    newlyAvailable: 0,
    totalFeatures: 0,
    avgUsage: 0,
  })

  // Fetch WebStatus.dev data
  useEffect(() => {
    const fetchWebStatusData = async () => {
      try {
        setIsLoading(true)
        const response = await fetch("https://api.webstatus.dev/v1/features")
        const data = await response.json()
        
        setWebStatusData(data.data || [])
        
        // Calculate statistics
        const widely = data.data.filter((f: WebStatusFeature) => f.baseline?.status === "widely").length
        const newly = data.data.filter((f: WebStatusFeature) => f.baseline?.status === "newly").length
        const total = data.data.length
        
        // Calculate average usage
        const usageData = data.data
          .filter((f: WebStatusFeature) => f.usage?.chrome?.daily)
          .map((f: WebStatusFeature) => f.usage!.chrome!.daily)
        const avgUsage = usageData.length > 0 
          ? usageData.reduce((a: number, b: number) => a + b, 0) / usageData.length 
          : 0

        setStats({
          widelyAvailable: widely,
          newlyAvailable: newly,
          totalFeatures: total,
          avgUsage: avgUsage * 100,
        })
      } catch (error) {
        console.error("Failed to fetch WebStatus data:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchWebStatusData()
  }, [])

  // Calculate browser coverage from real data
  const calculateBrowserCoverage = () => {
    if (webStatusData.length === 0) return { chrome: 0, firefox: 0, safari: 0, edge: 0 }

    const browsers = ["chrome", "firefox", "safari", "edge"]
    const coverage: Record<string, number> = {}

    browsers.forEach((browser) => {
      const supported = webStatusData.filter((f) => 
        f.browser_implementations[browser as keyof typeof f.browser_implementations]?.status === "available"
      ).length
      coverage[browser] = Math.round((supported / webStatusData.length) * 100)
    })

    return coverage
  }

  const browserCoverage = calculateBrowserCoverage()

  // Group features by year
  const featuresByYear = webStatusData
    .filter((f) => f.baseline?.low_date)
    .reduce((acc, f) => {
      const year = new Date(f.baseline!.low_date).getFullYear()
      if (!acc[year]) acc[year] = []
      acc[year].push(f)
      return acc
    }, {} as Record<number, WebStatusFeature[]>)

  // Top trending features by usage
  const trendingFeatures = [...webStatusData]
    .filter((f) => f.usage?.chrome?.daily)
    .sort((a, b) => (b.usage?.chrome?.daily || 0) - (a.usage?.chrome?.daily || 0))
    .slice(0, 5)

  const total = stats.totalFeatures
  const safePercentage = total > 0 ? Math.round((stats.widelyAvailable / total) * 100) : 0
  const newPercentage = total > 0 ? Math.round((stats.newlyAvailable / total) * 100) : 0

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center space-y-3">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-sm text-muted-foreground">Loading dashboard data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 space-y-4">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-blue-500/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Features</p>
              <p className="text-3xl font-bold">{stats.totalFeatures}</p>
            </div>
            <Globe className="h-8 w-8 text-blue-500 opacity-50" />
          </div>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Widely Available</p>
              <p className="text-3xl font-bold">{stats.widelyAvailable}</p>
            </div>
            <TrendingUp className="h-8 w-8 text-green-500 opacity-50" />
          </div>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-yellow-500/10 to-yellow-500/5 border-yellow-500/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Newly Available</p>
              <p className="text-3xl font-bold">{stats.newlyAvailable}</p>
            </div>
            <Calendar className="h-8 w-8 text-yellow-500 opacity-50" />
          </div>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-purple-500/10 to-purple-500/5 border-purple-500/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Avg Usage</p>
              <p className="text-3xl font-bold">{stats.avgUsage.toFixed(2)}%</p>
            </div>
            <BarChart3 className="h-8 w-8 text-purple-500 opacity-50" />
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Feature Distribution Donut Chart */}
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-4">
            <PieChart className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">Feature Distribution</h3>
          </div>

          <div className="flex items-center justify-center gap-8">
            {/* Donut Chart */}
            <div className="relative h-40 w-40">
              <svg className="h-40 w-40 -rotate-90" viewBox="0 0 120 120">
                {/* Background */}
                <circle
                  cx="60"
                  cy="60"
                  r="45"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="20"
                  className="text-muted/20"
                />

                {/* Widely Available - Green */}
                {stats.widelyAvailable > 0 && (
                  <circle
                    cx="60"
                    cy="60"
                    r="45"
                    fill="none"
                    stroke="rgb(34, 197, 94)"
                    strokeWidth="20"
                    strokeDasharray={`${(stats.widelyAvailable / total) * 283} 283`}
                    strokeLinecap="round"
                  />
                )}

                {/* Newly Available - Yellow */}
                {stats.newlyAvailable > 0 && (
                  <circle
                    cx="60"
                    cy="60"
                    r="45"
                    fill="none"
                    stroke="rgb(234, 179, 8)"
                    strokeWidth="20"
                    strokeDasharray={`${(stats.newlyAvailable / total) * 283} 283`}
                    strokeDashoffset={`-${(stats.widelyAvailable / total) * 283}`}
                    strokeLinecap="round"
                  />
                )}
              </svg>

              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-bold">{total}</span>
                <span className="text-xs text-muted-foreground">Features</span>
              </div>
            </div>

            {/* Legend */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-green-500" />
                <span className="text-sm">Widely Available ({safePercentage}%)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-yellow-500" />
                <span className="text-sm">Newly Available ({newPercentage}%)</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Browser Coverage */}
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">Browser Coverage</h3>
          </div>

          <div className="space-y-3">
            {Object.entries(browserCoverage).map(([browser, coverage]) => (
              <div key={browser} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{getBrowserIcon(browser)}</span>
                    <span className="capitalize">{browser}</span>
                  </div>
                  <span className="font-medium">{coverage}%</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 ${
                      coverage >= 90 ? "bg-green-500" : coverage >= 80 ? "bg-yellow-500" : "bg-red-500"
                    }`}
                    style={{ width: `${coverage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Trending Features */}
      {trendingFeatures.length > 0 && (
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">Top Trending Features</h3>
          </div>

          <div className="space-y-2">
            {trendingFeatures.map((feature, idx) => (
              <div
                key={feature.feature_id}
                className="flex items-center gap-3 p-3 rounded-lg border border-border bg-muted/50 hover:bg-muted transition-colors"
              >
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-semibold text-sm">
                  {idx + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{feature.name}</p>
                  <p className="text-xs text-muted-foreground">
                    Usage: {((feature.usage?.chrome?.daily || 0) * 100).toFixed(2)}%
                  </p>
                </div>
                {feature.baseline && (
                  <Badge variant={feature.baseline.status === "widely" ? "default" : "secondary"}>
                    {feature.baseline.status}
                  </Badge>
                )}
                <a
                  href={`https://webstatus.dev/features/${feature.feature_id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                  title="View on WebStatus.dev"
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Baseline Timeline */}
      {Object.keys(featuresByYear).length > 0 && (
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">Baseline Timeline</h3>
          </div>

          <div className="space-y-4 max-h-96 overflow-y-auto">
            {Object.entries(featuresByYear)
              .sort(([a], [b]) => Number(b) - Number(a))
              .slice(0, 5)
              .map(([year, yearFeatures]) => (
                <div key={year} className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="h-px flex-1 bg-border" />
                    <span className="text-sm font-medium text-muted-foreground px-2">{year}</span>
                    <Badge variant="outline">{yearFeatures.length} features</Badge>
                    <div className="h-px flex-1 bg-border" />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                    {yearFeatures.slice(0, 6).map((feature) => (
                      <div
                        key={feature.feature_id}
                        className="flex items-center gap-2 p-2 rounded-lg border border-border bg-muted/50 hover:bg-muted transition-colors text-sm"
                      >
                        <div
                          className={`h-2 w-2 rounded-full flex-shrink-0 ${
                            feature.baseline?.status === "widely"
                              ? "bg-green-500"
                              : "bg-yellow-500"
                          }`}
                        />
                        <span className="flex-1 truncate" title={feature.name}>
                          {feature.name}
                        </span>
                        <a
                          href={`https://webstatus.dev/features/${feature.feature_id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline flex-shrink-0"
                          title="View on WebStatus.dev"
                        >
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    ))}
                  </div>
                  {yearFeatures.length > 6 && (
                    <p className="text-xs text-muted-foreground text-center">
                      +{yearFeatures.length - 6} more features
                    </p>
                  )}
                </div>
              ))}
          </div>
        </Card>
      )}
    </div>
  )
}

function getBrowserIcon(browser: string): string {
  const icons: Record<string, string> = {
    chrome: "🟢",
    firefox: "🟠",
    safari: "🔵",
    edge: "🔷",
  }
  return icons[browser] || "🌐"
}
