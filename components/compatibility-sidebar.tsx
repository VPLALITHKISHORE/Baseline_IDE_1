"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { CheckCircle2, AlertCircle, XCircle, Chrome, Globe, TrendingUp, Lightbulb, Copy, Check } from "lucide-react"
import type { DetectedFeature } from "@/lib/feature-detector"
import type { FileNode } from "./ide-layout"
import { getBaselineStatus, getFeatureRecommendations } from "@/lib/feature-detector"
import { useState } from "react"

interface CompatibilitySidebarProps {
  features: DetectedFeature[]
  activeFile: FileNode | null
}

export function CompatibilitySidebar({ features, activeFile }: CompatibilitySidebarProps) {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)

  const stats = getBaselineStatus(features)
  const compatibilityScore =
    features.length > 0 ? Math.round(((stats.widelyAvailable + stats.newlyAvailable * 0.7) / stats.total) * 100) : 100

  const recommendations = getFeatureRecommendations(features)

  const copyFeatureToClipboard = async (feature: DetectedFeature, index: number) => {
    const browserInfo = feature.browserSupport
      ? `\nBrowser Support:\n${feature.browserSupport.chrome ? `- Chrome ${feature.browserSupport.chrome}+\n` : ""}${feature.browserSupport.firefox ? `- Firefox ${feature.browserSupport.firefox}+\n` : ""}${feature.browserSupport.safari ? `- Safari ${feature.browserSupport.safari}+\n` : ""}${feature.browserSupport.edge ? `- Edge ${feature.browserSupport.edge}+` : ""}`
      : ""

    const text = `${feature.name}
Status: ${feature.status.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
${feature.description}
Line: ${feature.line}${browserInfo}`

    try {
      await navigator.clipboard.writeText(text)
      setCopiedIndex(index)
      setTimeout(() => setCopiedIndex(null), 2000)
    } catch (err) {
      console.error("Failed to copy:", err)
    }
  }

  const getStatusIcon = (status: DetectedFeature["status"]) => {
    switch (status) {
      case "widely_available":
        return <CheckCircle2 className="h-4 w-4 text-green-500" />
      case "newly_available":
        return <AlertCircle className="h-4 w-4 text-yellow-500" />
      case "limited_availability":
        return <XCircle className="h-4 w-4 text-red-500" />
      default:
        return <Globe className="h-4 w-4 text-muted-foreground" />
    }
  }

  const getStatusBadge = (status: DetectedFeature["status"]) => {
    switch (status) {
      case "widely_available":
        return (
          <Badge variant="outline" className="border-green-500/50 bg-green-500/10 text-green-500">
            Widely Available
          </Badge>
        )
      case "newly_available":
        return (
          <Badge variant="outline" className="border-yellow-500/50 bg-yellow-500/10 text-yellow-500">
            Newly Available
          </Badge>
        )
      case "limited_availability":
        return (
          <Badge variant="outline" className="border-red-500/50 bg-red-500/10 text-red-500">
            Limited
          </Badge>
        )
      default:
        return <Badge variant="outline">Unknown</Badge>
    }
  }

  return (
    <aside className="w-80 border-l border-border bg-card">
      <div className="flex h-12 items-center gap-2 border-b border-border px-4">
        <div className="h-2 w-2 rounded-full bg-green-500" />
        <span className="text-sm font-medium">Baseline Status</span>
      </div>

      <ScrollArea className="h-[calc(100vh-8rem)]">
        <div className="p-4 space-y-4">
          {features.length > 0 && (
            <div className="rounded-lg border border-border bg-gradient-to-br from-muted/50 to-muted/30 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold">Compatibility Score</h3>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="relative">
                <div className="flex items-center justify-center">
                  <div className="relative h-32 w-32">
                    <svg className="h-32 w-32 -rotate-90" viewBox="0 0 120 120">
                      {/* Background circle */}
                      <circle
                        cx="60"
                        cy="60"
                        r="50"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="10"
                        className="text-muted/20"
                      />
                      {/* Progress circle */}
                      <circle
                        cx="60"
                        cy="60"
                        r="50"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="10"
                        strokeDasharray={`${(compatibilityScore / 100) * 314} 314`}
                        strokeLinecap="round"
                        className={
                          compatibilityScore >= 80
                            ? "text-green-500"
                            : compatibilityScore >= 60
                              ? "text-yellow-500"
                              : "text-red-500"
                        }
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-3xl font-bold">{compatibilityScore}</span>
                    </div>
                  </div>
                </div>
                <p className="text-center text-xs text-muted-foreground mt-2">
                  {compatibilityScore >= 80
                    ? "Excellent browser support"
                    : compatibilityScore >= 60
                      ? "Good browser support"
                      : "Consider alternatives"}
                </p>
              </div>
            </div>
          )}

          {/* Summary Stats */}
          {features.length > 0 && (
            <div className="rounded-lg border border-border bg-muted/50 p-4 space-y-3">
              <h3 className="text-sm font-semibold">Summary</h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Total Features</span>
                  <span className="font-medium">{stats.total}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-green-500">
                    <CheckCircle2 className="h-3 w-3" />
                    Widely Available
                  </span>
                  <span className="font-medium">{stats.widelyAvailable}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-yellow-500">
                    <AlertCircle className="h-3 w-3" />
                    Newly Available
                  </span>
                  <span className="font-medium">{stats.newlyAvailable}</span>
                </div>
                {stats.limitedAvailability > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-red-500">
                      <XCircle className="h-3 w-3" />
                      Limited
                    </span>
                    <span className="font-medium">{stats.limitedAvailability}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {recommendations.length > 0 && (
            <div className="rounded-lg border border-yellow-500/50 bg-yellow-500/10 p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Lightbulb className="h-4 w-4 text-yellow-500" />
                <h3 className="text-sm font-semibold text-yellow-500">Recommendations</h3>
              </div>
              <div className="space-y-2">
                {recommendations.map((rec, index) => (
                  <div key={index} className="text-xs space-y-1">
                    <p className="font-medium">{rec.feature}</p>
                    <p className="text-muted-foreground">{rec.suggestion}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Feature List */}
          {features.length > 0 ? (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold">Detected Features</h3>
              {features.map((feature, index) => (
                <div key={index} className="rounded-lg border border-border bg-card p-3 space-y-2">
                  <div className="flex items-start gap-2">
                    {getStatusIcon(feature.status)}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium truncate">{feature.name}</span>
                      </div>
                      {getStatusBadge(feature.status)}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 shrink-0"
                      onClick={() => copyFeatureToClipboard(feature, index)}
                      title="Copy feature info"
                    >
                      {copiedIndex === index ? (
                        <Check className="h-4 w-4 text-green-500" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>

                  <p className="text-xs text-muted-foreground">{feature.description}</p>

                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <span>Line {feature.line}</span>
                  </div>

                  {/* Browser Support */}
                  {feature.browserSupport && (
                    <div className="pt-2 border-t border-border">
                      <div className="text-xs font-medium mb-2">Browser Support</div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        {feature.browserSupport.chrome && (
                          <div className="flex items-center gap-1">
                            <Chrome className="h-3 w-3" />
                            <span className="text-muted-foreground">Chrome {feature.browserSupport.chrome}+</span>
                          </div>
                        )}
                        {feature.browserSupport.firefox && (
                          <div className="flex items-center gap-1">
                            <Globe className="h-3 w-3" />
                            <span className="text-muted-foreground">Firefox {feature.browserSupport.firefox}+</span>
                          </div>
                        )}
                        {feature.browserSupport.safari && (
                          <div className="flex items-center gap-1">
                            <Globe className="h-3 w-3" />
                            <span className="text-muted-foreground">Safari {feature.browserSupport.safari}+</span>
                          </div>
                        )}
                        {feature.browserSupport.edge && (
                          <div className="flex items-center gap-1">
                            <Globe className="h-3 w-3" />
                            <span className="text-muted-foreground">Edge {feature.browserSupport.edge}+</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Globe className="mx-auto h-12 w-12 text-muted-foreground/50 mb-3" />
              <p className="text-sm text-muted-foreground">
                {activeFile ? "No features detected in this file" : "Select a file to see compatibility info"}
              </p>
            </div>
          )}
        </div>
      </ScrollArea>
    </aside>
  )
}
