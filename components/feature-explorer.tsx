"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Search, ExternalLink, CheckCircle2, AlertCircle, XCircle, Loader2 } from "lucide-react"
import { fetchAllFeatures, type WebFeature } from "@/lib/webstatus-api"

export function FeatureExplorer() {
  const [features, setFeatures] = useState<WebFeature[]>([])
  const [filteredFeatures, setFilteredFeatures] = useState<WebFeature[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [loading, setLoading] = useState(true)
  const [selectedFilter, setSelectedFilter] = useState<"all" | "widely" | "newly" | "limited">("all")

  useEffect(() => {
    loadFeatures()
  }, [])

  useEffect(() => {
    filterFeatures()
  }, [searchQuery, selectedFilter, features])

  async function loadFeatures() {
    setLoading(true)
    try {
      const data = await fetchAllFeatures()
      setFeatures(data)
      setFilteredFeatures(data.slice(0, 50)) // Show first 50 initially
    } catch (error) {
      console.error("[v0] Error loading features:", error)
    } finally {
      setLoading(false)
    }
  }

  function filterFeatures() {
    let filtered = features

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(
        (f) =>
          f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          f.feature_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
          f.description?.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    }

    // Filter by baseline status
    if (selectedFilter !== "all") {
      filtered = filtered.filter((f) => f.baseline?.status === selectedFilter)
    }

    setFilteredFeatures(filtered.slice(0, 100)) // Limit to 100 results
  }

  const getStatusIcon = (status: string | null) => {
    switch (status) {
      case "widely":
        return <CheckCircle2 className="h-4 w-4 text-green-500" />
      case "newly":
        return <AlertCircle className="h-4 w-4 text-yellow-500" />
      case "limited":
        return <XCircle className="h-4 w-4 text-red-500" />
      default:
        return null
    }
  }

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case "widely":
        return (
          <Badge variant="outline" className="border-green-500/50 bg-green-500/10 text-green-500">
            Widely Available
          </Badge>
        )
      case "newly":
        return (
          <Badge variant="outline" className="border-yellow-500/50 bg-yellow-500/10 text-yellow-500">
            Newly Available
          </Badge>
        )
      case "limited":
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
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-border space-y-4 flex-shrink-0">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search web platform features..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Filter Buttons */}
        <div className="flex gap-2">
          <button
            onClick={() => setSelectedFilter("all")}
            className={`px-3 py-1 text-sm rounded-md transition-colors ${
              selectedFilter === "all" ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-muted/80"
            }`}
          >
            All
          </button>
          <button
            onClick={() => setSelectedFilter("widely")}
            className={`px-3 py-1 text-sm rounded-md transition-colors ${
              selectedFilter === "widely" ? "bg-green-500 text-white" : "bg-muted hover:bg-muted/80"
            }`}
          >
            Widely Available
          </button>
          <button
            onClick={() => setSelectedFilter("newly")}
            className={`px-3 py-1 text-sm rounded-md transition-colors ${
              selectedFilter === "newly" ? "bg-yellow-500 text-white" : "bg-muted hover:bg-muted/80"
            }`}
          >
            Newly Available
          </button>
          <button
            onClick={() => setSelectedFilter("limited")}
            className={`px-3 py-1 text-sm rounded-md transition-colors ${
              selectedFilter === "limited" ? "bg-red-500 text-white" : "bg-muted hover:bg-muted/80"
            }`}
          >
            Limited
          </button>
        </div>

        <div className="text-sm text-muted-foreground">
          {loading ? "Loading..." : `${filteredFeatures.length} features found`}
        </div>
      </div>

      {/* Feature List */}
      <div className="flex-1 overflow-auto">
        <div className="p-4 space-y-3">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredFeatures.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">No features found</div>
          ) : (
            filteredFeatures.map((feature) => (
              <Card key={feature.feature_id} className="p-4 space-y-3 hover:bg-muted/50 transition-colors">
                <div className="flex items-start gap-3">
                  {getStatusIcon(feature.baseline?.status || null)}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-sm">{feature.name}</h4>
                      {getStatusBadge(feature.baseline?.status || null)}
                    </div>
                    {feature.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2">{feature.description}</p>
                    )}
                  </div>
                </div>

                {feature.baseline?.high_date && (
                  <div className="text-xs text-muted-foreground">
                    Baseline since: {new Date(feature.baseline.high_date).toLocaleDateString()}
                  </div>
                )}

                <div className="flex flex-wrap gap-2">
                  <a
                    href={`https://webstatus.dev/features/${feature.feature_id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-primary hover:underline flex items-center gap-1"
                  >
                    View on WebStatus <ExternalLink className="h-3 w-3" />
                  </a>
                  {feature.mdn_url && (
                    <a
                      href={feature.mdn_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-primary hover:underline flex items-center gap-1"
                    >
                      MDN <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                  {feature.caniuse && (
                    <a
                      href={`https://caniuse.com/${feature.caniuse}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-primary hover:underline flex items-center gap-1"
                    >
                      Can I Use <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
