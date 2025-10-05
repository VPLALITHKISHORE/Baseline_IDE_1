"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Copy, Search, CheckCircle2 } from "lucide-react"
import { useState } from "react"

interface CodeSnippet {
  id: string
  title: string
  description: string
  category: "css" | "javascript" | "html"
  baselineStatus: "widely" | "newly" | "safe"
  code: string
  tags: string[]
}

const SNIPPETS: CodeSnippet[] = [
  {
    id: "responsive-grid",
    title: "Responsive Grid Layout",
    description: "Modern CSS Grid with auto-fit and minmax for responsive layouts",
    category: "css",
    baselineStatus: "widely",
    code: `.grid-container {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  padding: 1rem;
}`,
    tags: ["layout", "responsive", "grid"],
  },
  {
    id: "flexbox-center",
    title: "Perfect Centering with Flexbox",
    description: "Center content both horizontally and vertically",
    category: "css",
    baselineStatus: "widely",
    code: `.center-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
}`,
    tags: ["layout", "flexbox", "centering"],
  },
  {
    id: "clamp-typography",
    title: "Fluid Typography with clamp()",
    description: "Responsive font sizes that scale smoothly between min and max values",
    category: "css",
    baselineStatus: "widely",
    code: `h1 {
  font-size: clamp(2rem, 5vw, 4rem);
}

p {
  font-size: clamp(1rem, 2.5vw, 1.25rem);
  line-height: 1.6;
}`,
    tags: ["typography", "responsive", "clamp"],
  },
  {
    id: "custom-properties",
    title: "CSS Custom Properties (Variables)",
    description: "Define reusable values with CSS variables",
    category: "css",
    baselineStatus: "widely",
    code: `:root {
  --primary-color: #667eea;
  --secondary-color: #764ba2;
  --spacing-unit: 1rem;
  --border-radius: 0.5rem;
}

.button {
  background: var(--primary-color);
  padding: var(--spacing-unit);
  border-radius: var(--border-radius);
}`,
    tags: ["variables", "theming", "design-system"],
  },
  {
    id: "fetch-async",
    title: "Modern Fetch with Async/Await",
    description: "Clean API calls with error handling",
    category: "javascript",
    baselineStatus: "widely",
    code: `async function fetchData(url) {
  try {
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(\`HTTP error! status: \${response.status}\`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Fetch error:', error);
    throw error;
  }
}`,
    tags: ["fetch", "async", "api", "error-handling"],
  },
  {
    id: "optional-chaining",
    title: "Safe Property Access",
    description: "Use optional chaining and nullish coalescing for safe object access",
    category: "javascript",
    baselineStatus: "widely",
    code: `// Optional chaining
const userName = user?.profile?.name;

// With nullish coalescing for defaults
const theme = config?.settings?.theme ?? 'light';

// Array access
const firstItem = items?.[0];

// Function calls
const result = obj?.method?.();`,
    tags: ["optional-chaining", "nullish-coalescing", "safety"],
  },
  {
    id: "array-methods",
    title: "Modern Array Methods",
    description: "Useful array methods for data manipulation",
    category: "javascript",
    baselineStatus: "widely",
    code: `const numbers = [1, 2, 3, 4, 5];

// Map, filter, reduce
const doubled = numbers.map(n => n * 2);
const evens = numbers.filter(n => n % 2 === 0);
const sum = numbers.reduce((acc, n) => acc + n, 0);

// Find and includes
const found = numbers.find(n => n > 3);
const hasTwo = numbers.includes(2);

// Some and every
const hasEven = numbers.some(n => n % 2 === 0);
const allPositive = numbers.every(n => n > 0);`,
    tags: ["arrays", "functional", "data-manipulation"],
  },
  {
    id: "destructuring",
    title: "Object and Array Destructuring",
    description: "Extract values from objects and arrays cleanly",
    category: "javascript",
    baselineStatus: "widely",
    code: `// Object destructuring
const { name, age, email } = user;

// With defaults
const { theme = 'light', lang = 'en' } = settings;

// Nested destructuring
const { address: { city, country } } = user;

// Array destructuring
const [first, second, ...rest] = items;

// Swap variables
[a, b] = [b, a];`,
    tags: ["destructuring", "syntax", "es6"],
  },
  {
    id: "template-literals",
    title: "Template Literals",
    description: "String interpolation and multi-line strings",
    category: "javascript",
    baselineStatus: "widely",
    code: `const name = 'World';
const greeting = \`Hello, \${name}!\`;

// Multi-line strings
const html = \`
  <div class="card">
    <h2>\${title}</h2>
    <p>\${description}</p>
  </div>
\`;

// Tagged templates
const styled = css\`
  color: \${primaryColor};
  font-size: \${fontSize}px;
\`;`,
    tags: ["strings", "templates", "interpolation"],
  },
  {
    id: "promise-all",
    title: "Parallel Async Operations",
    description: "Run multiple async operations concurrently",
    category: "javascript",
    baselineStatus: "widely",
    code: `// Wait for all promises
const [users, posts, comments] = await Promise.all([
  fetchUsers(),
  fetchPosts(),
  fetchComments()
]);

// Handle partial failures
const results = await Promise.allSettled([
  fetchData1(),
  fetchData2(),
  fetchData3()
]);

results.forEach((result, index) => {
  if (result.status === 'fulfilled') {
    console.log(\`Success \${index}:\`, result.value);
  } else {
    console.error(\`Error \${index}:\`, result.reason);
  }
});`,
    tags: ["promises", "async", "concurrency"],
  },
]

