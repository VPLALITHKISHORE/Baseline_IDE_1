"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, XCircle, AlertCircle } from "lucide-react"
import type { DetectedFeature } from "@/lib/feature-detector"

interface BrowserMatrixProps {
  features: DetectedFeature[]
}

export function BrowserMatrix({ features }: BrowserMatrixProps) {
  const browsers = [
    { name: "Chrome", key: "chrome" as const, color: "text-[#4285F4]", icon: "🌐" },
    { name: "Firefox", key: "firefox" as const, color: "text-[#FF7139]", icon: "🦊" },
    { name: "Safari", key: "safari" as const, color: "text-[#006CFF]", icon: "🧭" },
    { name: "Edge", key: "edge" as const, color: "text-[#0078D7]", icon: "🌊" },
  ]

  // Calculate browser support percentage
  const getBrowserSupport = (browserKey: (typeof browsers)[0]["key"]) => {
    if (features.length === 0) return 100

    const supportedFeatures = features.filter((feature) => {
      const version = feature.browserSupport?.[browserKey]
      return version && version !== "❌"
    })

    return Math.round((supportedFeatures.length / features.length) * 100)
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Browser Compatibility Matrix</h2>
        <p className="text-sm text-muted-foreground">Detailed browser support analysis for all detected features</p>
      </div>

      {/* Browser Support Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {browsers.map((browser) => {
          const support = getBrowserSupport(browser.key)
          return (
            <Card key={browser.key} className="p-4">
              <div className="flex items-center gap-3 mb-3">
                <span className="text-2xl">{browser.icon}</span>
                <div className="flex-1">
                  <p className="font-semibold">{browser.name}</p>
                  <p className="text-xs text-muted-foreground">Support Level</p>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-end gap-2">
                  <span className={`text-3xl font-bold ${browser.color}`}>{support}%</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full ${support >= 80 ? "bg-green-500" : support >= 60 ? "bg-yellow-500" : "bg-red-500"} transition-all duration-500`}
                    style={{ width: `${support}%` }}
                  />
                </div>
              </div>
            </Card>
          )
        })}
      </div>

      {/* Detailed Feature Matrix */}
      {features.length > 0 && (
        <Card className="p-4">
          <h3 className="font-semibold mb-4">Feature Support Matrix</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-2 text-sm font-medium">Feature</th>
                  {browsers.map((browser) => (
                    <th key={browser.key} className="text-center py-3 px-2 text-sm font-medium">
                      <div className="flex flex-col items-center gap-1">
                        <span>{browser.icon}</span>
                        <span className="text-xs">{browser.name}</span>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {features.map((feature, index) => (
                  <tr key={index} className="border-b border-border hover:bg-muted/50 transition-colors">
                    <td className="py-3 px-2">
                      <div className="space-y-1">
                        <p className="text-sm font-medium">{feature.name}</p>
                        <Badge
                          variant="outline"
                          className={
                            feature.status === "widely_available"
                              ? "border-green-500/50 bg-green-500/10 text-green-500"
                              : feature.status === "newly_available"
                                ? "border-yellow-500/50 bg-yellow-500/10 text-yellow-500"
                                : "border-red-500/50 bg-red-500/10 text-red-500"
                          }
                        >
                          {feature.status === "widely_available"
                            ? "Widely Available"
                            : feature.status === "newly_available"
                              ? "Newly Available"
                              : "Limited"}
                        </Badge>
                      </div>
                    </td>
                    {browsers.map((browser) => {
                      const version = feature.browserSupport?.[browser.key]
                      const isSupported = version && version !== "❌"

                      return (
                        <td key={browser.key} className="py-3 px-2 text-center">
                          <div className="flex flex-col items-center gap-1">
                            {isSupported ? (
                              <>
                                <CheckCircle2 className="h-5 w-5 text-green-500" />
                                <span className="text-xs text-muted-foreground">{version}+</span>
                              </>
                            ) : (
                              <>
                                <XCircle className="h-5 w-5 text-red-500" />
                                <span className="text-xs text-muted-foreground">No</span>
                              </>
                            )}
                          </div>
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {features.length === 0 && (
        <Card className="p-8">
          <div className="text-center text-muted-foreground">
            <AlertCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No features detected yet. Start coding to see browser compatibility analysis.</p>
          </div>
        </Card>
      )}
    </div>
  )
}
