"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Activity, Zap, Shield, TrendingUp, AlertTriangle, CheckCircle2, Code2, FileCode, Layers } from "lucide-react"
import type { DetectedFeature } from "@/lib/feature-detector"

interface CodeQualityPanelProps {
  features: DetectedFeature[]
  code: string
  language: string
}

export function CodeQualityPanel({ features, code, language }: CodeQualityPanelProps) {
  // Calculate code metrics
  const lines = code.split("\n").filter((line) => line.trim().length > 0)
  const totalLines = lines.length
  const codeLines = lines.filter((line) => !line.trim().startsWith("//") && !line.trim().startsWith("/*")).length
  const commentLines = totalLines - codeLines

  // Calculate complexity score (simplified)
  const complexityIndicators = [
    /if\s*\(/g,
    /for\s*\(/g,
    /while\s*\(/g,
    /switch\s*\(/g,
    /\?\s*.*\s*:/g, // ternary
    /&&|\|\|/g, // logical operators
  ]

  let complexityScore = 0
  complexityIndicators.forEach((pattern) => {
    const matches = code.match(pattern)
    if (matches) complexityScore += matches.length
  })

  const complexityRating = complexityScore < 10 ? "Low" : complexityScore < 20 ? "Medium" : "High"
  const complexityColor =
    complexityScore < 10 ? "text-green-500" : complexityScore < 20 ? "text-yellow-500" : "text-red-500"

  // Performance impact analysis
  const performanceFeatures = features.filter(
    (f) => f.name.includes("content-visibility") || f.name.includes("container-type") || f.name.includes("clamp"),
  )

  const performanceScore = performanceFeatures.length > 0 ? 85 : 70

  // Maintainability score
  const maintainabilityScore = Math.min(
    100,
    Math.round(
      (codeLines < 200 ? 30 : 20) + // Length factor
        (complexityScore < 15 ? 30 : 20) + // Complexity factor
        (commentLines / totalLines > 0.1 ? 20 : 10) + // Documentation factor
        (features.filter((f) => f.status === "widely_available").length / Math.max(features.length, 1)) * 20, // Modern features factor
    ),
  )

  return (
    <ScrollArea className="h-full">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div>
          <h2 className="text-2xl font-bold mb-2">Code Quality Analysis</h2>
          <p className="text-sm text-muted-foreground">Comprehensive metrics and insights for your code</p>
        </div>

        {/* Quality Score Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Maintainability */}
          <Card className="p-4 bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-blue-500/20">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-blue-500" />
                <span className="text-sm font-medium">Maintainability</span>
              </div>
              <Badge variant="outline" className="border-blue-500/50 bg-blue-500/10 text-blue-500">
                {maintainabilityScore >= 80 ? "Excellent" : maintainabilityScore >= 60 ? "Good" : "Needs Work"}
              </Badge>
            </div>
            <div className="flex items-end gap-2">
              <span className="text-4xl font-bold text-blue-500">{maintainabilityScore}</span>
              <span className="text-muted-foreground mb-1">/100</span>
            </div>
            <div className="mt-3 h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 transition-all duration-500"
                style={{ width: `${maintainabilityScore}%` }}
              />
            </div>
          </Card>

          {/* Performance */}
          <Card className="p-4 bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/20">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-green-500" />
                <span className="text-sm font-medium">Performance</span>
              </div>
              <Badge variant="outline" className="border-green-500/50 bg-green-500/10 text-green-500">
                {performanceScore >= 80 ? "Optimized" : "Standard"}
              </Badge>
            </div>
            <div className="flex items-end gap-2">
              <span className="text-4xl font-bold text-green-500">{performanceScore}</span>
              <span className="text-muted-foreground mb-1">/100</span>
            </div>
            <div className="mt-3 h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-green-500 transition-all duration-500"
                style={{ width: `${performanceScore}%` }}
              />
            </div>
          </Card>

          {/* Complexity */}
          <Card
            className={`p-4 bg-gradient-to-br from-${complexityScore < 10 ? "green" : complexityScore < 20 ? "yellow" : "red"}-500/10 to-${complexityScore < 10 ? "green" : complexityScore < 20 ? "yellow" : "red"}-500/5 border-${complexityScore < 10 ? "green" : complexityScore < 20 ? "yellow" : "red"}-500/20`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Activity className={`h-5 w-5 ${complexityColor}`} />
                <span className="text-sm font-medium">Complexity</span>
              </div>
              <Badge
                variant="outline"
                className={`border-${complexityScore < 10 ? "green" : complexityScore < 20 ? "yellow" : "red"}-500/50 bg-${complexityScore < 10 ? "green" : complexityScore < 20 ? "yellow" : "red"}-500/10 ${complexityColor}`}
              >
                {complexityRating}
              </Badge>
            </div>
            <div className="flex items-end gap-2">
              <span className={`text-4xl font-bold ${complexityColor}`}>{complexityScore}</span>
              <span className="text-muted-foreground mb-1">points</span>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {complexityScore < 10
                ? "Easy to understand"
                : complexityScore < 20
                  ? "Moderate complexity"
                  : "Consider refactoring"}
            </p>
          </Card>
        </div>

        {/* Code Metrics */}
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-4">
            <Code2 className="h-5 w-5 text-muted-foreground" />
            <h3 className="font-semibold">Code Metrics</h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-1">
              <p className="text-2xl font-bold">{totalLines}</p>
              <p className="text-xs text-muted-foreground">Total Lines</p>
            </div>
            <div className="space-y-1">
              <p className="text-2xl font-bold">{codeLines}</p>
              <p className="text-xs text-muted-foreground">Code Lines</p>
            </div>
            <div className="space-y-1">
              <p className="text-2xl font-bold">{commentLines}</p>
              <p className="text-xs text-muted-foreground">Comments</p>
            </div>
            <div className="space-y-1">
              <p className="text-2xl font-bold">{features.length}</p>
              <p className="text-xs text-muted-foreground">Features Used</p>
            </div>
          </div>
        </Card>

        {/* Performance Impact */}
        {performanceFeatures.length > 0 && (
          <Card className="p-4 bg-gradient-to-br from-green-500/5 to-transparent border-green-500/20">
            <div className="flex items-center gap-2 mb-4">
              <Zap className="h-5 w-5 text-green-500" />
              <h3 className="font-semibold text-green-500">Performance Optimizations Detected</h3>
            </div>
            <div className="space-y-3">
              {performanceFeatures.map((feature, index) => (
                <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-card border border-border">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{feature.name}</p>
                    <p className="text-xs text-muted-foreground mt-1">{feature.description}</p>
                    {feature.name.includes("content-visibility") && (
                      <p className="text-xs text-green-500 mt-2">
                        ⚡ Can improve rendering performance by up to 7x for off-screen content
                      </p>
                    )}
                    {feature.name.includes("container-type") && (
                      <p className="text-xs text-green-500 mt-2">
                        ⚡ Enables efficient responsive design without media queries
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Feature Type Breakdown */}
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-4">
            <Layers className="h-5 w-5 text-muted-foreground" />
            <h3 className="font-semibold">Feature Breakdown</h3>
          </div>
          <div className="space-y-3">
            {["css", "javascript"].map((type) => {
              const typeFeatures = features.filter((f) => f.type === type)
              if (typeFeatures.length === 0) return null

              return (
                <div key={type} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium capitalize">{type}</span>
                    <Badge variant="outline">{typeFeatures.length} features</Badge>
                  </div>
                  <div className="flex gap-2">
                    <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary transition-all duration-500"
                        style={{ width: `${(typeFeatures.length / features.length) * 100}%` }}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground w-12 text-right">
                      {Math.round((typeFeatures.length / features.length) * 100)}%
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </Card>

        {/* Recommendations */}
        <Card className="p-4 bg-gradient-to-br from-purple-500/5 to-transparent border-purple-500/20">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="h-5 w-5 text-purple-500" />
            <h3 className="font-semibold text-purple-500">Improvement Suggestions</h3>
          </div>
          <div className="space-y-3">
            {complexityScore > 20 && (
              <div className="flex items-start gap-3 p-3 rounded-lg bg-card border border-border">
                <AlertTriangle className="h-5 w-5 text-yellow-500 mt-0.5" />
                <div>
                  <p className="text-sm font-medium">High Complexity Detected</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Consider breaking down complex functions into smaller, reusable pieces
                  </p>
                </div>
              </div>
            )}
            {commentLines / totalLines < 0.1 && totalLines > 20 && (
              <div className="flex items-start gap-3 p-3 rounded-lg bg-card border border-border">
                <FileCode className="h-5 w-5 text-blue-500 mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Add More Documentation</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Adding comments can improve code maintainability and team collaboration
                  </p>
                </div>
              </div>
            )}
            {features.filter((f) => f.status === "limited_availability").length > 0 && (
              <div className="flex items-start gap-3 p-3 rounded-lg bg-card border border-border">
                <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Limited Browser Support</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Some features have limited browser support. Consider adding polyfills or fallbacks
                  </p>
                </div>
              </div>
            )}
            {features.length === 0 && totalLines > 10 && (
              <div className="flex items-start gap-3 p-3 rounded-lg bg-card border border-border">
                <TrendingUp className="h-5 w-5 text-green-500 mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Consider Modern Features</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Explore modern web features to improve performance and developer experience
                  </p>
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>
    </ScrollArea>
  )
}
