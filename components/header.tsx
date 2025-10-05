"use client"

import { Sparkles, Command, Settings, Keyboard, Upload, Download } from "lucide-react"
import { Button } from "@/components/ui/button"

interface HeaderProps {
  onCommandPalette: () => void
  onSettings: () => void
  onShortcuts: () => void
  onImport: () => void
  onExport: () => void
}

export function Header({ onCommandPalette, onSettings, onShortcuts, onImport, onExport }: HeaderProps) {
  return (
    <header className="flex h-14 items-center justify-between border-b border-border bg-card px-6">
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
          <Sparkles className="h-5 w-5 text-primary-foreground" />
        </div>
        <div>
          <h1 className="text-lg font-semibold">Baseline IDE</h1>
          <p className="text-xs text-muted-foreground">Real-time web compatibility checking</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={onImport} className="gap-2">
          <Upload className="h-4 w-4" />
          Import
        </Button>
        <Button variant="ghost" size="sm" onClick={onExport} className="gap-2">
          <Download className="h-4 w-4" />
          Export
        </Button>
        <div className="h-4 w-px bg-border mx-1" />
        <Button variant="ghost" size="sm" onClick={onCommandPalette} className="gap-2">
          <Command className="h-4 w-4" />
          <span className="hidden sm:inline">Commands</span>
        </Button>
        <Button variant="ghost" size="sm" onClick={onShortcuts} className="gap-2">
          <Keyboard className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="sm" onClick={onSettings} className="gap-2">
          <Settings className="h-4 w-4" />
        </Button>
        <div className="rounded-full bg-green-500/20 px-3 py-1 text-xs font-medium text-green-500">Baseline 2024</div>
      </div>
    </header>
  )
}
