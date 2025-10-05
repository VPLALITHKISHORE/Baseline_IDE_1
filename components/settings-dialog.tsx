"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"

interface SettingsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  settings: EditorSettings
  onSettingsChange: (settings: EditorSettings) => void
}

export interface EditorSettings {
  autoSave: boolean
  fontSize: number
  tabSize: number
  wordWrap: boolean
  minimap: boolean
  lineNumbers: boolean
  theme: "vs-dark" | "vs-light"
}

export function SettingsDialog({ open, onOpenChange, settings, onSettingsChange }: SettingsDialogProps) {
  const updateSetting = <K extends keyof EditorSettings>(key: K, value: EditorSettings[K]) => {
    onSettingsChange({ ...settings, [key]: value })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editor Settings</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Editor Appearance */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium">Appearance</h3>
            <Separator />

            <div className="flex items-center justify-between">
              <Label htmlFor="theme" className="flex flex-col gap-1">
                <span>Theme</span>
                <span className="text-xs text-muted-foreground font-normal">Choose editor color theme</span>
              </Label>
              <Select value={settings.theme} onValueChange={(value) => updateSetting("theme", value as any)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="vs-dark">Dark</SelectItem>
                  <SelectItem value="vs-light">Light</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="fontSize" className="flex flex-col gap-1">
                <span>Font Size</span>
                <span className="text-xs text-muted-foreground font-normal">Editor font size in pixels</span>
              </Label>
              <Select
                value={settings.fontSize.toString()}
                onValueChange={(value) => updateSetting("fontSize", Number.parseInt(value))}
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="12">12px</SelectItem>
                  <SelectItem value="14">14px</SelectItem>
                  <SelectItem value="16">16px</SelectItem>
                  <SelectItem value="18">18px</SelectItem>
                  <SelectItem value="20">20px</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Editor Behavior */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium">Behavior</h3>
            <Separator />

            <div className="flex items-center justify-between">
              <Label htmlFor="autoSave" className="flex flex-col gap-1">
                <span>Auto Save</span>
                <span className="text-xs text-muted-foreground font-normal">Automatically save changes</span>
              </Label>
              <Switch
                id="autoSave"
                checked={settings.autoSave}
                onCheckedChange={(checked) => updateSetting("autoSave", checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="tabSize" className="flex flex-col gap-1">
                <span>Tab Size</span>
                <span className="text-xs text-muted-foreground font-normal">Number of spaces per tab</span>
              </Label>
              <Select
                value={settings.tabSize.toString()}
                onValueChange={(value) => updateSetting("tabSize", Number.parseInt(value))}
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2">2 spaces</SelectItem>
                  <SelectItem value="4">4 spaces</SelectItem>
                  <SelectItem value="8">8 spaces</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="wordWrap" className="flex flex-col gap-1">
                <span>Word Wrap</span>
                <span className="text-xs text-muted-foreground font-normal">Wrap long lines</span>
              </Label>
              <Switch
                id="wordWrap"
                checked={settings.wordWrap}
                onCheckedChange={(checked) => updateSetting("wordWrap", checked)}
              />
            </div>
          </div>

          {/* Editor Features */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium">Features</h3>
            <Separator />

            <div className="flex items-center justify-between">
              <Label htmlFor="minimap" className="flex flex-col gap-1">
                <span>Minimap</span>
                <span className="text-xs text-muted-foreground font-normal">Show code minimap</span>
              </Label>
              <Switch
                id="minimap"
                checked={settings.minimap}
                onCheckedChange={(checked) => updateSetting("minimap", checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="lineNumbers" className="flex flex-col gap-1">
                <span>Line Numbers</span>
                <span className="text-xs text-muted-foreground font-normal">Show line numbers</span>
              </Label>
              <Switch
                id="lineNumbers"
                checked={settings.lineNumbers}
                onCheckedChange={(checked) => updateSetting("lineNumbers", checked)}
              />
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
