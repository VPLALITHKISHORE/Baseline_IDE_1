"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import { Keyboard } from "lucide-react"

interface ShortcutsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ShortcutsDialog({ open, onOpenChange }: ShortcutsDialogProps) {
  const shortcuts = [
    {
      category: "General",
      items: [
        { keys: ["Ctrl", "K"], description: "Open command palette" },
        { keys: ["Ctrl", "S"], description: "Save file" },
        { keys: ["Ctrl", ","], description: "Open settings" },
        { keys: ["Ctrl", "?"], description: "Show keyboard shortcuts" },
      ],
    },
    {
      category: "Editor",
      items: [
        { keys: ["Ctrl", "F"], description: "Find in file" },
        { keys: ["Ctrl", "H"], description: "Replace in file" },
        { keys: ["Ctrl", "Z"], description: "Undo" },
        { keys: ["Ctrl", "Y"], description: "Redo" },
        { keys: ["Ctrl", "/"], description: "Toggle comment" },
        { keys: ["Alt", "↑"], description: "Move line up" },
        { keys: ["Alt", "↓"], description: "Move line down" },
      ],
    },
    {
      category: "Navigation",
      items: [
        { keys: ["Ctrl", "P"], description: "Quick file open" },
        { keys: ["Ctrl", "Tab"], description: "Switch between files" },
        { keys: ["Ctrl", "G"], description: "Go to line" },
      ],
    },
    {
      category: "Baseline IDE",
      items: [
        { keys: ["Ctrl", "1"], description: "Show editor" },
        { keys: ["Ctrl", "2"], description: "Show suggestions" },
        { keys: ["Ctrl", "3"], description: "Show snippets" },
        { keys: ["Ctrl", "4"], description: "Show dashboard" },
      ],
    },
  ]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Keyboard className="h-5 w-5" />
            Keyboard Shortcuts
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {shortcuts.map((section) => (
            <div key={section.category} className="space-y-3">
              <h3 className="text-sm font-medium">{section.category}</h3>
              <Separator />
              <div className="space-y-2">
                {section.items.map((shortcut, index) => (
                  <div key={index} className="flex items-center justify-between py-2">
                    <span className="text-sm text-muted-foreground">{shortcut.description}</span>
                    <div className="flex items-center gap-1">
                      {shortcut.keys.map((key, keyIndex) => (
                        <span key={keyIndex} className="flex items-center gap-1">
                          <kbd className="pointer-events-none inline-flex h-6 select-none items-center gap-1 rounded border bg-muted px-2 font-mono text-xs font-medium text-muted-foreground">
                            {key}
                          </kbd>
                          {keyIndex < shortcut.keys.length - 1 && <span className="text-muted-foreground">+</span>}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}