export function CodeSnippets() {
  const [searchQuery, setSearchQuery] = useState("")
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<"all" | "css" | "javascript" | "html">("all")

  const filteredSnippets = SNIPPETS.filter((snippet) => {
    const matchesSearch =
      snippet.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      snippet.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      snippet.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()))

    const matchesCategory = selectedCategory === "all" || snippet.category === selectedCategory

    return matchesSearch && matchesCategory
  })

  const handleCopy = (code: string, id: string) => {
    navigator.clipboard.writeText(code)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-2">Baseline-Safe Code Snippets</h2>
        <p className="text-sm text-muted-foreground">
          Pre-built, production-ready code snippets using widely available web features
        </p>
      </div>

      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search snippets..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="flex gap-2">
          <Button
            variant={selectedCategory === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedCategory("all")}
          >
            All
          </Button>
          <Button
            variant={selectedCategory === "css" ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedCategory("css")}
          >
            CSS
          </Button>
          <Button
            variant={selectedCategory === "javascript" ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedCategory("javascript")}
          >
            JavaScript
          </Button>
        </div>
      </div>

      <div className="grid gap-4">
        {filteredSnippets.map((snippet) => (
          <Card key={snippet.id} className="p-4 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-semibold">{snippet.title}</h3>
                  <Badge variant="outline" className="text-xs">
                    {snippet.category}
                  </Badge>
                  {snippet.baselineStatus === "widely" && (
                    <Badge variant="outline" className="text-xs bg-green-500/10 text-green-500 border-green-500/20">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Widely Available
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">{snippet.description}</p>
                <div className="flex gap-1 flex-wrap">
                  {snippet.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>

            <div className="relative">
              <pre className="bg-muted p-3 rounded-md text-xs overflow-x-auto max-h-64">
                <code>{snippet.code}</code>
              </pre>
              <Button
                size="sm"
                variant="ghost"
                className="absolute top-2 right-2 h-7 px-2"
                onClick={() => handleCopy(snippet.code, snippet.id)}
              >
                {copiedId === snippet.id ? (
                  <span className="text-xs text-green-500">Copied!</span>
                ) : (
                  <>
                    <Copy className="h-3 w-3 mr-1" />
                    <span className="text-xs">Copy</span>
                  </>
                )}
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {filteredSnippets.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No snippets found matching your search</p>
        </div>
      )}
    </div>
  )
}
