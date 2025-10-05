"use client"

import { Badge } from "@/components/ui/badge"
import { CheckCircle2, AlertCircle, XCircle } from "lucide-react"
import type { DetectedFeature } from "@/lib/feature-detector"
import type { FileNode } from "./ide-layout"

interface StatusBarProps {
  activeFile: FileNode | null
  features: DetectedFeature[]
  cursorPosition?: { line: number; column: number }
}

export function StatusBar({ activeFile, features, cursorPosition }: StatusBarProps) {
  const widelyAvailable = features.filter((f) => f.status === "widely_available").length
  const newlyAvailable = features.filter((f) => f.status === "newly_available").length
  const limited = features.filter((f) => f.status === "limited_availability").length

  const getOverallStatus = () => {
    if (limited > 0) return { icon: XCircle, color: "text-red-500", label: "Issues Found" }
    if (newlyAvailable > 0) return { icon: AlertCircle, color: "text-yellow-500", label: "Newly Available" }
    return { icon: CheckCircle2, color: "text-green-500", label: "All Clear" }
  }

  const status = getOverallStatus()
  const StatusIcon = status.icon

  return (
    <div className="flex h-6 items-center justify-between border-t border-border bg-card px-4 text-xs">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <StatusIcon className={`h-3 w-3 ${status.color}`} />
          <span className="text-muted-foreground">{status.label}</span>
        </div>

        {features.length > 0 && (
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="h-5 px-1.5 text-xs">
              {widelyAvailable} ✓
            </Badge>
            {newlyAvailable > 0 && (
              <Badge variant="outline" className="h-5 px-1.5 text-xs text-yellow-500">
                {newlyAvailable} ⚠
              </Badge>
            )}
            {limited > 0 && (
              <Badge variant="outline" className="h-5 px-1.5 text-xs text-red-500">
                {limited} ✗
              </Badge>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center gap-4 text-muted-foreground">
        {activeFile && (
          <>
            <span>{activeFile.name}</span>
            {cursorPosition && (
              <span>
                Ln {cursorPosition.line}, Col {cursorPosition.column}
              </span>
            )}
            <span>{activeFile.content?.split("\n").length || 0} lines</span>
          </>
        )}
      </div>
    </div>
  )
}
