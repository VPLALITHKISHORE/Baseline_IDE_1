"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, Replace } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"

interface SearchDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSearch: (query: string, options: SearchOptions) => void
  onReplace: (find: string, replace: string, options: SearchOptions) => void
}

export interface SearchOptions {
  caseSensitive: boolean
  wholeWord: boolean
  regex: boolean
}

export function SearchDialog({ open, onOpenChange, onSearch, onReplace }: SearchDialogProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [replaceQuery, setReplaceQuery] = useState("")
  const [options, setOptions] = useState<SearchOptions>({
    caseSensitive: false,
    wholeWord: false,
    regex: false,
  })

  const handleSearch = () => {
    if (searchQuery) {
      onSearch(searchQuery, options)
    }
  }

  const handleReplace = () => {
    if (searchQuery) {
      onReplace(searchQuery, replaceQuery, options)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Search & Replace</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="search" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="search">Search</TabsTrigger>
            <TabsTrigger value="replace">Replace</TabsTrigger>
          </TabsList>

          <TabsContent value="search" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="search-input">Search for</Label>
              <div className="flex gap-2">
                <Input
                  id="search-input"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Enter search term..."
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                />
                <Button onClick={handleSearch} className="gap-2">
                  <Search className="h-4 w-4" />
                  Search
                </Button>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="case-sensitive"
                  checked={options.caseSensitive}
                  onCheckedChange={(checked) => setOptions({ ...options, caseSensitive: checked as boolean })}
                />
                <Label htmlFor="case-sensitive" className="text-sm font-normal cursor-pointer">
                  Case sensitive
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="whole-word"
                  checked={options.wholeWord}
                  onCheckedChange={(checked) => setOptions({ ...options, wholeWord: checked as boolean })}
                />
                <Label htmlFor="whole-word" className="text-sm font-normal cursor-pointer">
                  Match whole word
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="regex"
                  checked={options.regex}
                  onCheckedChange={(checked) => setOptions({ ...options, regex: checked as boolean })}
                />
                <Label htmlFor="regex" className="text-sm font-normal cursor-pointer">
                  Use regular expression
                </Label>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="replace" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="find-input">Find</Label>
              <Input
                id="find-input"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Enter text to find..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="replace-input">Replace with</Label>
              <Input
                id="replace-input"
                value={replaceQuery}
                onChange={(e) => setReplaceQuery(e.target.value)}
                placeholder="Enter replacement text..."
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="case-sensitive-replace"
                  checked={options.caseSensitive}
                  onCheckedChange={(checked) => setOptions({ ...options, caseSensitive: checked as boolean })}
                />
                <Label htmlFor="case-sensitive-replace" className="text-sm font-normal cursor-pointer">
                  Case sensitive
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="whole-word-replace"
                  checked={options.wholeWord}
                  onCheckedChange={(checked) => setOptions({ ...options, wholeWord: checked as boolean })}
                />
                <Label htmlFor="whole-word-replace" className="text-sm font-normal cursor-pointer">
                  Match whole word
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="regex-replace"
                  checked={options.regex}
                  onCheckedChange={(checked) => setOptions({ ...options, regex: checked as boolean })}
                />
                <Label htmlFor="regex-replace" className="text-sm font-normal cursor-pointer">
                  Use regular expression
                </Label>
              </div>
            </div>

            <Button onClick={handleReplace} className="w-full gap-2">
              <Replace className="h-4 w-4" />
              Replace All
            </Button>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
