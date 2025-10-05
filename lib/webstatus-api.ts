// Web Platform Dashboard API client
// API Documentation: https://api.webstatus.dev/v1/features

export interface BrowserImplementationData {
  version?: string
  status: "available" | "unavailable" | "partial"
  date?: string
}

export interface BaselineStatus {
  status: "widely" | "newly" | "limited" | null
  low_date?: string
  high_date?: string
}

export interface WebFeature {
  feature_id: string
  name: string
  description?: string
  spec?: string
  caniuse?: string
  mdn_url?: string
  baseline?: BaselineStatus
  browser_implementations?: {
    [browserName: string]: BrowserImplementationData
  }
  usage_stats?: {
    [browser: string]: number
  }
}

// Cache for API responses
const featureCache = new Map<string, WebFeature>()
let allFeaturesCache: WebFeature[] | null = null
let cacheTimestamp = 0
const CACHE_DURATION = 1000 * 60 * 30 // 30 minutes

export async function fetchAllFeatures(): Promise<WebFeature[]> {
  console.log("[v0] Fetching all features from Web Platform Dashboard API")

  // Check cache
  const now = Date.now()
  if (allFeaturesCache && now - cacheTimestamp < CACHE_DURATION) {
    console.log("[v0] Returning cached features:", allFeaturesCache.length)
    return allFeaturesCache
  }

  try {
    const response = await fetch("https://api.webstatus.dev/v1/features")

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`)
    }

    const data = await response.json()
    console.log("[v0] API response received:", data)

    // The API returns an object with a 'data' array
    const features: WebFeature[] = data.data || []

    // Cache the results
    allFeaturesCache = features
    cacheTimestamp = now

    // Also cache individual features
    features.forEach((feature) => {
      featureCache.set(feature.feature_id, feature)
    })

    console.log("[v0] Cached", features.length, "features")
    return features
  } catch (error) {
    console.error("[v0] Error fetching features from API:", error)
    // Return empty array on error
    return []
  }
}

export async function searchFeatureByName(name: string): Promise<WebFeature | null> {
  console.log("[v0] Searching for feature:", name)

  const features = await fetchAllFeatures()

  // Try exact match first
  let feature = features.find((f) => f.name.toLowerCase() === name.toLowerCase())

  // Try partial match
  if (!feature) {
    feature = features.find(
      (f) =>
        f.name.toLowerCase().includes(name.toLowerCase()) || f.feature_id.toLowerCase().includes(name.toLowerCase()),
    )
  }

  console.log("[v0] Found feature:", feature?.name || "not found")
  return feature || null
}

export function getBaselineStatusFromFeature(
  feature: WebFeature,
): "widely_available" | "newly_available" | "limited_availability" | "unknown" {
  if (!feature.baseline) {
    return "unknown"
  }

  switch (feature.baseline.status) {
    case "widely":
      return "widely_available"
    case "newly":
      return "newly_available"
    case "limited":
      return "limited_availability"
    default:
      return "unknown"
  }
}

export function getBrowserSupportFromFeature(feature: WebFeature): {
  chrome?: string
  firefox?: string
  safari?: string
  edge?: string
} {
  const support: any = {}

  if (feature.browser_implementations) {
    Object.entries(feature.browser_implementations).forEach(([browserName, impl]) => {
      const browserKey = browserName.toLowerCase()

      if (impl.status === "available" && impl.version) {
        if (browserKey.includes("chrome") && !browserKey.includes("android")) {
          support.chrome = impl.version
        } else if (browserKey.includes("firefox") && !browserKey.includes("android")) {
          support.firefox = impl.version
        } else if (browserKey.includes("safari") && !browserKey.includes("ios")) {
          support.safari = impl.version
        } else if (browserKey.includes("edge")) {
          support.edge = impl.version
        }
      } else if (impl.status === "unavailable") {
        if (browserKey.includes("chrome") && !browserKey.includes("android")) {
          support.chrome = "❌"
        } else if (browserKey.includes("firefox") && !browserKey.includes("android")) {
          support.firefox = "❌"
        } else if (browserKey.includes("safari") && !browserKey.includes("ios")) {
          support.safari = "❌"
        } else if (browserKey.includes("edge")) {
          support.edge = "❌"
        }
      }
    })
  }

  return support
}

export function getBaselineDate(feature: WebFeature): string | null {
  if (!feature.baseline) return null

  // Return the high_date (when it became widely available) or low_date (when it became newly available)
  return feature.baseline.high_date || feature.baseline.low_date || null
}

export async function getFeatureStats(): Promise<{
  total: number
  widelyAvailable: number
  newlyAvailable: number
  limited: number
  unknown: number
}> {
  const features = await fetchAllFeatures()

  const stats = {
    total: features.length,
    widelyAvailable: 0,
    newlyAvailable: 0,
    limited: 0,
    unknown: 0,
  }

  features.forEach((feature) => {
    const status = getBaselineStatusFromFeature(feature)
    switch (status) {
      case "widely_available":
        stats.widelyAvailable++
        break
      case "newly_available":
        stats.newlyAvailable++
        break
      case "limited_availability":
        stats.limited++
        break
      default:
        stats.unknown++
    }
  })

  return stats
}
