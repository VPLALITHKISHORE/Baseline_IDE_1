"use client"

import {
  ChevronRight,
  ChevronDown,
  File,
  Folder,
  Plus,
  Edit2,
  Trash2,
  Copy,
  FolderPlus,
  MoreVertical,
} from "lucide-react"
import { useState } from "react"
import type { FileNode } from "./ide-layout"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface FileExplorerProps {
  files: FileNode[]
  activeFile: FileNode | null
  onFileSelect: (file: FileNode) => void
  onFileCreate: (name: string, parentPath?: string) => void
  onFileRename: (file: FileNode, newName: string) => void
  onFileDelete: (file: FileNode) => void
  onFileDuplicate: (file: FileNode) => void
  onFolderCreate: (name: string, parentPath?: string) => void
}

export function FileExplorer({
  files,
  activeFile,
  onFileSelect,
  onFileCreate,
  onFileRename,
  onFileDelete,
  onFileDuplicate,
  onFolderCreate,
}: FileExplorerProps) {
  const [dialogState, setDialogState] = useState<{
    type: "create-file" | "create-folder" | "rename" | "delete" | null
    file?: FileNode
    parentPath?: string
  }>({ type: null })
  const [inputValue, setInputValue] = useState("")

  const handleDialogConfirm = () => {
    if (!inputValue.trim() && dialogState.type !== "delete") return

    switch (dialogState.type) {
      case "create-file":
        onFileCreate(inputValue, dialogState.parentPath)
        break
      case "create-folder":
        onFolderCreate(inputValue, dialogState.parentPath)
        break
      case "rename":
        if (dialogState.file) {
          onFileRename(dialogState.file, inputValue)
        }
        break
      case "delete":
        if (dialogState.file) {
          onFileDelete(dialogState.file)
        }
        break
    }

    setDialogState({ type: null })
    setInputValue("")
  }

  const openDialog = (
    type: "create-file" | "create-folder" | "rename" | "delete",
    file?: FileNode,
    parentPath?: string,
  ) => {
    setDialogState({ type, file, parentPath })
    if (type === "rename" && file) {
      setInputValue(file.name)
    } else {
      setInputValue("")
    }
  }

  return (
    <>
      <div className="py-2">
        <div className="flex items-center gap-1 px-2 pb-2 border-b border-border">
          <Button
            size="sm"
            variant="ghost"
            className="h-7 px-2 gap-1"
            onClick={() => openDialog("create-file", undefined, "src")}
          >
            <Plus className="h-3 w-3" />
            <span className="text-xs">File</span>
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-7 px-2 gap-1"
            onClick={() => openDialog("create-folder", undefined, "src")}
          >
            <FolderPlus className="h-3 w-3" />
            <span className="text-xs">Folder</span>
          </Button>
        </div>

        {files.map((file) => (
          <FileTreeItem
            key={file.path}
            file={file}
            activeFile={activeFile}
            onFileSelect={onFileSelect}
            onOpenDialog={openDialog}
            onFileDuplicate={onFileDuplicate}
            depth={0}
          />
        ))}
      </div>

      <Dialog open={dialogState.type !== null} onOpenChange={() => setDialogState({ type: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {dialogState.type === "create-file" && "Create New File"}
              {dialogState.type === "create-folder" && "Create New Folder"}
              {dialogState.type === "rename" && "Rename"}
              {dialogState.type === "delete" && "Delete"}
            </DialogTitle>
            <DialogDescription>
              {dialogState.type === "create-file" && "Enter a name for the new file"}
              {dialogState.type === "create-folder" && "Enter a name for the new folder"}
              {dialogState.type === "rename" && "Enter a new name"}
              {dialogState.type === "delete" && `Are you sure you want to delete "${dialogState.file?.name}"?`}
            </DialogDescription>
          </DialogHeader>

          {dialogState.type !== "delete" && (
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleDialogConfirm()
                    }
                  }}
                  placeholder={
                    dialogState.type === "create-file"
                      ? "example.js"
                      : dialogState.type === "create-folder"
                        ? "components"
                        : ""
                  }
                  autoFocus
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogState({ type: null })}>
              Cancel
            </Button>
            <Button onClick={handleDialogConfirm} variant={dialogState.type === "delete" ? "destructive" : "default"}>
              {dialogState.type === "delete" ? "Delete" : "Confirm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

interface FileTreeItemProps {
  file: FileNode
  activeFile: FileNode | null
  onFileSelect: (file: FileNode) => void
  onOpenDialog: (
    type: "create-file" | "create-folder" | "rename" | "delete",
    file?: FileNode,
    parentPath?: string,
  ) => void
  onFileDuplicate: (file: FileNode) => void
  depth: number
}

function FileTreeItem({ file, activeFile, onFileSelect, onOpenDialog, onFileDuplicate, depth }: FileTreeItemProps) {
  const [isOpen, setIsOpen] = useState(true)
  const isActive = activeFile?.path === file.path

  if (file.type === "folder") {
    return (
      <div>
        <div className="flex items-center group hover:bg-accent">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="flex flex-1 items-center gap-2 px-4 py-1.5 text-sm"
            style={{ paddingLeft: `${depth * 12 + 16}px` }}
          >
            {isOpen ? (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            )}
            <Folder className="h-4 w-4 text-muted-foreground" />
            <span>{file.name}</span>
          </button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                size="sm"
                variant="ghost"
                className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 mr-2"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreVertical className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onOpenDialog("create-file", undefined, file.path)}>
                <Plus className="h-4 w-4 mr-2" />
                New File
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onOpenDialog("create-folder", undefined, file.path)}>
                <FolderPlus className="h-4 w-4 mr-2" />
                New Folder
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onOpenDialog("rename", file)}>
                <Edit2 className="h-4 w-4 mr-2" />
                Rename
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onOpenDialog("delete", file)} className="text-destructive">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        {isOpen && file.children && (
          <div>
            {file.children.map((child) => (
              <FileTreeItem
                key={child.path}
                file={child}
                activeFile={activeFile}
                onFileSelect={onFileSelect}
                onOpenDialog={onOpenDialog}
                onFileDuplicate={onFileDuplicate}
                depth={depth + 1}
              />
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="flex items-center group hover:bg-accent">
      <button
        onClick={() => onFileSelect(file)}
        className={cn(
          "flex flex-1 items-center gap-2 px-4 py-1.5 text-sm",
          isActive && "bg-accent text-accent-foreground",
        )}
        style={{ paddingLeft: `${depth * 12 + 32}px` }}
      >
        <File className="h-4 w-4 text-muted-foreground" />
        <span>{file.name}</span>
      </button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            size="sm"
            variant="ghost"
            className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 mr-2"
            onClick={(e) => e.stopPropagation()}
          >
            <MoreVertical className="h-3 w-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => onOpenDialog("rename", file)}>
            <Edit2 className="h-4 w-4 mr-2" />
            Rename
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onFileDuplicate(file)}>
            <Copy className="h-4 w-4 mr-2" />
            Duplicate
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => onOpenDialog("delete", file)} className="text-destructive">
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
