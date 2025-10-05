"use client"

import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { BarChart3, PieChart, Clock, TrendingUp, ExternalLink } from "lucide-react"
import type { DetectedFeature } from "@/lib/feature-detector"

interface DashboardPanelProps {
  features: DetectedFeature[]
}

export function DashboardPanel({ features }: DashboardPanelProps) {
  // Calculate statistics
  const cssFeatures = features.filter((f) => f.type === "css")
  const jsFeatures = features.filter((f) => f.type === "javascript")

  const widelyAvailable = features.filter((f) => f.status === "widely_available").length
  const newlyAvailable = features.filter((f) => f.status === "newly_available").length
  const limitedAvailability = features.filter((f) => f.status === "limited_availability").length

  const total = features.length
  const safePercentage = total > 0 ? Math.round((widelyAvailable / total) * 100) : 0
  const newPercentage = total > 0 ? Math.round((newlyAvailable / total) * 100) : 0
  const limitedPercentage = total > 0 ? Math.round((limitedAvailability / total) * 100) : 0

  // Browser coverage calculation (simplified)
  const browserCoverage = {
    chrome: features.every((f) => f.browserSupport?.chrome && !f.browserSupport.chrome.includes("❌")) ? 95 : 85,
    firefox: features.every((f) => f.browserSupport?.firefox && !f.browserSupport.firefox.includes("❌")) ? 90 : 75,
    safari: features.every((f) => f.browserSupport?.safari && !f.browserSupport.safari.includes("❌")) ? 88 : 70,
    edge: features.every((f) => f.browserSupport?.edge && !f.browserSupport.edge.includes("❌")) ? 94 : 82,
  }

  const featuresByDate = features
    .filter((f) => f.baselineDate)
    .reduce(
      (acc, f) => {
        const year = new Date(f.baselineDate!).getFullYear()
        if (!acc[year]) acc[year] = []
        acc[year].push(f)
        return acc
      },
      {} as Record<number, DetectedFeature[]>,
    )

  return (
    <div className="p-4 space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Feature Distribution Donut Chart */}
        <Card className="p-4 col-span-1 md:col-span-2">
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
                {widelyAvailable > 0 && (
                  <circle
                    cx="60"
                    cy="60"
                    r="45"
                    fill="none"
                    stroke="rgb(34, 197, 94)"
                    strokeWidth="20"
                    strokeDasharray={`${(widelyAvailable / total) * 283} 283`}
                    strokeLinecap="round"
                  />
                )}

                {/* Newly Available - Yellow */}
                {newlyAvailable > 0 && (
                  <circle
                    cx="60"
                    cy="60"
                    r="45"
                    fill="none"
                    stroke="rgb(234, 179, 8)"
                    strokeWidth="20"
                    strokeDasharray={`${(newlyAvailable / total) * 283} 283`}
                    strokeDashoffset={`-${(widelyAvailable / total) * 283}`}
                    strokeLinecap="round"
                  />
                )}

                {/* Limited - Red */}
                {limitedAvailability > 0 && (
                  <circle
                    cx="60"
                    cy="60"
                    r="45"
                    fill="none"
                    stroke="rgb(239, 68, 68)"
                    strokeWidth="20"
                    strokeDasharray={`${(limitedAvailability / total) * 283} 283`}
                    strokeDashoffset={`-${((widelyAvailable + newlyAvailable) / total) * 283}`}
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
              {limitedAvailability > 0 && (
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-red-500" />
                  <span className="text-sm">Limited ({limitedPercentage}%)</span>
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* Browser Coverage */}
        <Card className="p-4 col-span-1 md:col-span-2">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">Browser Coverage</h3>
          </div>

          <div className="space-y-3">
            {Object.entries(browserCoverage).map(([browser, coverage]) => (
              <div key={browser} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="capitalize">{browser}</span>
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

        {/* Feature Type Breakdown */}
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">By Type</h3>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">CSS Features</span>
              <Badge variant="secondary">{cssFeatures.length}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">JS Features</span>
              <Badge variant="secondary">{jsFeatures.length}</Badge>
            </div>
          </div>
        </Card>

        {/* Timeline Preview */}
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">Baseline Status</h3>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="h-8 w-1 bg-green-500 rounded-full" />
              <div>
                <div className="text-sm font-medium">2023-2024</div>
                <div className="text-xs text-muted-foreground">{widelyAvailable} widely available</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-8 w-1 bg-yellow-500 rounded-full" />
              <div>
                <div className="text-sm font-medium">2024-2025</div>
                <div className="text-xs text-muted-foreground">{newlyAvailable} newly available</div>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {Object.keys(featuresByDate).length > 0 && (
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">Baseline Timeline</h3>
          </div>

          <div className="space-y-4">
            {Object.entries(featuresByDate)
              .sort(([a], [b]) => Number(b) - Number(a))
              .map(([year, yearFeatures]) => (
                <div key={year} className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="h-px flex-1 bg-border" />
                    <span className="text-sm font-medium text-muted-foreground">{year}</span>
                    <div className="h-px flex-1 bg-border" />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {yearFeatures.map((feature, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-2 p-2 rounded-lg border border-border bg-muted/50 text-sm"
                      >
                        <div
                          className={`h-2 w-2 rounded-full ${
                            feature.status === "widely_available"
                              ? "bg-green-500"
                              : feature.status === "newly_available"
                                ? "bg-yellow-500"
                                : "bg-red-500"
                          }`}
                        />
                        <span className="flex-1 truncate">{feature.name}</span>
                        {feature.feature_id && (
                          <a
                            href={`https://webstatus.dev/features/${feature.feature_id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline"
                            title="View on WebStatus.dev"
                          >
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
          </div>
        </Card>
      )}
    </div>
  )
}
