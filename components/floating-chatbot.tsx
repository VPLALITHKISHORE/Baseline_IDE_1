"use client"

import { useState, useRef, useEffect } from "react"
import { MessageSquare, X, Send, Minimize2, Trash2, Copy, Check, ArrowDown, Sparkles, Bot, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
  compatibilityData?: any[]
}

export function FloatingChatbot() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [autoScroll, setAutoScroll] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const handleScroll = () => {
    if (!scrollContainerRef.current) return
    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 100
    setAutoScroll(isNearBottom)
  }

  useEffect(() => {
    if (autoScroll) {
      scrollToBottom()
    }
  }, [messages, autoScroll])

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus()
      setAutoScroll(true)
    }
  }, [isOpen])

  const handleSend = async () => {
    if (!input.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsLoading(true)
    setAutoScroll(true)

    try {
      const response = await fetch("/api/cerebras-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: input, history: messages }),
      })

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }

      const data = await response.json()

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.response,
        timestamp: new Date(),
        compatibilityData: data.compatibilityData,
      }

      setMessages((prev) => [...prev, assistantMessage])
    } catch (error) {
      console.error("Chat error:", error)
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "Sorry, I encountered an error. Please try again.",
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const clearChat = () => {
    setMessages([])
  }

  return (
    <>
      {/* Floating Chat Button */}
      {!isOpen && (
        <div className="fixed bottom-6 right-6 z-50">
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping" />
            <Button
              onClick={() => setIsOpen(true)}
              className="relative h-16 w-16 rounded-full shadow-2xl hover:shadow-primary/50 transition-all duration-300 hover:scale-110 bg-gradient-to-br from-primary to-primary/80"
              size="icon"
            >
              <MessageSquare className="h-7 w-7" />
            </Button>
          </div>
        </div>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 w-[440px] h-[650px] bg-background/95 backdrop-blur-xl border border-border/50 rounded-2xl shadow-2xl flex flex-col z-50 overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
          {/* Header */}
          <div className="relative flex items-center justify-between p-5 border-b border-border/50 bg-gradient-to-r from-card to-card/50 backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="h-2.5 w-2.5 bg-green-500 rounded-full animate-pulse" />
                <div className="absolute inset-0 h-2.5 w-2.5 bg-green-500 rounded-full animate-ping" />
              </div>
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary animate-pulse" />
                <span className="font-semibold text-sm bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                  AI Code Assistant
                </span>
              </div>
            </div>
            <div className="flex gap-1">
              {messages.length > 0 && (
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-9 w-9 hover:bg-destructive/10 hover:text-destructive transition-colors rounded-full" 
                  onClick={clearChat} 
                  title="Clear chat"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-9 w-9 hover:bg-muted transition-colors rounded-full" 
                onClick={() => setIsOpen(false)} 
                title="Minimize"
              >
                <Minimize2 className="h-4 w-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-9 w-9 hover:bg-destructive/10 hover:text-destructive transition-colors rounded-full" 
                onClick={() => { setMessages([]); setIsOpen(false) }} 
                title="Close"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Messages */}
          <div 
            ref={scrollContainerRef}
            onScroll={handleScroll}
            className="flex-1 overflow-y-auto p-5 bg-gradient-to-b from-background/50 to-background"
            style={{ scrollbarWidth: "thin" }}
          >
            <div className="space-y-5">
              {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center py-16 text-center animate-in fade-in duration-500">
                  <div className="relative mb-6">
                    <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full" />
                    <Bot className="relative h-16 w-16 text-primary drop-shadow-lg" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                    Hey! I'm your AI coding assistant
                  </h3>
                  <p className="text-sm text-muted-foreground mb-6 max-w-xs">
                    Ask me anything about code, browser compatibility, or web features!
                  </p>
                  <div className="flex flex-wrap gap-2 justify-center px-4">
                    <button 
                      onClick={() => setInput("Is CSS Container Queries baseline safe?")}
                      className="text-xs px-3 py-1.5 bg-muted hover:bg-muted/80 rounded-full transition-colors"
                    >
                      📦 Container Queries
                    </button>
                    <button 
                      onClick={() => setInput("What is content-visibility?")}
                      className="text-xs px-3 py-1.5 bg-muted hover:bg-muted/80 rounded-full transition-colors"
                    >
                      👁️ Content Visibility
                    </button>
                    <button 
                      onClick={() => setInput("How to use URLPattern?")}
                      className="text-xs px-3 py-1.5 bg-muted hover:bg-muted/80 rounded-full transition-colors"
                    >
                      🔗 URLPattern
                    </button>
                  </div>
                </div>
              )}

              {messages.map((message, index) => (
                <div 
                  key={message.id} 
                  className="animate-in slide-in-from-bottom-2 duration-300"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <MessageBubble message={message} />
                </div>
              ))}

              {isLoading && (
                <div className="flex justify-start animate-in slide-in-from-bottom-2">
                  <div className="flex items-center gap-3 bg-muted/50 backdrop-blur-sm rounded-2xl px-4 py-3 border border-border/50">
                    <Bot className="h-4 w-4 text-primary" />
                    <div className="flex gap-1.5">
                      <div className="h-2 w-2 bg-primary rounded-full animate-bounce" />
                      <div className="h-2 w-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "0.2s" }} />
                      <div className="h-2 w-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "0.4s" }} />
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Scroll to bottom button */}
          {!autoScroll && messages.length > 0 && (
            <div className="absolute bottom-28 right-6 z-10 animate-in slide-in-from-bottom-2">
              <Button
                size="icon"
                className="h-10 w-10 rounded-full shadow-lg bg-primary hover:bg-primary/90 transition-all duration-300 hover:scale-110"
                onClick={() => {
                  setAutoScroll(true)
                  scrollToBottom()
                }}
              >
                <ArrowDown className="h-4 w-4" />
              </Button>
            </div>
          )}

          {/* Input Area */}
          <div className="p-5 border-t border-border/50 bg-card/50 backdrop-blur-sm">
            <div className="flex gap-2 mb-3">
              <Input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault()
                    handleSend()
                  }
                }}
                placeholder="Type your message..."
                disabled={isLoading}
                className="flex-1 rounded-full px-4 bg-background/50 border-border/50 focus-visible:ring-primary/50 transition-all"
              />
              <Button 
                onClick={handleSend} 
                disabled={!input.trim() || isLoading} 
                size="icon"
                className="rounded-full h-10 w-10 bg-primary hover:bg-primary/90 transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:hover:scale-100"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <Sparkles className="h-3 w-3" />
              <span>Supported by Qwen3 480B Model</span>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

function MessageBubble({ message }: { message: Message }) {
  const [copied, setCopied] = useState(false)

  const formatContent = (content: string) => {
    const parts: React.ReactNode[] = []
    
    // Split content by code blocks first
    const codeBlockRegex = /``````/g
    const segments = content.split(codeBlockRegex)
    
    segments.forEach((segment, index) => {
      // Even indices are text, odd indices are code blocks
      if (index % 2 === 0) {
        // This is regular text, parse it for inline formatting
        const lines = segment.split('\n')
        let inList = false
        let listItems: React.ReactNode[] = []
        let listType: 'ul' | 'ol' | null = null
        
        lines.forEach((line, lineIndex) => {
          const trimmedLine = line.trim()
          
          // Check if it's a list item
          const isBullet = trimmedLine.startsWith('-') || trimmedLine.startsWith('*')
          const isNumbered = /^\d+\./.test(trimmedLine)
          
          if (isBullet || isNumbered) {
            const newListType = isBullet ? 'ul' : 'ol'
            
            // Start new list if needed
            if (!inList) {
              inList = true
              listType = newListType
              listItems = []
            } else if (listType !== newListType) {
              // Different list type, close previous and start new
              if (listItems.length > 0) {
                parts.push(
                  listType === 'ul' 
                    ? <ul key={`${index}-ul-${parts.length}`} className="list-disc space-y-1 mb-3 ml-5">{listItems}</ul>
                    : <ol key={`${index}-ol-${parts.length}`} className="list-decimal space-y-1 mb-3 ml-5">{listItems}</ol>
                )
              }
              listItems = []
              listType = newListType
            }
            
            // Add list item
            const content = isBullet 
              ? trimmedLine.replace(/^[-*]\s*/, '')
              : trimmedLine.replace(/^\d+\.\s*/, '')
              
            listItems.push(
              <li key={`${index}-li-${lineIndex}`} className="leading-relaxed">
                {formatInlineMarkdown(content)}
              </li>
            )
          } else {
            // Not a list item, close any open list
            if (inList && listItems.length > 0) {
              parts.push(
                listType === 'ul' 
                  ? <ul key={`${index}-ul-${parts.length}`} className="list-disc space-y-1 mb-3 ml-5">{listItems}</ul>
                  : <ol key={`${index}-ol-${parts.length}`} className="list-decimal space-y-1 mb-3 ml-5">{listItems}</ol>
              )
              listItems = []
              inList = false
              listType = null
            }
            
            // Handle headings
            if (trimmedLine.startsWith('###')) {
              parts.push(
                <h3 key={`${index}-h3-${lineIndex}`} className="text-sm font-bold mt-3 mb-2 leading-relaxed">
                  {formatInlineMarkdown(trimmedLine.replace(/^###\s*/, ''))}
                </h3>
              )
            } else if (trimmedLine.startsWith('##')) {
              parts.push(
                <h2 key={`${index}-h2-${lineIndex}`} className="text-base font-bold mt-3 mb-2 leading-relaxed">
                  {formatInlineMarkdown(trimmedLine.replace(/^##\s*/, ''))}
                </h2>
              )
            } else if (trimmedLine.startsWith('#')) {
              parts.push(
                <h1 key={`${index}-h1-${lineIndex}`} className="text-lg font-bold mt-3 mb-2 leading-relaxed">
                  {formatInlineMarkdown(trimmedLine.replace(/^#\s*/, ''))}
                </h1>
              )
            }
            // Regular paragraph
            else if (trimmedLine) {
              parts.push(
                <p key={`${index}-p-${lineIndex}`} className="mb-2 leading-relaxed">
                  {formatInlineMarkdown(trimmedLine)}
                </p>
              )
            }
            // Empty line
            else if (lineIndex > 0 && lines[lineIndex - 1]?.trim()) {
              parts.push(<div key={`${index}-space-${lineIndex}`} className="h-2" />)
            }
          }
        })
        
        // Close any remaining open list
        if (inList && listItems.length > 0) {
          parts.push(
            listType === 'ul' 
              ? <ul key={`${index}-ul-final`} className="list-disc space-y-1 mb-3 ml-5">{listItems}</ul>
              : <ol key={`${index}-ol-final`} className="list-decimal space-y-1 mb-3 ml-5">{listItems}</ol>
          )
        }
      } else {
        // This is a code block
        const lines = segment.split('\n')
        const language = lines[0].trim()
        const code = lines.slice(1).join('\n').trim()
        
        parts.push(<CodeBlock key={`code-${index}`} code={code} language={language} />)
      }
    })
    
    return parts
  }

  const formatInlineMarkdown = (text: string): React.ReactNode[] => {
    const parts: React.ReactNode[] = []
    let currentIndex = 0

    // Combined regex for inline code, bold, and italic
    const formatRegex = /(`[^`]+`)|(\*\*[^*]+\*\*)|(\*[^*]+\*)/g
    let match

    while ((match = formatRegex.exec(text)) !== null) {
      // Add text before the match
      if (match.index > currentIndex) {
        parts.push(text.substring(currentIndex, match.index))
      }

      // Inline code: `code`
      if (match[1]) {
        const code = match[1].slice(1, -1)
        parts.push(
          <code 
            key={`code-${parts.length}`} 
            className="bg-muted/70 px-2 py-0.5 rounded-md text-xs font-mono border border-border/30"
          >
            {code}
          </code>
        )
      }
      // Bold: **text**
      else if (match[2]) {
        const boldText = match[2].slice(2, -2)
        parts.push(
          <strong key={`bold-${parts.length}`} className="font-semibold text-foreground">
            {boldText}
          </strong>
        )
      }
      // Italic: *text*
      else if (match[3]) {
        const italicText = match[3].slice(1, -1)
        parts.push(
          <em key={`italic-${parts.length}`} className="italic">
            {italicText}
          </em>
        )
      }

      currentIndex = formatRegex.lastIndex
    }

    // Add remaining text
    if (currentIndex < text.length) {
      parts.push(text.substring(currentIndex))
    }

    return parts.length > 0 ? parts : [text]
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(message.content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className={`flex gap-3 ${message.role === "user" ? "justify-end" : "justify-start"}`}>
      {message.role === "assistant" && (
        <div className="flex-shrink-0 h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20">
          <Bot className="h-4 w-4 text-primary" />
        </div>
      )}

      <div className={`flex flex-col gap-2 max-w-[85%] ${message.role === "user" ? "items-end" : "items-start"}`}>
        <div
          className={`rounded-2xl px-4 py-3 shadow-sm ${
            message.role === "user"
              ? "bg-primary text-primary-foreground rounded-br-sm"
              : "bg-muted/70 backdrop-blur-sm text-foreground rounded-bl-sm border border-border/30"
          }`}
        >
          <div className="text-[13px] leading-relaxed break-words">
            {formatContent(message.content)}
          </div>

          {/* Compatibility Data */}
          {message.compatibilityData && Array.isArray(message.compatibilityData) && message.compatibilityData.length > 0 && (
            <div className="mt-3 space-y-2">
              {message.compatibilityData.map((feature: any, idx: number) => (
                <div key={idx} className="rounded-lg bg-background/50 border border-border/50 p-3 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-xs font-semibold">{feature.name}</span>
                    {feature.baseline && (
                      <CompatibilityBadge status={feature.baseline.status} />
                    )}
                  </div>

                  {feature.browser_implementations && (
                    <div className="grid grid-cols-2 gap-1.5 text-[10px]">
                      {Object.entries(feature.browser_implementations)
                        .filter(([browser]) => ['chrome', 'firefox', 'safari', 'edge'].includes(browser.replace(/_.*/, '')))
                        .slice(0, 4)
                        .map(([browser, info]: [string, any]) => (
                          <div key={browser} className="flex items-center gap-1.5">
                            <BrowserIcon browser={browser.replace(/_.*/, '')} />
                            <span className="text-muted-foreground capitalize">
                              {browser.replace(/_.*/, '')}: v{info.version}
                            </span>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 px-2">
          <span className="text-[10px] text-muted-foreground">
            {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>

          {message.role === "assistant" && (
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 hover:bg-muted rounded-full transition-colors"
              onClick={copyToClipboard}
            >
              {copied ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
            </Button>
          )}
        </div>
      </div>

      {message.role === "user" && (
        <div className="flex-shrink-0 h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center border border-primary/30">
          <User className="h-4 w-4 text-primary" />
        </div>
      )}
    </div>
  )
}

function CodeBlock({ code, language }: { code: string; language: string }) {
  const [copied, setCopied] = useState(false)

  const copyCode = () => {
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="my-3 rounded-xl overflow-hidden border border-zinc-700/50 shadow-lg bg-gradient-to-br from-zinc-900 to-zinc-950">
      <div className="flex items-center justify-between px-4 py-2.5 bg-zinc-800/80 backdrop-blur-sm border-b border-zinc-700/50">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <div className="h-2.5 w-2.5 rounded-full bg-red-500/80" />
            <div className="h-2.5 w-2.5 rounded-full bg-yellow-500/80" />
            <div className="h-2.5 w-2.5 rounded-full bg-green-500/80" />
          </div>
          <span className="text-xs font-mono text-zinc-400 ml-2">{language || 'code'}</span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-700/50 rounded-md transition-colors"
          onClick={copyCode}
        >
          {copied ? <Check className="h-3.5 w-3.5 text-green-400" /> : <Copy className="h-3.5 w-3.5" />}
        </Button>
      </div>
      <pre className="p-4 overflow-x-auto text-xs leading-relaxed" style={{ scrollbarWidth: "thin" }}>
        <code className="font-mono text-zinc-100">{code}</code>
      </pre>
    </div>
  )
}

function CompatibilityBadge({ status }: { status: string }) {
  const isWidely = status === "widely"
  
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
      isWidely 
        ? "bg-green-500/10 text-green-500 border border-green-500/20" 
        : "bg-yellow-500/10 text-yellow-500 border border-yellow-500/20"
    }`}>
      <span className={`h-1.5 w-1.5 rounded-full ${isWidely ? "bg-green-500" : "bg-yellow-500"} animate-pulse`} />
      {isWidely ? "Widely Available" : "Newly Available"}
    </span>
  )
}

function BrowserIcon({ browser }: { browser: string }) {
  const icons: Record<string, string> = {
    chrome: "🟢",
    firefox: "🟠", 
    safari: "🔵",
    edge: "🔷"
  }
  return <span className="text-base">{icons[browser] || "🌐"}</span>
}
