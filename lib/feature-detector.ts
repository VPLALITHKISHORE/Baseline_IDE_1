// @/lib/feature-detector.ts

import { searchFeatureByName, getBaselineStatusFromFeature, getBrowserSupportFromFeature } from "./webstatus-api"

// Feature detection patterns for CSS and JavaScript
export interface DetectedFeature {
  name: string
  type: "css" | "javascript"
  line: number
  column: number
  status: "widely_available" | "newly_available" | "limited_availability" | "unknown"
  description: string
  feature_id?: string
  browserSupport?: {
    chrome?: string
    firefox?: string
    safari?: string
    edge?: string
  }
  baselineDate?: string
  spec?: string
  caniuse?: string
}

export interface FeatureRecommendation {
  feature: string
  suggestion: string
  severity: "info" | "warning" | "error"
  alternatives?: string[]
  polyfill?: string
}

// Cache for detected features
let cachedFeatures: DetectedFeature[] = []
let cachedCode: string = ""
let cachedLanguage: string = ""

// CSS feature patterns
const CSS_FEATURE_PATTERNS = [
  {
    pattern: /container-type\s*:/gi,
    apiName: "container-queries",
    fallbackName: "CSS Container Queries (container-type)",
  },
  { 
    pattern: /@container\s+/gi, 
    apiName: "container-queries", 
    fallbackName: "CSS Container Queries (@container)" 
  },
  { 
    pattern: /content-visibility\s*:/gi, 
    apiName: "content-visibility", 
    fallbackName: "content-visibility" 
  },
  { 
    pattern: /clamp\s*\(/gi, 
    apiName: "css-math-functions", 
    fallbackName: "clamp()" 
  },
  { 
    pattern: /:has\s*\(/gi, 
    apiName: "css-has", 
    fallbackName: ":has() selector" 
  },
  { 
    pattern: /background-clip\s*:\s*text/gi, 
    apiName: "background-clip-text", 
    fallbackName: "background-clip: text" 
  },
  { 
    pattern: /@layer\s+/gi, 
    apiName: "cascade-layers", 
    fallbackName: "CSS Cascade Layers (@layer)" 
  },
  { 
    pattern: /aspect-ratio\s*:/gi, 
    apiName: "aspect-ratio", 
    fallbackName: "aspect-ratio" 
  },
  { 
    pattern: /:is\s*\(/gi, 
    apiName: "css-is", 
    fallbackName: ":is() selector" 
  },
  { 
    pattern: /:where\s*\(/gi, 
    apiName: "css-where", 
    fallbackName: ":where() selector" 
  },
  { 
    pattern: /gap\s*:/gi, 
    apiName: "flexbox-gap", 
    fallbackName: "Flexbox gap" 
  },
  { 
    pattern: /@supports\s+/gi, 
    apiName: "css-supports", 
    fallbackName: "@supports" 
  },
  { 
    pattern: /grid-template-columns\s*:/gi, 
    apiName: "css-grid", 
    fallbackName: "CSS Grid" 
  },
  { 
    pattern: /display\s*:\s*flex/gi, 
    apiName: "flexbox", 
    fallbackName: "Flexbox" 
  },
  { 
    pattern: /display\s*:\s*grid/gi, 
    apiName: "css-grid", 
    fallbackName: "CSS Grid Layout" 
  },
  { 
    pattern: /@property\s+/gi, 
    apiName: "css-at-property", 
    fallbackName: "@property" 
  },
  { 
    pattern: /view-transition/gi, 
    apiName: "view-transitions", 
    fallbackName: "View Transitions" 
  },
  { 
    pattern: /anchor-name\s*:/gi, 
    apiName: "css-anchor-positioning", 
    fallbackName: "CSS Anchor Positioning" 
  },
  { 
    pattern: /color-mix\s*\(/gi, 
    apiName: "color-mix", 
    fallbackName: "color-mix()" 
  },
]

// JavaScript feature patterns
const JS_FEATURE_PATTERNS = [
  { 
    pattern: /new\s+URLPattern\s*\(/gi, 
    apiName: "urlpattern", 
    fallbackName: "URLPattern API" 
  },
  { 
    pattern: /\?\.\s*/g, 
    apiName: "optional-chaining", 
    fallbackName: "Optional Chaining (?.)" 
  },
  { 
    pattern: /\?\?/g, 
    apiName: "nullish-coalescing", 
    fallbackName: "Nullish Coalescing (??)" 
  },
  { 
    pattern: /^(?!.*function).*await\s+/gm, 
    apiName: "top-level-await", 
    fallbackName: "Top-level await" 
  },
  { 
    pattern: /\bstructuredClone\s*\(/gi, 
    apiName: "structuredclone", 
    fallbackName: "structuredClone()" 
  },
  { 
    pattern: /Array\.prototype\.at\s*\(|\.at\s*\(/gi, 
    apiName: "array-at", 
    fallbackName: "Array.prototype.at()" 
  },
  { 
    pattern: /Object\.hasOwn\s*\(/gi, 
    apiName: "object-hasown", 
    fallbackName: "Object.hasOwn()" 
  },
  { 
    pattern: /Promise\.allSettled\s*\(/gi, 
    apiName: "promise-allsettled", 
    fallbackName: "Promise.allSettled()" 
  },
  { 
    pattern: /\bimport\.meta\b/gi, 
    apiName: "import-meta", 
    fallbackName: "import.meta" 
  },
  { 
    pattern: /BigInt\s*\(/gi, 
    apiName: "bigint", 
    fallbackName: "BigInt" 
  },
  { 
    pattern: /Promise\s*\(/gi, 
    apiName: "promises", 
    fallbackName: "Promise" 
  },
  { 
    pattern: /async\s+/gi, 
    apiName: "async-functions", 
    fallbackName: "Async Functions" 
  },
  { 
    pattern: /Object\.groupBy\s*\(/gi, 
    apiName: "object-group-by", 
    fallbackName: "Object.groupBy()" 
  },
  { 
    pattern: /Array\.fromAsync\s*\(/gi, 
    apiName: "array-from-async", 
    fallbackName: "Array.fromAsync()" 
  },
  { 
    pattern: /Promise\.withResolvers\s*\(/gi, 
    apiName: "promise-withresolvers", 
    fallbackName: "Promise.withResolvers()" 
  },
]

export async function detectCSSFeatures(code: string): Promise<DetectedFeature[]> {
  const features: DetectedFeature[] = []
  const lines = code.split("\n")
  const seenFeatures = new Set<string>() // Avoid duplicates

  for (const featurePattern of CSS_FEATURE_PATTERNS) {
    for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
      const line = lines[lineIndex]
      const matches = line.matchAll(featurePattern.pattern)

      for (const match of matches) {
        const featureKey = `${featurePattern.apiName}-${lineIndex}-${match.index}`
        
        if (seenFeatures.has(featureKey)) {
          continue
        }
        seenFeatures.add(featureKey)

        try {
          // Try to get real data from API
          const apiFeature = await searchFeatureByName(featurePattern.apiName)

          if (apiFeature) {
            features.push({
              name: apiFeature.name,
              type: "css",
              line: lineIndex + 1,
              column: match.index || 0,
              status: getBaselineStatusFromFeature(apiFeature),
              description: apiFeature.description || featurePattern.fallbackName,
              feature_id: apiFeature.feature_id,
              browserSupport: getBrowserSupportFromFeature(apiFeature),
              baselineDate: apiFeature.baseline?.high_date || apiFeature.baseline?.low_date,
              spec: apiFeature.spec,
              caniuse: apiFeature.caniuse,
            })
          } else {
            // Fallback to pattern name if API lookup fails
            features.push({
              name: featurePattern.fallbackName,
              type: "css",
              line: lineIndex + 1,
              column: match.index || 0,
              status: "unknown",
              description: featurePattern.fallbackName,
            })
          }
        } catch (error) {
          console.error(`[Feature Detector] Error detecting ${featurePattern.apiName}:`, error)
          // Add fallback feature on error
          features.push({
            name: featurePattern.fallbackName,
            type: "css",
            line: lineIndex + 1,
            column: match.index || 0,
            status: "unknown",
            description: featurePattern.fallbackName,
          })
        }
      }
    }
  }

  return features
}

export async function detectJavaScriptFeatures(code: string): Promise<DetectedFeature[]> {
  const features: DetectedFeature[] = []
  const lines = code.split("\n")
  const seenFeatures = new Set<string>() // Avoid duplicates

  for (const featurePattern of JS_FEATURE_PATTERNS) {
    for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
      const line = lines[lineIndex]
      const matches = line.matchAll(featurePattern.pattern)

      for (const match of matches) {
        const featureKey = `${featurePattern.apiName}-${lineIndex}-${match.index}`
        
        if (seenFeatures.has(featureKey)) {
          continue
        }
        seenFeatures.add(featureKey)

        try {
          // Try to get real data from API
          const apiFeature = await searchFeatureByName(featurePattern.apiName)

          if (apiFeature) {
            features.push({
              name: apiFeature.name,
              type: "javascript",
              line: lineIndex + 1,
              column: match.index || 0,
              status: getBaselineStatusFromFeature(apiFeature),
              description: apiFeature.description || featurePattern.fallbackName,
              feature_id: apiFeature.feature_id,
              browserSupport: getBrowserSupportFromFeature(apiFeature),
              baselineDate: apiFeature.baseline?.high_date || apiFeature.baseline?.low_date,
              spec: apiFeature.spec,
              caniuse: apiFeature.caniuse,
            })
          } else {
            // Fallback to pattern name if API lookup fails
            features.push({
              name: featurePattern.fallbackName,
              type: "javascript",
              line: lineIndex + 1,
              column: match.index || 0,
              status: "unknown",
              description: featurePattern.fallbackName,
            })
          }
        } catch (error) {
          console.error(`[Feature Detector] Error detecting ${featurePattern.apiName}:`, error)
          // Add fallback feature on error
          features.push({
            name: featurePattern.fallbackName,
            type: "javascript",
            line: lineIndex + 1,
            column: match.index || 0,
            status: "unknown",
            description: featurePattern.fallbackName,
          })
        }
      }
    }
  }

  return features
}

export async function detectFeatures(code: string, language: string): Promise<DetectedFeature[]> {
  if (language === "css") {
    return await detectCSSFeatures(code)
  } else if (language === "javascript" || language === "typescript") {
    return await detectJavaScriptFeatures(code)
  }
  return []
}

// Detect features with caching
export async function detectFeaturesWithCache(code: string, language: string): Promise<DetectedFeature[]> {
  // Return cached features if code hasn't changed
  if (cachedCode === code && cachedLanguage === language && cachedFeatures.length > 0) {
    return cachedFeatures
  }

  // Detect new features
  cachedCode = code
  cachedLanguage = language
  cachedFeatures = await detectFeatures(code, language)
  
  return cachedFeatures
}

// Get cached features (synchronous)
export function getCachedFeatures(): DetectedFeature[] {
  return cachedFeatures
}

// Clear cache
export function clearFeatureCache(): void {
  cachedFeatures = []
  cachedCode = ""
  cachedLanguage = ""
}

// Find feature at position with proper column checking
export async function findFeatureAtPosition(
  code: string,
  line: number,
  column: number,
  language: string,
): Promise<DetectedFeature | null> {
  // Get features (uses cache if available)
  const features = await detectFeaturesWithCache(code, language)

  if (!features || features.length === 0) {
    return null
  }

  // Get the line content for column checking
  const lines = code.split('\n')
  const lineContent = lines[line - 1] // line is 1-based, array is 0-based

  if (!lineContent) {
    return null
  }

  // Find all features on the target line
  const lineFeatures = features.filter(f => f.line === line)

  if (lineFeatures.length === 0) {
    return null
  }

  // If only one feature on the line, return it
  if (lineFeatures.length === 1) {
    return lineFeatures[0]
  }

  // Find the best matching feature based on column position
  let bestMatch: DetectedFeature | null = null
  let minDistance = Infinity

  for (const feature of lineFeatures) {
    const featureStartColumn = feature.column
    const featureName = feature.name
    
    // Estimate feature end column
    const featureEndColumn = featureStartColumn + featureName.length

    // Check if column is within the feature range (with tolerance)
    const tolerance = 10
    if (column >= featureStartColumn - tolerance && column <= featureEndColumn + tolerance) {
      // Exact match within tolerance
      if (column >= featureStartColumn && column <= featureEndColumn) {
        return feature // Perfect match
      }

      // Calculate distance
      const distance = Math.min(
        Math.abs(column - featureStartColumn),
        Math.abs(column - featureEndColumn)
      )

      if (distance < minDistance) {
        minDistance = distance
        bestMatch = feature
      }
    }
  }

  // Return best match if found, otherwise return first feature on line
  return bestMatch || lineFeatures[0]
}

// Synchronous version using cached features
export function findFeatureAtPositionSync(
  line: number,
  column: number,
): DetectedFeature | null {
  if (cachedFeatures.length === 0) {
    return null
  }

  // Find features on the same line
  const lineFeatures = cachedFeatures.filter(f => f.line === line)

  if (lineFeatures.length === 0) {
    return null
  }

  // If only one feature on line, return it
  if (lineFeatures.length === 1) {
    return lineFeatures[0]
  }

  // Find feature at exact position
  let bestMatch: DetectedFeature | null = null
  let minDistance = Infinity

  for (const feature of lineFeatures) {
    const featureStart = feature.column
    const featureEnd = featureStart + feature.name.length
    
    // Check if column is within feature bounds (with tolerance)
    const tolerance = 15
    if (column >= featureStart - tolerance && column <= featureEnd + tolerance) {
      // Calculate distance to feature
      const distance = Math.min(
        Math.abs(column - featureStart),
        Math.abs(column - featureEnd)
      )

      if (distance < minDistance) {
        minDistance = distance
        bestMatch = feature
      }
    }
  }

  // Return best match or first feature on line
  return bestMatch || lineFeatures[0]
}

export function getBaselineStatus(features: DetectedFeature[]): {
  widelyAvailable: number
  newlyAvailable: number
  limitedAvailability: number
  unknown: number
  total: number
} {
  const stats = {
    widelyAvailable: 0,
    newlyAvailable: 0,
    limitedAvailability: 0,
    unknown: 0,
    total: features.length,
  }

  features.forEach((feature) => {
    if (feature.status === "widely_available") {
      stats.widelyAvailable++
    } else if (feature.status === "newly_available") {
      stats.newlyAvailable++
    } else if (feature.status === "limited_availability") {
      stats.limitedAvailability++
    } else if (feature.status === "unknown") {
      stats.unknown++
    }
  })

  return stats
}

// Safe number helper
function safeNumber(value: any, fallback: number = 0): number {
  if (value === null || value === undefined) return fallback
  const num = Number(value)
  return isNaN(num) || !isFinite(num) ? fallback : num
}

// Calculate compatibility score
export function calculateCompatibilityScore(features: DetectedFeature[]): number {
  if (features.length === 0) return 100

  const weights = {
    widely_available: 100,
    newly_available: 75,
    limited_availability: 30,
    unknown: 50,
  }

  const totalScore = features.reduce((sum, feature) => {
    return sum + weights[feature.status]
  }, 0)

  const score = totalScore / features.length
  return safeNumber(Math.round(score), 100)
}

export function getFeatureHoverContent(feature: DetectedFeature): string {
  const statusEmoji =
    feature.status === "widely_available"
      ? "✅"
      : feature.status === "newly_available"
        ? "⚠️"
        : feature.status === "limited_availability"
          ? "❌"
          : "❓"

  const statusText =
    feature.status === "widely_available"
      ? "**Widely Available** - Safe to use in production"
      : feature.status === "newly_available"
        ? "**Newly Available** - Recently became Baseline"
        : feature.status === "limited_availability"
          ? "**Limited Availability** - Use with caution"
          : "**Unknown** - Status not determined"

  let content = `### ${statusEmoji} ${feature.name}\n\n`
  content += `${statusText}\n\n`
  content += `${feature.description}\n\n`

  if (feature.baselineDate) {
    const date = new Date(feature.baselineDate)
    content += `**Baseline Since:** ${date.toLocaleDateString()}\n\n`
  }

  if (feature.browserSupport) {
    content += `**Browser Support:**\n\n`
    if (feature.browserSupport.chrome) content += `- Chrome ${feature.browserSupport.chrome}+\n`
    if (feature.browserSupport.firefox) content += `- Firefox ${feature.browserSupport.firefox}+\n`
    if (feature.browserSupport.safari) content += `- Safari ${feature.browserSupport.safari}+\n`
    if (feature.browserSupport.edge) content += `- Edge ${feature.browserSupport.edge}+\n`
  }

  if (feature.spec) {
    content += `\n[View Specification](${feature.spec})`
  }

  if (feature.caniuse) {
    content += ` | [Can I Use](${feature.caniuse})`
  }

  return content
}

export function getFeatureRecommendations(features: DetectedFeature[]): FeatureRecommendation[] {
  const recommendations: FeatureRecommendation[] = []
  const processedFeatures = new Set<string>()

  features.forEach((feature) => {
    // Avoid duplicate recommendations
    if (processedFeatures.has(feature.feature_id || feature.name)) {
      return
    }
    processedFeatures.add(feature.feature_id || feature.name)

    if (feature.status === "limited_availability") {
      if (feature.name.includes("URLPattern")) {
        recommendations.push({
          feature: feature.name,
          suggestion: "Consider using a polyfill like 'urlpattern-polyfill' or use traditional URL parsing with RegExp",
          severity: "error",
          alternatives: ["url-pattern library", "path-to-regexp"],
          polyfill: "urlpattern-polyfill",
        })
      } else if (feature.name.includes("View Transitions")) {
        recommendations.push({
          feature: feature.name,
          suggestion: "View Transitions have limited support. Provide fallback animations using CSS transitions",
          severity: "error",
          alternatives: ["CSS transitions", "FLIP technique", "Framer Motion"],
        })
      } else if (feature.name.includes("Anchor Positioning")) {
        recommendations.push({
          feature: feature.name,
          suggestion: "CSS Anchor Positioning is experimental. Use JavaScript positioning libraries instead",
          severity: "error",
          alternatives: ["Floating UI", "Popper.js", "Tether"],
        })
      } else if (feature.name.includes("Object.groupBy")) {
        recommendations.push({
          feature: feature.name,
          suggestion: "Object.groupBy() has limited support. Use Array.reduce() or lodash.groupBy as alternatives",
          severity: "warning",
          alternatives: ["Array.reduce()", "lodash.groupBy"],
          polyfill: "core-js",
        })
      } else {
        recommendations.push({
          feature: feature.name,
          suggestion: `${feature.name} has limited browser support. Consider using polyfills or progressive enhancement`,
          severity: "error",
        })
      }
    } else if (feature.status === "newly_available") {
      recommendations.push({
        feature: feature.name,
        suggestion: `${feature.name} is newly available. Test thoroughly across target browsers before deploying to production`,
        severity: "warning",
      })
    }
  })

  // Add general recommendation if there are limited features but no specific recommendations
  const limitedCount = features.filter((f) => f.status === "limited_availability").length
  if (limitedCount > 0 && recommendations.filter(r => r.severity === "error").length === 0) {
    recommendations.push({
      feature: "Limited Features Detected",
      suggestion: "Consider adding polyfills or using progressive enhancement for better browser support",
      severity: "warning",
    })
  }

  // Sort by severity: error > warning > info
  const severityOrder = { error: 0, warning: 1, info: 2 }
  return recommendations.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity])
}

// Get features by status
export function getFeaturesByStatus(features: DetectedFeature[]): {
  widely_available: DetectedFeature[]
  newly_available: DetectedFeature[]
  limited_availability: DetectedFeature[]
  unknown: DetectedFeature[]
} {
  return {
    widely_available: features.filter((f) => f.status === "widely_available"),
    newly_available: features.filter((f) => f.status === "newly_available"),
    limited_availability: features.filter((f) => f.status === "limited_availability"),
    unknown: features.filter((f) => f.status === "unknown"),
  }
}

// Get status color classes
export function getStatusColor(status: DetectedFeature["status"]): {
  text: string
  bg: string
  border: string
} {
  const colors = {
    widely_available: {
      text: "text-green-700",
      bg: "bg-green-100",
      border: "border-green-200",
    },
    newly_available: {
      text: "text-yellow-700",
      bg: "bg-yellow-100",
      border: "border-yellow-200",
    },
    limited_availability: {
      text: "text-red-700",
      bg: "bg-red-100",
      border: "border-red-200",
    },
    unknown: {
      text: "text-gray-700",
      bg: "bg-gray-100",
      border: "border-gray-200",
    },
  }
  return colors[status]
}

// Generate compatibility report
export function generateCompatibilityReport(features: DetectedFeature[]): {
  score: number
  total: number
  byStatus: ReturnType<typeof getFeaturesByStatus>
  recommendations: FeatureRecommendation[]
  stats: ReturnType<typeof getBaselineStatus>
} {
  return {
    score: calculateCompatibilityScore(features),
    total: features.length,
    byStatus: getFeaturesByStatus(features),
    recommendations: getFeatureRecommendations(features),
    stats: getBaselineStatus(features),
  }
}
