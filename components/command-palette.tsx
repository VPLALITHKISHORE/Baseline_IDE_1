"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import {
  Search,
  Download,
  Upload,
  Settings,
  Keyboard,
  Code2,
  LayoutDashboard,
  Activity,
  Globe,
  Lightbulb,
  BookOpen,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface Command {
  id: string
  label: string
  icon: React.ReactNode
  action: () => void
  keywords: string[]
}

interface CommandPaletteProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCommand: (commandId: string) => void
}

export function CommandPalette({ open, onOpenChange, onCommand }: CommandPaletteProps) {
  const [search, setSearch] = useState("")
  const [selectedIndex, setSelectedIndex] = useState(0)

  const commands: Command[] = [
    {
      id: "import-file",
      label: "Import File",
      icon: <Upload className="h-4 w-4" />,
      action: () => onCommand("import-file"),
      keywords: ["import", "upload", "file", "add"],
    },
    {
      id: "export-project",
      label: "Export Project",
      icon: <Download className="h-4 w-4" />,
      action: () => onCommand("export-project"),
      keywords: ["export", "download", "save", "zip"],
    },
    {
      id: "show-editor",
      label: "Show Editor",
      icon: <Code2 className="h-4 w-4" />,
      action: () => onCommand("show-editor"),
      keywords: ["editor", "code", "edit"],
    },
    {
      id: "show-suggestions",
      label: "Show Smart Suggestions",
      icon: <Lightbulb className="h-4 w-4" />,
      action: () => onCommand("show-suggestions"),
      keywords: ["suggestions", "smart", "recommendations"],
    },
    {
      id: "show-snippets",
      label: "Show Code Snippets",
      icon: <BookOpen className="h-4 w-4" />,
      action: () => onCommand("show-snippets"),
      keywords: ["snippets", "code", "examples"],
    },
    {
      id: "show-dashboard",
      label: "Show Dashboard",
      icon: <LayoutDashboard className="h-4 w-4" />,
      action: () => onCommand("show-dashboard"),
      keywords: ["dashboard", "overview", "stats"],
    },
    {
      id: "show-quality",
      label: "Show Code Quality",
      icon: <Activity className="h-4 w-4" />,
      action: () => onCommand("show-quality"),
      keywords: ["quality", "metrics", "analysis"],
    },
    {
      id: "show-browsers",
      label: "Show Browser Matrix",
      icon: <Globe className="h-4 w-4" />,
      action: () => onCommand("show-browsers"),
      keywords: ["browsers", "matrix", "compatibility"],
    },
    {
      id: "show-explorer",
      label: "Show Feature Explorer",
      icon: <Search className="h-4 w-4" />,
      action: () => onCommand("show-explorer"),
      keywords: ["explorer", "features", "search"],
    },
    {
      id: "settings",
      label: "Open Settings",
      icon: <Settings className="h-4 w-4" />,
      action: () => onCommand("settings"),
      keywords: ["settings", "preferences", "config"],
    },
    {
      id: "shortcuts",
      label: "Show Keyboard Shortcuts",
      icon: <Keyboard className="h-4 w-4" />,
      action: () => onCommand("shortcuts"),
      keywords: ["shortcuts", "keyboard", "keys", "help"],
    },
  ]

  const filteredCommands = commands.filter((cmd) => {
    const searchLower = search.toLowerCase()
    return (
      cmd.label.toLowerCase().includes(searchLower) || cmd.keywords.some((keyword) => keyword.includes(searchLower))
    )
  })

  useEffect(() => {
    setSelectedIndex(0)
  }, [search])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!open) return

      if (e.key === "ArrowDown") {
        e.preventDefault()
        setSelectedIndex((prev) => (prev + 1) % filteredCommands.length)
      } else if (e.key === "ArrowUp") {
        e.preventDefault()
        setSelectedIndex((prev) => (prev - 1 + filteredCommands.length) % filteredCommands.length)
      } else if (e.key === "Enter") {
        e.preventDefault()
        if (filteredCommands[selectedIndex]) {
          filteredCommands[selectedIndex].action()
          onOpenChange(false)
          setSearch("")
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [open, selectedIndex, filteredCommands, onOpenChange])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-0 gap-0 max-w-2xl">
        <div className="flex items-center gap-3 border-b px-4 py-3">
          <Search className="h-5 w-5 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Type a command or search..."
            className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0 h-auto p-0"
            autoFocus
          />
        </div>
        <div className="max-h-96 overflow-y-auto">
          {filteredCommands.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">No commands found</div>
          ) : (
            <div className="py-2">
              {filteredCommands.map((cmd, index) => (
                <button
                  key={cmd.id}
                  onClick={() => {
                    cmd.action()
                    onOpenChange(false)
                    setSearch("")
                  }}
                  className={cn(
                    "flex w-full items-center gap-3 px-4 py-3 text-sm hover:bg-accent",
                    index === selectedIndex && "bg-accent",
                  )}
                >
                  {cmd.icon}
                  <span>{cmd.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
