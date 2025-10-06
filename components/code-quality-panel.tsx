"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Shield,
  Zap,
  Code2,
  Eye,
  Lock,
  Trash2,
  Globe,
  ChevronRight,
  AlertCircle,
} from "lucide-react"
import { useState } from "react"
import type { DetectedFeature } from "@/lib/feature-detector"

interface CodeQualityPanelProps {
  features: DetectedFeature[]
  code: string
  language: string
}

interface Issue {
  severity: "error" | "warning" | "info"
  category: "style" | "error-prone" | "performance" | "compatibility" | "unused" | "security"
  message: string
  line?: number
  suggestion: string
  impact: string
}

interface CategoryScore {
  score: number
  issues: number
  criticalIssues: number
}

export function CodeQualityPanel({ features, code, language }: CodeQualityPanelProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

  // Comprehensive code analysis
  const analyzeCode = (): Issue[] => {
    const issues: Issue[] = []
    const lines = code.split("\n")

    lines.forEach((line, index) => {
      const trimmed = line.trim()
      const lineNumber = index + 1

      // ==================== CODE STYLE ISSUES ====================
      
      // Variable naming conventions
      if (/\bvar\s+[A-Z]/.test(trimmed)) {
        issues.push({
          severity: "warning",
          category: "style",
          message: `Variable name should use camelCase, not PascalCase`,
          line: lineNumber,
          suggestion: "Use camelCase for variable names (e.g., userName instead of UserName)",
          impact: "Reduces code readability and violates naming conventions",
        })
      }

      // Snake_case detection (non-standard in JavaScript)
      if (/\b(const|let|var)\s+\w+_\w+/.test(trimmed)) {
        issues.push({
          severity: "info",
          category: "style",
          message: "Variable uses snake_case instead of camelCase",
          line: lineNumber,
          suggestion: "Use camelCase for JavaScript variables (e.g., firstName instead of first_name)",
          impact: "Inconsistent with JavaScript conventions",
        })
      }

      // Inconsistent quote usage
      if (/".*"/.test(trimmed) && /'.*'/.test(trimmed)) {
        issues.push({
          severity: "info",
          category: "style",
          message: "Mixed quotation marks detected",
          line: lineNumber,
          suggestion: "Use consistent quotation marks throughout (prefer single quotes or template literals)",
          impact: "Reduces code consistency",
        })
      }

      // Missing semicolons (if not using ASI intentionally)
      if (
        /^(const|let|var|return)\s+.*[^;{}\s]$/.test(trimmed) &&
        !trimmed.includes("//") &&
        !trimmed.endsWith(",")
      ) {
        issues.push({
          severity: "info",
          category: "style",
          message: "Missing semicolon",
          line: lineNumber,
          suggestion: "Add semicolon or use a consistent ASI (Automatic Semicolon Insertion) style",
          impact: "Can lead to unexpected behavior in certain cases",
        })
      }

      // Inconsistent spacing around operators
      if (/[a-zA-Z0-9][+\-*/%]=(?!\s)/.test(trimmed) || /(?<!\s)=[a-zA-Z0-9]/.test(trimmed)) {
        issues.push({
          severity: "info",
          category: "style",
          message: "Inconsistent spacing around operators",
          line: lineNumber,
          suggestion: "Add spaces around operators for better readability",
          impact: "Reduces code readability",
        })
      }

      // ==================== ERROR-PRONE CODE ====================

      // Loose equality (==) instead of strict (===)
      if (/[^=!]={2}[^=]/.test(trimmed) && !trimmed.includes("===")) {
        issues.push({
          severity: "error",
          category: "error-prone",
          message: "Using loose equality (==) instead of strict equality (===)",
          line: lineNumber,
          suggestion: "Use === or !== to avoid type coercion bugs",
          impact: "Can cause unexpected type coercion and hard-to-debug issues",
        })
      }

      // Assignment in conditional
      if (/if\s*\([^)]*=[^=]/.test(trimmed) && !trimmed.includes("===") && !trimmed.includes("!==")) {
        issues.push({
          severity: "error",
          category: "error-prone",
          message: "Assignment in conditional expression",
          line: lineNumber,
          suggestion: "Use === for comparison or wrap assignment in extra parentheses if intentional",
          impact: "Likely a typo that will cause logical errors",
        })
      }

      // Using var instead of let/const
      if (/\bvar\s+/.test(trimmed)) {
        issues.push({
          severity: "warning",
          category: "error-prone",
          message: "Using 'var' instead of 'let' or 'const'",
          line: lineNumber,
          suggestion: "Use 'const' for values that won't change, 'let' for values that will",
          impact: "var has function scope which can lead to hoisting bugs",
        })
      }

      // Missing Array.isArray check
      if (/\.length\s*>/.test(trimmed) && !trimmed.includes("Array.isArray")) {
        issues.push({
          severity: "warning",
          category: "error-prone",
          message: "Potential unsafe array operation without type check",
          line: lineNumber,
          suggestion: "Use Array.isArray() before checking length property",
          impact: "Can throw errors if value is not an array",
        })
      }

      // Async function without try-catch
      if (/async\s+function|async\s*\(/.test(trimmed)) {
        const nextLines = lines.slice(index, Math.min(index + 10, lines.length)).join("\n")
        if (!nextLines.includes("try") && !nextLines.includes("catch")) {
          issues.push({
            severity: "warning",
            category: "error-prone",
            message: "Async function without error handling",
            line: lineNumber,
            suggestion: "Wrap async operations in try-catch blocks or use .catch()",
            impact: "Unhandled promise rejections can crash the application",
          })
        }
      }

      // Console.log in production code
      if (/console\.(log|debug|info)/.test(trimmed) && !trimmed.includes("//")) {
        issues.push({
          severity: "warning",
          category: "error-prone",
          message: "Console statement detected",
          line: lineNumber,
          suggestion: "Remove console statements or use a proper logging library",
          impact: "Exposes debugging information and impacts performance",
        })
      }

      // ==================== PERFORMANCE ISSUES ====================

      // Inline function in JSX
      if (/onClick=\{.*=>/.test(trimmed) || /onChange=\{.*=>/.test(trimmed)) {
        issues.push({
          severity: "warning",
          category: "performance",
          message: "Inline arrow function in event handler",
          line: lineNumber,
          suggestion: "Define functions outside render or use useCallback hook",
          impact: "Creates new function on every render, causing unnecessary re-renders",
        })
      }

      // Array operations in render
      if (/(map|filter|reduce)\(/.test(trimmed) && /return\s*\(/.test(code.slice(0, code.indexOf(line)))) {
        issues.push({
          severity: "info",
          category: "performance",
          message: "Array operation in render method",
          line: lineNumber,
          suggestion: "Consider memoizing with useMemo or computing outside render",
          impact: "Recalculates on every render, potentially impacting performance",
        })
      }

      // Large object/array in state
      if (/useState\s*\(\s*\[/.test(trimmed) || /useState\s*\(\s*\{/.test(trimmed)) {
        issues.push({
          severity: "info",
          category: "performance",
          message: "Complex initial state detected",
          line: lineNumber,
          suggestion: "Consider using lazy initialization: useState(() => expensiveComputation())",
          impact: "Initial state computed on every render",
        })
      }

      // Missing React.memo
      if (/^export\s+(default\s+)?function\s+[A-Z]/.test(trimmed)) {
        const componentName = trimmed.match(/function\s+([A-Z]\w+)/)?.[1]
        if (componentName && !code.includes(`React.memo(${componentName})`)) {
          issues.push({
            severity: "info",
            category: "performance",
            message: "Component not wrapped with React.memo",
            line: lineNumber,
            suggestion: "Consider using React.memo to prevent unnecessary re-renders",
            impact: "Component re-renders even when props haven't changed",
          })
        }
      }

      // Inefficient DOM queries
      if (/document\.querySelector/.test(trimmed) || /document\.getElementById/.test(trimmed)) {
        issues.push({
          severity: "warning",
          category: "performance",
          message: "Direct DOM manipulation detected",
          line: lineNumber,
          suggestion: "Use React refs or state management instead of direct DOM manipulation",
          impact: "Bypasses React's virtual DOM, reducing performance",
        })
      }

      // ==================== COMPATIBILITY ISSUES ====================

      // Optional chaining without polyfill check
      if (/\?\.|\.?\?\[/.test(trimmed)) {
        issues.push({
          severity: "info",
          category: "compatibility",
          message: "Optional chaining operator used",
          line: lineNumber,
          suggestion: "Ensure target browsers support ES2020 or include polyfills",
          impact: "Not supported in older browsers (IE11, older Safari)",
        })
      }

      // Nullish coalescing
      if (/\?\?/.test(trimmed)) {
        issues.push({
          severity: "info",
          category: "compatibility",
          message: "Nullish coalescing operator used",
          line: lineNumber,
          suggestion: "Ensure target browsers support ES2020 or include polyfills",
          impact: "Not supported in older browsers",
        })
      }

      // Async/await without regenerator
      if (/\bawait\s+/.test(trimmed)) {
        issues.push({
          severity: "info",
          category: "compatibility",
          message: "Async/await detected",
          line: lineNumber,
          suggestion: "Ensure Babel is configured with regenerator-runtime for older browsers",
          impact: "Requires transpilation for IE11 and older browsers",
        })
      }

      // ES6 spread operator
      if (/\.\.\.\w+/.test(trimmed) && (trimmed.includes("[") || trimmed.includes("{"))) {
        issues.push({
          severity: "info",
          category: "compatibility",
          message: "Spread operator used",
          line: lineNumber,
          suggestion: "Ensure transpilation is configured for target browsers",
          impact: "Not supported in IE11 without transpilation",
        })
      }

      // ==================== UNUSED CODE ====================

      // Unused imports
      if (/^import\s+\{([^}]+)\}/.test(trimmed)) {
        const imports = trimmed.match(/\{([^}]+)\}/)?.[1].split(",").map((i) => i.trim())
        imports?.forEach((imp) => {
          const importName = imp.split(" as ")[1] || imp
          const regex = new RegExp(`\\b${importName}\\b`)
          const usageCount = code.split("\n").slice(index + 1).filter((l) => regex.test(l)).length
          if (usageCount === 0) {
            issues.push({
              severity: "warning",
              category: "unused",
              message: `Unused import: ${importName}`,
              line: lineNumber,
              suggestion: "Remove unused imports to reduce bundle size",
              impact: "Increases bundle size and compilation time",
            })
          }
        })
      }

      // Unused variables
      if (/^const\s+(\w+)\s*=/.test(trimmed)) {
        const varName = trimmed.match(/^const\s+(\w+)/)?.[1]
        if (varName) {
          const regex = new RegExp(`\\b${varName}\\b`)
          const usageCount = code.split("\n").slice(index + 1).filter((l) => regex.test(l)).length
          if (usageCount === 0) {
            issues.push({
              severity: "warning",
              category: "unused",
              message: `Unused variable: ${varName}`,
              line: lineNumber,
              suggestion: "Remove unused variable or prefix with underscore if intentional",
              impact: "Dead code that clutters the codebase",
            })
          }
        }
      }

      // Unreachable code after return
      if (/^\s*return\b/.test(trimmed)) {
        const nextLine = lines[index + 1]
        if (nextLine && nextLine.trim() && !nextLine.trim().startsWith("}") && !nextLine.trim().startsWith("//")) {
          issues.push({
            severity: "error",
            category: "unused",
            message: "Unreachable code after return statement",
            line: lineNumber + 1,
            suggestion: "Remove code after return or refactor logic",
            impact: "Code will never execute",
          })
        }
      }

      // ==================== SECURITY ISSUES ====================

      // Dangerous innerHTML usage
      if (/\.innerHTML\s*=/.test(trimmed) || /dangerouslySetInnerHTML/.test(trimmed)) {
        issues.push({
          severity: "error",
          category: "security",
          message: "Potential XSS vulnerability with innerHTML",
          line: lineNumber,
          suggestion: "Sanitize HTML input with DOMPurify or use safer alternatives",
          impact: "CRITICAL: Can allow XSS attacks and code injection",
        })
      }

      // eval() usage
      if (/\beval\s*\(/.test(trimmed)) {
        issues.push({
          severity: "error",
          category: "security",
          message: "Dangerous eval() function detected",
          line: lineNumber,
          suggestion: "Never use eval(). Use JSON.parse() for JSON or alternative solutions",
          impact: "CRITICAL: Allows arbitrary code execution",
        })
      }

      // Hardcoded credentials
      if (
        /(password|secret|api_key|apiKey|token)\s*[:=]\s*['"]\w+['"]/.test(trimmed) &&
        !trimmed.includes("process.env")
      ) {
        issues.push({
          severity: "error",
          category: "security",
          message: "Hardcoded credential detected",
          line: lineNumber,
          suggestion: "Use environment variables and never commit secrets",
          impact: "CRITICAL: Exposes sensitive credentials",
        })
      }

      // Unsafe regex (ReDoS)
      if (/new RegExp\(['"].*\+.*\*.*['"]/.test(trimmed)) {
        issues.push({
          severity: "warning",
          category: "security",
          message: "Potentially unsafe regular expression (ReDoS risk)",
          line: lineNumber,
          suggestion: "Review regex for exponential backtracking patterns",
          impact: "Can cause denial of service through catastrophic backtracking",
        })
      }

      // External script loading
      if (/createElement\(['"]script['"]\)/.test(trimmed) || /src\s*=\s*['"]\s*http/.test(trimmed)) {
        issues.push({
          severity: "warning",
          category: "security",
          message: "Dynamic script loading detected",
          line: lineNumber,
          suggestion: "Use SRI (Subresource Integrity) and CSP headers",
          impact: "Can load malicious third-party code",
        })
      }

      // localStorage for sensitive data
      if (/localStorage\.(setItem|getItem)/.test(trimmed) && /(token|password|secret)/.test(trimmed)) {
        issues.push({
          severity: "error",
          category: "security",
          message: "Storing sensitive data in localStorage",
          line: lineNumber,
          suggestion: "Use httpOnly cookies or secure session storage for sensitive data",
          impact: "Vulnerable to XSS attacks and data theft",
        })
      }

      // SQL injection risk (if backend code)
      if (/query\s*\([`'"]\s*SELECT.*\$\{/.test(trimmed)) {
        issues.push({
          severity: "error",
          category: "security",
          message: "Potential SQL injection vulnerability",
          line: lineNumber,
          suggestion: "Use parameterized queries or prepared statements",
          impact: "CRITICAL: Can allow database compromise",
        })
      }
    })

    return issues
  }

  const issues = analyzeCode()

  // Calculate category scores
  const calculateCategoryScore = (category: string): CategoryScore => {
    const categoryIssues = issues.filter((i) => i.category === category)
    const criticalIssues = categoryIssues.filter((i) => i.severity === "error").length
    const warningIssues = categoryIssues.filter((i) => i.severity === "warning").length

    // Score calculation: Start at 100, deduct based on severity
    const score = Math.max(
      0,
      100 - criticalIssues * 15 - warningIssues * 5 - (categoryIssues.length - criticalIssues - warningIssues) * 2
    )

    return {
      score: Math.round(score),
      issues: categoryIssues.length,
      criticalIssues,
    }
  }

  const categories = [
    {
      id: "style",
      name: "Code Style",
      icon: Code2,
      color: "blue",
      description: "Formatting and naming conventions",
    },
    {
      id: "error-prone",
      name: "Error-Prone",
      icon: AlertTriangle,
      color: "orange",
      description: "Code that may hide bugs",
    },
    {
      id: "performance",
      name: "Performance",
      icon: Zap,
      color: "green",
      description: "Optimization opportunities",
    },
    {
      id: "compatibility",
      name: "Compatibility",
      icon: Globe,
      color: "purple",
      description: "Browser support issues",
    },
    {
      id: "unused",
      name: "Unused Code",
      icon: Trash2,
      color: "gray",
      description: "Dead code and unused imports",
    },
    {
      id: "security",
      name: "Security",
      icon: Lock,
      color: "red",
      description: "Security vulnerabilities",
    },
  ]

  const categoryScores = categories.map((cat) => ({
    ...cat,
    ...calculateCategoryScore(cat.id),
  }))

  // Overall score
  const overallScore = Math.round(
    categoryScores.reduce((sum, cat) => sum + cat.score, 0) / categoryScores.length
  )

  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-green-500"
    if (score >= 75) return "text-blue-500"
    if (score >= 60) return "text-yellow-500"
    if (score >= 40) return "text-orange-500"
    return "text-red-500"
  }

  const getScoreBadge = (score: number) => {
    if (score >= 90) return "Excellent"
    if (score >= 75) return "Good"
    if (score >= 60) return "Fair"
    if (score >= 40) return "Poor"
    return "Critical"
  }

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "error":
        return <XCircle className="h-4 w-4 text-red-500" />
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      default:
        return <AlertCircle className="h-4 w-4 text-blue-500" />
    }
  }

  const filteredIssues = selectedCategory
    ? issues.filter((i) => i.category === selectedCategory)
    : issues

  return (
    <ScrollArea className="h-full">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div>
          <h2 className="text-2xl font-bold mb-2">Advanced Code Quality Analysis</h2>
          <p className="text-sm text-muted-foreground">
            Industry-standard linting with ESLint-style rules and OWASP security checks
          </p>
        </div>

        {/* Overall Score */}
        <Card className="p-6 bg-gradient-to-br from-purple-500/10 to-blue-500/5 border-purple-500/20">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Shield className="h-6 w-6 text-purple-500" />
              <h3 className="text-lg font-semibold">Overall Code Quality Score</h3>
            </div>
            <Badge
              variant="outline"
              className={`border-purple-500/50 bg-purple-500/10 ${getScoreColor(overallScore)}`}
            >
              {getScoreBadge(overallScore)}
            </Badge>
          </div>
          <div className="flex items-end gap-3 mb-4">
            <span className={`text-5xl font-bold ${getScoreColor(overallScore)}`}>{overallScore}</span>
            <span className="text-muted-foreground mb-2">/100</span>
          </div>
          <div className="h-3 bg-muted rounded-full overflow-hidden mb-4">
            <div
              className={`h-full transition-all duration-500 ${
                overallScore >= 90
                  ? "bg-green-500"
                  : overallScore >= 75
                    ? "bg-blue-500"
                    : overallScore >= 60
                      ? "bg-yellow-500"
                      : "bg-red-500"
              }`}
              style={{ width: `${overallScore}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              {issues.length} total issues found
            </span>
            <span className="text-red-500 font-medium">
              {issues.filter((i) => i.severity === "error").length} critical
            </span>
          </div>
        </Card>

        {/* Category Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {categoryScores.map((category) => {
            const Icon = category.icon
            const isSelected = selectedCategory === category.id

            return (
              <Card
                key={category.id}
                className={`p-4 cursor-pointer transition-all hover:shadow-lg ${
                  isSelected ? `border-${category.color}-500 bg-${category.color}-500/5` : ""
                }`}
                onClick={() => setSelectedCategory(isSelected ? null : category.id)}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Icon className={`h-5 w-5 text-${category.color}-500`} />
                    <span className="text-sm font-medium">{category.name}</span>
                  </div>
                  <ChevronRight
                    className={`h-4 w-4 transition-transform ${isSelected ? "rotate-90" : ""}`}
                  />
                </div>
                <div className="flex items-end gap-2 mb-2">
                  <span className={`text-3xl font-bold ${getScoreColor(category.score)}`}>
                    {category.score}
                  </span>
                  <span className="text-muted-foreground mb-1">/100</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden mb-3">
                  <div
                    className={`h-full bg-${category.color}-500 transition-all duration-500`}
                    style={{ width: `${category.score}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">{category.issues} issues</span>
                  {category.criticalIssues > 0 && (
                    <span className="text-red-500 font-medium">{category.criticalIssues} critical</span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-2">{category.description}</p>
              </Card>
            )
          })}
        </div>

        {/* Issues List */}
        {filteredIssues.length > 0 && (
          <Card className="p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Eye className="h-5 w-5 text-muted-foreground" />
                <h3 className="font-semibold">
                  {selectedCategory
                    ? `${categories.find((c) => c.id === selectedCategory)?.name} Issues`
                    : "All Issues"}
                </h3>
              </div>
              {selectedCategory && (
                <button
                  onClick={() => setSelectedCategory(null)}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  Clear filter
                </button>
              )}
            </div>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {filteredIssues.map((issue, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-lg border transition-all hover:shadow-md ${
                    issue.severity === "error"
                      ? "border-red-500/30 bg-red-500/5"
                      : issue.severity === "warning"
                        ? "border-yellow-500/30 bg-yellow-500/5"
                        : "border-blue-500/30 bg-blue-500/5"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {getSeverityIcon(issue.severity)}
                    <div className="flex-1 space-y-2">
                      <div className="flex items-start justify-between">
                        <p className="text-sm font-medium">{issue.message}</p>
                        {issue.line && (
                          <Badge variant="outline" className="text-xs">
                            Line {issue.line}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        <strong>Impact:</strong> {issue.impact}
                      </p>
                      <div className="p-2 bg-card rounded border border-border">
                        <p className="text-xs">
                          <strong className="text-green-500">✓ Fix:</strong> {issue.suggestion}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* No Issues Found */}
        {issues.length === 0 && (
          <Card className="p-8 text-center bg-gradient-to-br from-green-500/5 to-transparent border-green-500/20">
            <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-green-500 mb-2">Excellent Code Quality!</h3>
            <p className="text-sm text-muted-foreground">
              No issues detected. Your code follows best practices and security standards.
            </p>
          </Card>
        )}

        {/* Best Practices Summary */}
        <Card className="p-4 bg-gradient-to-br from-blue-500/5 to-transparent border-blue-500/20">
          <div className="flex items-center gap-2 mb-4">
            <Shield className="h-5 w-5 text-blue-500" />
            <h3 className="font-semibold text-blue-500">Code Quality Standards</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <div className="p-3 bg-card rounded border border-border">
              <p className="font-medium mb-1">✓ ESLint Rules</p>
              <p className="text-muted-foreground">Industry-standard linting with customizable rules</p>
            </div>
            <div className="p-3 bg-card rounded border border-border">
              <p className="font-medium mb-1">✓ OWASP Security</p>
              <p className="text-muted-foreground">Top 10 vulnerability detection and prevention</p>
            </div>
            <div className="p-3 bg-card rounded border border-border">
              <p className="font-medium mb-1">✓ Performance Best Practices</p>
              <p className="text-muted-foreground">React optimization patterns and anti-pattern detection</p>
            </div>
            <div className="p-3 bg-card rounded border border-border">
              <p className="font-medium mb-1">✓ Cross-Browser Compatibility</p>
              <p className="text-muted-foreground">ES6+ feature compatibility checks</p>
            </div>
          </div>
        </Card>
      </div>
    </ScrollArea>
  )
}

