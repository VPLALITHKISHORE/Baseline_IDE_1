"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { MonacoEditor } from "./monaco-editor"
import { FileExplorer } from "./file-explorer"
import { Header } from "./header"
import { CompatibilitySidebar } from "./compatibility-sidebar"
import { DashboardPanel } from "./dashboard-panel"
import { CodeQualityPanel } from "./code-quality-panel"
import { BrowserMatrix } from "./browser-matrix"
import { FeatureExplorer } from "./feature-explorer"
import { SmartSuggestions } from "./smart-suggestions"
import { CodeSnippets } from "./code-snippets"
import { CommandPalette } from "./command-palette"
import { SettingsDialog, type EditorSettings } from "./settings-dialog"
import { ShortcutsDialog } from "./shortcuts-dialog"
import { Code2, FileCode, Lightbulb, FileText, LayoutDashboard, Activity, Globe, SearchIcon } from "lucide-react"
import { detectFeatures, type DetectedFeature } from "@/lib/feature-detector"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import { StatusBar } from "./status-bar"

export interface FileNode {
  name: string
  path: string
  type: "file" | "folder"
  content?: string
  children?: FileNode[]
}

const initialFiles: FileNode[] = [
  {
    name: "src",
    path: "src",
    type: "folder",
    children: [
      {
        name: "index.html",
        path: "src/index.html",
        type: "file",
        content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Baseline IDE Demo</title>
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  <div class="container">
    <h1>Welcome to Baseline IDE</h1>
    <p>Start editing to see real-time Baseline compatibility checks!</p>
  </div>
  <script src="app.js"></script>
</body>
</html>`,
      },
      {
        name: "styles.css",
        path: "src/styles.css",
        type: "file",
        content: `.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
  
  /* Modern CSS features */
  container-type: inline-size;
  content-visibility: auto;
}

h1 {
  font-size: clamp(2rem, 5vw, 3rem);
  background: linear-gradient(45deg, #667eea 0%, #764ba2 100%);
  background-clip: text;
  -webkit-background-clip: text;
  color: transparent;
}

@container (min-width: 700px) {
  .container {
    padding: 4rem;
  }
}`,
      },
      {
        name: "app.js",
        path: "src/app.js",
        type: "file",
        content: `// Modern JavaScript features
const pattern = new URLPattern({ pathname: '/books/:id' });

// Using optional chaining and nullish coalescing
const config = {
  theme: 'dark',
  features: {
    autoSave: true
  }
};

const autoSave = config?.features?.autoSave ?? false;

// Async function instead of top-level await
async function loadData() {
  const data = await fetch('/api/data').then(r => r.json());
  console.log('Data loaded:', data);
}

console.log('App initialized with Baseline-compatible features!');`,
      },
    ],
  },
]

export function IDELayout() {
  const [files, setFiles] = useState<FileNode[]>(initialFiles)
  const [activeFile, setActiveFile] = useState<FileNode | null>(initialFiles[0].children?.[0] || null)
  const [detectedFeatures, setDetectedFeatures] = useState<DetectedFeature[]>([])
  const [activeTab, setActiveTab] = useState("editor")
  const [cursorPosition, setCursorPosition] = useState({ line: 1, column: 1 })

  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [shortcutsOpen, setShortcutsOpen] = useState(false)
  const [settings, setSettings] = useState<EditorSettings>({
    autoSave: true,
    fontSize: 14,
    tabSize: 2,
    wordWrap: true,
    minimap: true,
    lineNumbers: true,
    theme: "vs-dark",
  })

  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Command palette: Ctrl/Cmd + K
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault()
        setCommandPaletteOpen(true)
      }
      // Settings: Ctrl/Cmd + ,
      if ((e.ctrlKey || e.metaKey) && e.key === ",") {
        e.preventDefault()
        setSettingsOpen(true)
      }
      // Shortcuts: Ctrl/Cmd + ?
      if ((e.ctrlKey || e.metaKey) && e.key === "/") {
        e.preventDefault()
        setShortcutsOpen(true)
      }
      // Tab shortcuts: Ctrl/Cmd + 1-4
      if ((e.ctrlKey || e.metaKey) && ["1", "2", "3", "4"].includes(e.key)) {
        e.preventDefault()
        const tabs = ["editor", "suggestions", "snippets", "dashboard"]
        setActiveTab(tabs[Number.parseInt(e.key) - 1])
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])

  const handleContentChange = async (value: string, position: { line: number; column: number }) => {
    try {
      if (activeFile) {
        activeFile.content = value

        const getLanguage = (filename: string) => {
          if (filename.endsWith(".css")) return "css"
          if (filename.endsWith(".js")) return "javascript"
          if (filename.endsWith(".ts")) return "typescript"
          return "unknown"
        }

        const language = getLanguage(activeFile.name)
        const features = await detectFeatures(value, language)
        setDetectedFeatures(features)
        setCursorPosition(position)
      }
    } catch (error) {
      console.error("[v0] IDE Layout: Error in handleContentChange:", error)
    }
  }

  const handleFileSelect = async (file: FileNode) => {
    try {
      setActiveFile(file)

      if (file.content) {
        const getLanguage = (filename: string) => {
          if (filename.endsWith(".css")) return "css"
          if (filename.endsWith(".js")) return "javascript"
          if (filename.endsWith(".ts")) return "typescript"
          return "unknown"
        }

        const language = getLanguage(file.name)
        const features = await detectFeatures(file.content, language)
        setDetectedFeatures(features)
      } else {
        setDetectedFeatures([])
      }
    } catch (error) {
      console.error("[v0] IDE Layout: Error in handleFileSelect:", error)
    }
  }

  const handleImportFile = () => {
    fileInputRef.current?.click()
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const content = event.target?.result as string
      const newFile: FileNode = {
        name: file.name,
        path: `src/${file.name}`,
        type: "file",
        content,
      }

      setFiles((prev) => {
        const newFiles = [...prev]
        const srcFolder = newFiles.find((f) => f.name === "src")
        if (srcFolder && srcFolder.children) {
          srcFolder.children.push(newFile)
        }
        return newFiles
      })

      setActiveFile(newFile)
      toast({
        title: "File imported",
        description: `${file.name} has been added to your project`,
      })
    }
    reader.readAsText(file)
  }

  const handleExportProject = () => {
    const exportData: any = {}

    const collectFiles = (nodes: FileNode[], path = "") => {
      nodes.forEach((node) => {
        if (node.type === "file" && node.content) {
          exportData[node.path] = node.content
        } else if (node.type === "folder" && node.children) {
          collectFiles(node.children, node.path)
        }
      })
    }

    collectFiles(files)

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "baseline-ide-project.json"
    a.click()
    URL.revokeObjectURL(url)

    toast({
      title: "Project exported",
      description: "Your project has been downloaded as JSON",
    })
  }

  const handleCommand = (commandId: string) => {
    switch (commandId) {
      case "import-file":
        handleImportFile()
        break
      case "export-project":
        handleExportProject()
        break
      case "show-editor":
        setActiveTab("editor")
        break
      case "show-suggestions":
        setActiveTab("suggestions")
        break
      case "show-snippets":
        setActiveTab("snippets")
        break
      case "show-dashboard":
        setActiveTab("dashboard")
        break
      case "show-quality":
        setActiveTab("quality")
        break
      case "show-browsers":
        setActiveTab("browsers")
        break
      case "show-explorer":
        setActiveTab("explorer")
        break
      case "settings":
        setSettingsOpen(true)
        break
      case "shortcuts":
        setShortcutsOpen(true)
        break
    }
  }

  const handleFileCreate = (name: string, parentPath?: string) => {
    const newFile: FileNode = {
      name,
      path: parentPath ? `${parentPath}/${name}` : name,
      type: "file",
      content: "",
    }

    setFiles((prev) => {
      const newFiles = [...prev]
      if (parentPath) {
        const addToFolder = (nodes: FileNode[]): boolean => {
          for (const node of nodes) {
            if (node.path === parentPath && node.type === "folder") {
              if (!node.children) node.children = []
              node.children.push(newFile)
              return true
            }
            if (node.children && addToFolder(node.children)) {
              return true
            }
          }
          return false
        }
        addToFolder(newFiles)
      } else {
        newFiles.push(newFile)
      }
      return newFiles
    })

    setActiveFile(newFile)
    toast({
      title: "File created",
      description: `${name} has been created`,
    })
  }

  const handleFileRename = (file: FileNode, newName: string) => {
    const oldPath = file.path
    const newPath = file.path.replace(file.name, newName)

    setFiles((prev) => {
      const renameInTree = (nodes: FileNode[]): FileNode[] => {
        return nodes.map((node) => {
          if (node.path === oldPath) {
            return { ...node, name: newName, path: newPath }
          }
          if (node.children) {
            return { ...node, children: renameInTree(node.children) }
          }
          return node
        })
      }
      return renameInTree(prev)
    })

    if (activeFile?.path === oldPath) {
      setActiveFile({ ...file, name: newName, path: newPath })
    }

    toast({
      title: "File renamed",
      description: `Renamed to ${newName}`,
    })
  }

  const handleFileDelete = (file: FileNode) => {
    setFiles((prev) => {
      const deleteFromTree = (nodes: FileNode[]): FileNode[] => {
        return nodes.filter((node) => {
          if (node.path === file.path) {
            return false
          }
          if (node.children) {
            node.children = deleteFromTree(node.children)
          }
          return true
        })
      }
      return deleteFromTree(prev)
    })

    if (activeFile?.path === file.path) {
      setActiveFile(null)
    }

    toast({
      title: "File deleted",
      description: `${file.name} has been deleted`,
    })
  }

  const handleFileDuplicate = (file: FileNode) => {
    const nameParts = file.name.split(".")
    const ext = nameParts.pop()
    const baseName = nameParts.join(".")
    const newName = `${baseName}-copy.${ext}`

    const newFile: FileNode = {
      ...file,
      name: newName,
      path: file.path.replace(file.name, newName),
    }

    setFiles((prev) => {
      const newFiles = [...prev]
      const parentPath = file.path.substring(0, file.path.lastIndexOf("/"))

      const addToFolder = (nodes: FileNode[]): boolean => {
        for (const node of nodes) {
          if (node.path === parentPath && node.type === "folder") {
            if (!node.children) node.children = []
            node.children.push(newFile)
            return true
          }
          if (node.children && addToFolder(node.children)) {
            return true
          }
        }
        return false
      }

      if (parentPath) {
        addToFolder(newFiles)
      } else {
        newFiles.push(newFile)
      }

      return newFiles
    })

    toast({
      title: "File duplicated",
      description: `Created ${newName}`,
    })
  }

  const handleFolderCreate = (name: string, parentPath?: string) => {
    const newFolder: FileNode = {
      name,
      path: parentPath ? `${parentPath}/${name}` : name,
      type: "folder",
      children: [],
    }

    setFiles((prev) => {
      const newFiles = [...prev]
      if (parentPath) {
        const addToFolder = (nodes: FileNode[]): boolean => {
          for (const node of nodes) {
            if (node.path === parentPath && node.type === "folder") {
              if (!node.children) node.children = []
              node.children.push(newFolder)
              return true
            }
            if (node.children && addToFolder(node.children)) {
              return true
            }
          }
          return false
        }
        addToFolder(newFiles)
      } else {
        newFiles.push(newFolder)
      }
      return newFiles
    })

    toast({
      title: "Folder created",
      description: `${name} has been created`,
    })
  }

  return (
    <div className="flex h-screen flex-col bg-background">
      <Header
        onCommandPalette={() => setCommandPaletteOpen(true)}
        onSettings={() => setSettingsOpen(true)}
        onShortcuts={() => setShortcutsOpen(true)}
        onImport={handleImportFile}
        onExport={handleExportProject}
      />

      <input
        ref={fileInputRef}
        type="file"
        accept=".html,.css,.js,.ts,.tsx,.jsx"
        onChange={handleFileInputChange}
        className="hidden"
      />

      <div className="flex flex-1 overflow-hidden">
        {/* File Explorer Sidebar */}
        <aside className="w-64 border-r border-border bg-card">
          <div className="flex h-12 items-center gap-2 border-b border-border px-4">
            <FileCode className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Explorer</span>
          </div>
          <FileExplorer
            files={files}
            activeFile={activeFile}
            onFileSelect={handleFileSelect}
            onFileCreate={handleFileCreate}
            onFileRename={handleFileRename}
            onFileDelete={handleFileDelete}
            onFileDuplicate={handleFileDuplicate}
            onFolderCreate={handleFolderCreate}
          />
        </aside>

        {/* Main Editor Area */}
        <main className="flex flex-1 flex-col overflow-hidden min-w-0">
          {activeFile ? (
            <>
              {/* File Tab */}
              <div className="flex h-12 items-center gap-2 border-b border-border bg-card px-4 flex-shrink-0">
                <Code2 className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{activeFile.name}</span>
              </div>

              {/* Tabs for editor, dashboard, code quality, browser matrix, and feature explorer */}
              <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
                <TabsList className="w-full justify-start rounded-none border-b bg-transparent h-10 px-4 flex-shrink-0">
                  <TabsTrigger value="editor" className="gap-2">
                    <Code2 className="h-4 w-4" />
                    Editor
                  </TabsTrigger>
                  <TabsTrigger value="suggestions" className="gap-2">
                    <Lightbulb className="h-4 w-4" />
                    Suggestions
                  </TabsTrigger>
                  <TabsTrigger value="snippets" className="gap-2">
                    <FileText className="h-4 w-4" />
                    Snippets
                  </TabsTrigger>
                  <TabsTrigger value="dashboard" className="gap-2">
                    <LayoutDashboard className="h-4 w-4" />
                    Dashboard
                  </TabsTrigger>
                  <TabsTrigger value="quality" className="gap-2">
                    <Activity className="h-4 w-4" />
                    Code Quality
                  </TabsTrigger>
                  <TabsTrigger value="browsers" className="gap-2">
                    <Globe className="h-4 w-4" />
                    Browser Matrix
                  </TabsTrigger>
                  <TabsTrigger value="explorer" className="gap-2">
                    <SearchIcon className="h-4 w-4" />
                    Feature Explorer
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="editor" className="flex-1 m-0 p-0 overflow-hidden min-h-0">
                  <MonacoEditor file={activeFile} onChange={handleContentChange} settings={settings} />
                </TabsContent>

                <TabsContent value="suggestions" className="flex-1 m-0 p-0 overflow-y-auto min-h-0">
                  <SmartSuggestions features={detectedFeatures} />
                </TabsContent>

                <TabsContent value="snippets" className="flex-1 m-0 p-0 overflow-y-auto min-h-0">
                  <CodeSnippets />
                </TabsContent>

                <TabsContent value="dashboard" className="flex-1 m-0 p-0 overflow-y-auto min-h-0">
                  <DashboardPanel features={detectedFeatures} />
                </TabsContent>

                <TabsContent value="quality" className="flex-1 m-0 p-0 overflow-y-auto min-h-0">
                  <CodeQualityPanel
                    features={detectedFeatures}
                    code={activeFile.content || ""}
                    language={activeFile.name.endsWith(".css") ? "css" : "javascript"}
                  />
                </TabsContent>

                <TabsContent value="browsers" className="flex-1 m-0 p-0 overflow-y-auto min-h-0">
                  <BrowserMatrix features={detectedFeatures} />
                </TabsContent>

                <TabsContent value="explorer" className="flex-1 m-0 p-0 overflow-y-auto min-h-0">
                  <FeatureExplorer />
                </TabsContent>
              </Tabs>
            </>
          ) : (
            <div className="flex flex-1 items-center justify-center text-muted-foreground">
              <div className="text-center">
                <Code2 className="mx-auto h-12 w-12 mb-4 opacity-50" />
                <p>Select a file to start editing</p>
              </div>
            </div>
          )}
        </main>

        {/* Compatibility Sidebar */}
        <CompatibilitySidebar features={detectedFeatures} activeFile={activeFile} />
      </div>

      <StatusBar activeFile={activeFile} features={detectedFeatures} cursorPosition={cursorPosition} />

      <CommandPalette open={commandPaletteOpen} onOpenChange={setCommandPaletteOpen} onCommand={handleCommand} />
      <SettingsDialog
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        settings={settings}
        onSettingsChange={setSettings}
      />
      <ShortcutsDialog open={shortcutsOpen} onOpenChange={setShortcutsOpen} />
    </div>
  )
}
