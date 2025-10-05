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

import { searchFeatureByName, getBaselineStatusFromFeature, getBrowserSupportFromFeature } from "./webstatus-api"

// CSS feature patterns
const CSS_FEATURE_PATTERNS = [
  {
    pattern: /container-type\s*:/gi,
    apiName: "container-queries",
    fallbackName: "CSS Container Queries (container-type)",
  },
  { pattern: /@container\s+/gi, apiName: "container-queries", fallbackName: "CSS Container Queries (@container)" },
  { pattern: /content-visibility\s*:/gi, apiName: "content-visibility", fallbackName: "content-visibility" },
  { pattern: /clamp\s*\(/gi, apiName: "css-math-functions", fallbackName: "clamp()" },
  { pattern: /:has\s*\(/gi, apiName: "css-has", fallbackName: ":has() selector" },
  { pattern: /background-clip\s*:\s*text/gi, apiName: "background-clip-text", fallbackName: "background-clip: text" },
  { pattern: /@layer\s+/gi, apiName: "cascade-layers", fallbackName: "CSS Cascade Layers (@layer)" },
  { pattern: /aspect-ratio\s*:/gi, apiName: "aspect-ratio", fallbackName: "aspect-ratio" },
  { pattern: /:is\s*\(/gi, apiName: "css-is", fallbackName: ":is() selector" },
  { pattern: /:where\s*\(/gi, apiName: "css-where", fallbackName: ":where() selector" },
  { pattern: /gap\s*:/gi, apiName: "flexbox-gap", fallbackName: "Flexbox gap" },
  { pattern: /@supports\s+/gi, apiName: "css-supports", fallbackName: "@supports" },
  { pattern: /grid-template-columns\s*:/gi, apiName: "css-grid", fallbackName: "CSS Grid" },
]

// JavaScript feature patterns
const JS_FEATURE_PATTERNS = [
  { pattern: /new\s+URLPattern\s*\(/gi, apiName: "urlpattern", fallbackName: "URLPattern API" },
  { pattern: /\?\.\s*\w+/g, apiName: "optional-chaining", fallbackName: "Optional Chaining (?.)" },
  { pattern: /\?\?/g, apiName: "nullish-coalescing", fallbackName: "Nullish Coalescing (??)" },
  { pattern: /^(?!.*function).*await\s+/gm, apiName: "top-level-await", fallbackName: "Top-level await" },
  { pattern: /\bstructuredClone\s*\(/gi, apiName: "structuredclone", fallbackName: "structuredClone()" },
  { pattern: /Array\.prototype\.at\s*\(|\.at\s*\(/gi, apiName: "array-at", fallbackName: "Array.prototype.at()" },
  { pattern: /Object\.hasOwn\s*\(/gi, apiName: "object-hasown", fallbackName: "Object.hasOwn()" },
  { pattern: /Promise\.allSettled\s*\(/gi, apiName: "promise-allsettled", fallbackName: "Promise.allSettled()" },
  { pattern: /\bimport\.meta\b/gi, apiName: "import-meta", fallbackName: "import.meta" },
  { pattern: /BigInt\s*\(/gi, apiName: "bigint", fallbackName: "BigInt" },
]

export async function detectCSSFeatures(code: string): Promise<DetectedFeature[]> {
  const features: DetectedFeature[] = []
  const lines = code.split("\n")

  for (const featurePattern of CSS_FEATURE_PATTERNS) {
    for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
      const line = lines[lineIndex]
      const matches = line.matchAll(featurePattern.pattern)

      for (const match of matches) {
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
      }
    }
  }

  return features
}

export async function detectJavaScriptFeatures(code: string): Promise<DetectedFeature[]> {
  const features: DetectedFeature[] = []
  const lines = code.split("\n")

  for (const featurePattern of JS_FEATURE_PATTERNS) {
    for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
      const line = lines[lineIndex]
      const matches = line.matchAll(featurePattern.pattern)

      for (const match of matches) {
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

export function findFeatureAtPosition(
  code: string,
  line: number,
  column: number,
  language: string,
): DetectedFeature | null {
  const features = detectFeatures(code, language)

  // Find feature at the given position
  for (const feature of features) {
    if (feature.line === line) {
      // Simple check - if the column is near the feature, return it
      // In a real implementation, we'd check the exact range
      return feature
    }
  }

  return null
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

export function getFeatureRecommendations(features: DetectedFeature[]): Array<{ feature: string; suggestion: string }> {
  const recommendations: Array<{ feature: string; suggestion: string }> = []

  features.forEach((feature) => {
    if (feature.status === "limited_availability") {
      if (feature.name.includes("URLPattern")) {
        recommendations.push({
          feature: feature.name,
          suggestion: "Consider using a polyfill like 'urlpattern-polyfill' or use traditional URL parsing with RegExp",
        })
      }
    }
  })

  // Add general recommendations
  const limitedCount = features.filter((f) => f.status === "limited_availability").length
  if (limitedCount > 0 && recommendations.length === 0) {
    recommendations.push({
      feature: "Limited Features Detected",
      suggestion: "Consider adding polyfills or using progressive enhancement for better browser support",
    })
  }

  return recommendations
}
