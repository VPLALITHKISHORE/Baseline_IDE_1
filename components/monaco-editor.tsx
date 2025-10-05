"use client"

import { useEffect, useRef, useState } from "react"
import type { FileNode } from "./ide-layout"
import type { EditorSettings } from "./settings-dialog"
import { detectFeatures, getFeatureHoverContent } from "@/lib/feature-detector"
import { loadMonaco } from "@/lib/monaco-loader"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, AlertTriangle, XCircle, Info } from "lucide-react"

interface MonacoEditorProps {
  file: FileNode
  onChange: (value: string, position: { line: number; column: number }) => void
  settings: EditorSettings
}

export function MonacoEditor({ file, onChange, settings }: MonacoEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null)
  const monacoRef = useRef<any>(null)
  const editorInstanceRef = useRef<any>(null)
  const hoverProviderRef = useRef<any>(null)
  const decorationsRef = useRef<string[]>([])
  const [detectedFeatures, setDetectedFeatures] = useState<any[]>([])

  useEffect(() => {
    if (editorInstanceRef.current) {
      editorInstanceRef.current.updateOptions({
        fontSize: settings.fontSize,
        tabSize: settings.tabSize,
        wordWrap: settings.wordWrap ? "on" : "off",
        minimap: { enabled: settings.minimap },
        lineNumbers: settings.lineNumbers ? "on" : "off",
      })

      if (monacoRef.current) {
        monacoRef.current.editor.setTheme(settings.theme)
      }
    }
  }, [settings])

  useEffect(() => {
    const initEditor = async () => {
      if (!editorRef.current) return

      try {
        monacoRef.current = await loadMonaco()

        if (editorInstanceRef.current) {
          editorInstanceRef.current.dispose()
        }

        const getLanguage = (filename: string) => {
          if (filename.endsWith(".html")) return "html"
          if (filename.endsWith(".css")) return "css"
          if (filename.endsWith(".js")) return "javascript"
          if (filename.endsWith(".ts")) return "typescript"
          if (filename.endsWith(".json")) return "json"
          return "plaintext"
        }

        const language = getLanguage(file.name)

        editorInstanceRef.current = monacoRef.current.editor.create(editorRef.current, {
          value: file.content || "",
          language: language,
          theme: settings.theme,
          automaticLayout: true,
          fontSize: settings.fontSize,
          lineNumbers: settings.lineNumbers ? "on" : "off",
          minimap: { enabled: settings.minimap },
          scrollBeyondLastLine: false,
          wordWrap: settings.wordWrap ? "on" : "off",
          tabSize: settings.tabSize,
          glyphMargin: true,
        })

        editorInstanceRef.current.onDidChangeModelContent(() => {
          const value = editorInstanceRef.current.getValue()
          const position = editorInstanceRef.current.getPosition()
          onChange(value, { line: position.lineNumber, column: position.column })
          updateDecorations(language)
        })

        editorInstanceRef.current.onDidChangeCursorPosition((e: any) => {
          const position = e.position
          onChange(editorInstanceRef.current.getValue(), { line: position.lineNumber, column: position.column })
        })

        registerHoverProvider(language)
        await updateDecorations(language)
      } catch (error) {
        console.error("[v0] Monaco Editor: Error initializing:", error)
      }
    }

    const updateDecorations = async (language: string) => {
      if (!editorInstanceRef.current || !monacoRef.current) return

      try {
        const code = editorInstanceRef.current.getValue()
        const features = await detectFeatures(code, language)
        setDetectedFeatures(features)

        const newDecorations = features.map((feature) => {
          const className =
            feature.status === "widely_available"
              ? "baseline-feature-safe"
              : feature.status === "newly_available"
                ? "baseline-feature-new"
                : "baseline-feature-limited"

          return {
            range: new monacoRef.current.Range(feature.line, 1, feature.line, 1000),
            options: {
              isWholeLine: false,
              className: className,
              glyphMarginClassName: `baseline-glyph-${feature.status}`,
              inlineClassName: className,
            },
          }
        })

        decorationsRef.current = editorInstanceRef.current.deltaDecorations(decorationsRef.current, newDecorations)
      } catch (error) {
        console.error("[v0] Monaco Editor: Error updating decorations:", error)
      }
    }

    const registerHoverProvider = (language: string) => {
      if (!monacoRef.current || !editorInstanceRef.current) return

      try {
        if (hoverProviderRef.current) {
          hoverProviderRef.current.dispose()
        }

        if (language !== "css" && language !== "javascript" && language !== "typescript") {
          return
        }

        hoverProviderRef.current = monacoRef.current.languages.registerHoverProvider(language, {
          provideHover: async (model: any, position: any) => {
            try {
              const code = model.getValue()
              const line = position.lineNumber

              const features = await detectFeatures(code, language)
              const feature = features.find((f) => f.line === line)

              if (feature) {
                const hoverContent = getFeatureHoverContent(feature)

                return {
                  range: new monacoRef.current.Range(line, 1, line, model.getLineMaxColumn(line)),
                  contents: [
                    {
                      value: hoverContent,
                      isTrusted: true,
                      supportHtml: true,
                    },
                  ],
                }
              }

              return null
            } catch (error) {
              console.error("[v0] Monaco Editor: Error in hover provider:", error)
              return null
            }
          },
        })
      } catch (error) {
        console.error("[v0] Monaco Editor: Error registering hover provider:", error)
      }
    }

    initEditor()

    return () => {
      if (editorInstanceRef.current) {
        editorInstanceRef.current.dispose()
      }
      if (hoverProviderRef.current) {
        hoverProviderRef.current.dispose()
      }
    }
  }, [])

  useEffect(() => {
    if (editorInstanceRef.current && monacoRef.current) {
      try {
        const currentValue = editorInstanceRef.current.getValue()
        if (currentValue !== file.content) {
          editorInstanceRef.current.setValue(file.content || "")

          const getLanguage = (filename: string) => {
            if (filename.endsWith(".html")) return "html"
            if (filename.endsWith(".css")) return "css"
            if (filename.endsWith(".js")) return "javascript"
            if (filename.endsWith(".ts")) return "typescript"
            if (filename.endsWith(".json")) return "json"
            return "plaintext"
          }

          const language = getLanguage(file.name)
          const model = editorInstanceRef.current.getModel()
          if (model) {
            monacoRef.current.editor.setModelLanguage(model, language)
          }

          if (hoverProviderRef.current) {
            hoverProviderRef.current.dispose()
          }
          if (language === "css" || language === "javascript" || language === "typescript") {
            hoverProviderRef.current = monacoRef.current.languages.registerHoverProvider(language, {
              provideHover: async (model: any, position: any) => {
                try {
                  const code = model.getValue()
                  const line = position.lineNumber

                  const features = await detectFeatures(code, language)
                  const feature = features.find((f) => f.line === line)

                  if (feature) {
                    const hoverContent = getFeatureHoverContent(feature)

                    return {
                      range: new monacoRef.current.Range(line, 1, line, model.getLineMaxColumn(line)),
                      contents: [
                        {
                          value: hoverContent,
                          isTrusted: true,
                          supportHtml: true,
                        },
                      ],
                    }
                  }

                  return null
                } catch (error) {
                  console.error("[v0] Monaco Editor: Error in hover provider (file change):", error)
                  return null
                }
              },
            })
          }

          const updateDecorations = async (language: string) => {
            if (!editorInstanceRef.current || !monacoRef.current) return

            try {
              const code = editorInstanceRef.current.getValue()
              const features = await detectFeatures(code, language)
              setDetectedFeatures(features)

              const newDecorations = features.map((feature) => {
                const className =
                  feature.status === "widely_available"
                    ? "baseline-feature-safe"
                    : feature.status === "newly_available"
                      ? "baseline-feature-new"
                      : "baseline-feature-limited"

                return {
                  range: new monacoRef.current.Range(feature.line, 1, feature.line, 1000),
                  options: {
                    isWholeLine: false,
                    className: className,
                    glyphMarginClassName: `baseline-glyph-${feature.status}`,
                    inlineClassName: className,
                  },
                }
              })

              decorationsRef.current = editorInstanceRef.current.deltaDecorations(
                decorationsRef.current,
                newDecorations,
              )
            } catch (error) {
              console.error("[v0] Monaco Editor: Error updating decorations (file change):", error)
            }
          }

          updateDecorations(language)
        }
      } catch (error) {
        console.error("[v0] Monaco Editor: Error in file change effect:", error)
      }
    }
  }, [file])

  const featureCounts = {
    safe: detectedFeatures.filter((f) => f.status === "widely_available").length,
    new: detectedFeatures.filter((f) => f.status === "newly_available").length,
    limited: detectedFeatures.filter((f) => f.status === "limited_availability").length,
  }

  return (
    <div className="h-full w-full flex flex-col">
      <div className="bg-muted/30 border-b border-border p-3 space-y-2 flex-shrink-0">
        {/* Feature Legend */}
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <Info className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="font-medium text-muted-foreground">Feature Status:</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
            <span className="text-muted-foreground">Widely Available</span>
            <Badge
              variant="secondary"
              className="ml-1 h-5 px-1.5 text-xs bg-green-600/10 text-green-600 border-green-600/20"
            >
              {featureCounts.safe}
            </Badge>
          </div>
          <div className="flex items-center gap-1.5">
            <AlertTriangle className="h-3.5 w-3.5 text-yellow-600" />
            <span className="text-muted-foreground">Newly Available</span>
            <Badge
              variant="secondary"
              className="ml-1 h-5 px-1.5 text-xs bg-yellow-600/10 text-yellow-600 border-yellow-600/20"
            >
              {featureCounts.new}
            </Badge>
          </div>
          <div className="flex items-center gap-1.5">
            <XCircle className="h-3.5 w-3.5 text-red-600" />
            <span className="text-muted-foreground">Limited Availability</span>
            <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs bg-red-600/10 text-red-600 border-red-600/20">
              {featureCounts.limited}
            </Badge>
          </div>
        </div>

        {/* Quick Summary */}
        {detectedFeatures.length > 0 && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="font-medium">Detected Features:</span>
            <span>
              {detectedFeatures.slice(0, 3).map((f, i) => (
                <span key={i}>
                  {f.feature}
                  {i < Math.min(2, detectedFeatures.length - 1) ? ", " : ""}
                </span>
              ))}
              {detectedFeatures.length > 3 && ` and ${detectedFeatures.length - 3} more`}
            </span>
          </div>
        )}
      </div>

      {/* Monaco Editor */}
      <div ref={editorRef} className="flex-1" />
    </div>
  )
}
