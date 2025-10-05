"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Lightbulb, Copy, ExternalLink, Code, Sparkles } from "lucide-react"
import type { DetectedFeature } from "@/lib/feature-detector"
import { useState } from "react"

interface Suggestion {
  feature: string
  type: "polyfill" | "alternative" | "progressive-enhancement" | "best-practice"
  title: string
  description: string
  code?: string
  links?: Array<{ label: string; url: string }>
}

interface SmartSuggestionsProps {
  features: DetectedFeature[]
}

export function SmartSuggestions({ features }: SmartSuggestionsProps) {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)
  const [copiedAll, setCopiedAll] = useState(false)

  const suggestions = generateSuggestions(features)

  const handleCopy = (code: string, index: number) => {
    navigator.clipboard.writeText(code)
    setCopiedIndex(index)
    setTimeout(() => setCopiedIndex(null), 2000)
  }

  const handleCopyAll = () => {
    const allCode = suggestions
      .filter((s) => s.code)
      .map((s) => `// ${s.title}\n${s.code}`)
      .join("\n\n")

    if (allCode) {
      navigator.clipboard.writeText(allCode)
      setCopiedAll(true)
      setTimeout(() => setCopiedAll(false), 2000)
    }
  }

  const getTypeColor = (type: Suggestion["type"]) => {
    switch (type) {
      case "polyfill":
        return "bg-blue-500/10 text-blue-500 border-blue-500/20"
      case "alternative":
        return "bg-purple-500/10 text-purple-500 border-purple-500/20"
      case "progressive-enhancement":
        return "bg-green-500/10 text-green-500 border-green-500/20"
      case "best-practice":
        return "bg-amber-500/10 text-amber-500 border-amber-500/20"
    }
  }

  const getTypeIcon = (type: Suggestion["type"]) => {
    switch (type) {
      case "polyfill":
        return <Code className="h-4 w-4" />
      case "alternative":
        return <Sparkles className="h-4 w-4" />
      case "progressive-enhancement":
        return <Lightbulb className="h-4 w-4" />
      case "best-practice":
        return <Lightbulb className="h-4 w-4" />
    }
  }

  if (suggestions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8">
        <Lightbulb className="h-12 w-12 text-green-500 mb-4" />
        <h3 className="text-lg font-semibold mb-2">All Clear!</h3>
        <p className="text-sm text-muted-foreground max-w-md">
          Your code uses widely available features. No suggestions at this time.
        </p>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between gap-2 mb-6">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-semibold">Smart Suggestions</h2>
          <Badge variant="secondary">{suggestions.length}</Badge>
        </div>
        {suggestions.some((s) => s.code) && (
          <Button size="sm" variant="outline" onClick={handleCopyAll}>
            {copiedAll ? (
              <>
                <span className="text-green-500">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="h-4 w-4 mr-2" />
                Copy All
              </>
            )}
          </Button>
        )}
      </div>

      <div className="space-y-4">
        {suggestions.map((suggestion, index) => (
          <Card key={index} className="p-4 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3 flex-1">
                <div className="mt-0.5">{getTypeIcon(suggestion.type)}</div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold">{suggestion.title}</h3>
                    <Badge variant="outline" className={getTypeColor(suggestion.type)}>
                      {suggestion.type.replace("-", " ")}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{suggestion.description}</p>
                </div>
              </div>
            </div>

            {suggestion.code && (
              <div className="relative">
                <pre className="bg-muted p-3 rounded-md text-xs overflow-x-auto">
                  <code>{suggestion.code}</code>
                </pre>
                <Button
                  size="sm"
                  variant="ghost"
                  className="absolute top-2 right-2 h-7 px-2"
                  onClick={() => handleCopy(suggestion.code!, index)}
                >
                  {copiedIndex === index ? (
                    <span className="text-xs text-green-500">Copied!</span>
                  ) : (
                    <>
                      <Copy className="h-3 w-3 mr-1" />
                      <span className="text-xs">Copy</span>
                    </>
                  )}
                </Button>
              </div>
            )}

            {suggestion.links && suggestion.links.length > 0 && (
              <div className="flex gap-2 flex-wrap">
                {suggestion.links.map((link, linkIndex) => (
                  <Button key={linkIndex} size="sm" variant="outline" asChild>
                    <a href={link.url} target="_blank" rel="noopener noreferrer" className="gap-1">
                      {link.label}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </Button>
                ))}
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  )
}

function generateSuggestions(features: DetectedFeature[]): Suggestion[] {
  const suggestions: Suggestion[] = []

  features.forEach((feature) => {
    // URLPattern polyfill
    if (feature.name.toLowerCase().includes("urlpattern") && feature.status !== "widely_available") {
      suggestions.push({
        feature: feature.name,
        type: "polyfill",
        title: "Add URLPattern Polyfill",
        description: "URLPattern has limited browser support. Use a polyfill for broader compatibility.",
        code: `// Install: npm install urlpattern-polyfill
import 'urlpattern-polyfill';

const pattern = new URLPattern({ pathname: '/books/:id' });
const match = pattern.exec('https://example.com/books/123');
console.log(match.pathname.groups.id); // "123"`,
        links: [
          { label: "NPM Package", url: "https://www.npmjs.com/package/urlpattern-polyfill" },
          { label: "MDN Docs", url: "https://developer.mozilla.org/en-US/docs/Web/API/URLPattern" },
        ],
      })
    }

    // Container Queries progressive enhancement
    if (feature.name.toLowerCase().includes("container") && feature.status === "newly_available") {
      suggestions.push({
        feature: feature.name,
        type: "progressive-enhancement",
        title: "Progressive Enhancement for Container Queries",
        description: "Use @supports to provide fallbacks for browsers without container query support.",
        code: `/* Fallback for older browsers */
.card {
  padding: 1rem;
}

/* Enhanced layout with container queries */
@supports (container-type: inline-size) {
  .container {
    container-type: inline-size;
  }
  
  @container (min-width: 700px) {
    .card {
      padding: 2rem;
      display: grid;
      grid-template-columns: 1fr 2fr;
    }
  }
}`,
        links: [{ label: "Learn More", url: "https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_container_queries" }],
      })
    }

    // content-visibility optimization
    if (feature.name.toLowerCase().includes("content-visibility")) {
      suggestions.push({
        feature: feature.name,
        type: "best-practice",
        title: "Optimize content-visibility Usage",
        description:
          "Use content-visibility with contain-intrinsic-size to prevent layout shifts and improve performance.",
        code: `.lazy-content {
  content-visibility: auto;
  /* Provide estimated size to prevent layout shift */
  contain-intrinsic-size: auto 500px;
}`,
        links: [
          {
            label: "Performance Guide",
            url: "https://web.dev/articles/content-visibility",
          },
        ],
      })
    }

    // Optional chaining best practice
    if (feature.name.toLowerCase().includes("optional chaining")) {
      suggestions.push({
        feature: feature.name,
        type: "best-practice",
        title: "Optional Chaining Best Practices",
        description: "Combine optional chaining with nullish coalescing for robust default values.",
        code: `// Good: Combine with nullish coalescing
const value = config?.settings?.theme ?? 'light';

// Avoid: Deep chaining without defaults
const value = config?.settings?.theme?.mode?.preference;

// Better: Provide sensible defaults
const value = config?.settings?.theme?.mode?.preference ?? 'auto';`,
        links: [
          {
            label: "MDN Guide",
            url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Optional_chaining",
          },
        ],
      })
    }

    // :has() selector alternative
    if (feature.name.toLowerCase().includes(":has") && feature.status !== "widely_available") {
      suggestions.push({
        feature: feature.name,
        type: "alternative",
        title: "Alternative to :has() Selector",
        description: "For older browsers, use JavaScript to add conditional classes instead of :has().",
        code: `// CSS with :has()
.card:has(img) {
  display: grid;
}

// JavaScript fallback
document.querySelectorAll('.card').forEach(card => {
  if (card.querySelector('img')) {
    card.classList.add('has-image');
  }
});

// CSS for fallback
.card.has-image {
  display: grid;
}`,
        links: [{ label: "Browser Support", url: "https://caniuse.com/css-has" }],
      })
    }

    // CSS Grid fallback
    if (feature.name.toLowerCase().includes("grid") && feature.status === "newly_available") {
      suggestions.push({
        feature: feature.name,
        type: "progressive-enhancement",
        title: "CSS Grid with Flexbox Fallback",
        description: "Provide a flexbox fallback for browsers with limited CSS Grid support.",
        code: `/* Flexbox fallback */
.container {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
}

.item {
  flex: 1 1 300px;
}

/* Grid enhancement */
@supports (display: grid) {
  .container {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  }
  
  .item {
    flex: none;
  }
}`,
        links: [{ label: "Grid Guide", url: "https://css-tricks.com/snippets/css/complete-guide-grid/" }],
      })
    }
  })

  // Add general suggestions based on feature mix
  const limitedFeatures = features.filter((f) => f.status === "limited_availability")
  const newlyAvailableFeatures = features.filter((f) => f.status === "newly_available")

  if (limitedFeatures.length > 2 && suggestions.length === 0) {
    suggestions.push({
      feature: "Multiple Limited Features",
      type: "best-practice",
      title: "Consider Your Browser Support Strategy",
      description:
        "You're using several features with limited availability. Define your browser support policy and test thoroughly.",
      code: `// Use @supports to detect feature support
if ('URLPattern' in window) {
  // Use modern API
} else {
  // Use fallback
}

// Or use feature detection libraries
import { supportsContainerQueries } from './feature-detection';`,
      links: [
        { label: "Baseline", url: "https://web.dev/baseline" },
        { label: "Browser Support", url: "https://caniuse.com" },
      ],
    })
  }

  if (newlyAvailableFeatures.length > 3) {
    suggestions.push({
      feature: "Newly Available Features",
      type: "best-practice",
      title: "Monitor Newly Available Features",
      description:
        "You're using several newly available features. Monitor browser usage analytics to ensure your users can access them.",
      links: [
        { label: "Web Platform Dashboard", url: "https://webstatus.dev" },
        { label: "Browser Stats", url: "https://gs.statcounter.com/" },
      ],
    })
  }

  return suggestions
}
