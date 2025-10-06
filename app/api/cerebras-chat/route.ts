import { NextRequest, NextResponse } from "next/server"

const CEREBRAS_API_KEY = "csk-kr689fm3nj352frn28hmvmmdkj559dc83ytd96ff449x333k"
const CEREBRAS_API_URL = "https://api.cerebras.ai/v1/chat/completions"
const WEBSTATUS_API_URL = "https://api.webstatus.dev/v1/features"

export async function POST(req: NextRequest) {
  try {
    const { message, history } = await req.json()

    // Fetch browser compatibility data
    const compatibilityContext = await fetchCompatibilityData(message)

    // Build conversation history for context
    const messages = [
      {
        role: "system",
        content: `You are an expert coding assistant specializing in web development and browser compatibility. 

You have access to real-time browser compatibility data from WebStatus.dev. When users ask about CSS, JavaScript, or HTML features, provide:
1. Clear explanations of the feature
2. Current browser support status (Baseline status: "widely" or "newly" available)
3. Specific browser versions that support it
4. Code examples when relevant
5. Alternative solutions if compatibility is limited

Always prioritize web standards and best practices. Be concise but thorough.

${compatibilityContext ? `Current compatibility data for this query:\n${JSON.stringify(compatibilityContext, null, 2)}` : ''}`
      },
      // Add conversation history (last 5 messages for context)
      ...history.slice(-5).map((msg: any) => ({
        role: msg.role,
        content: msg.content
      })),
      // Add current message
      {
        role: "user",
        content: message
      }
    ]

    console.log("Sending request to Cerebras API...")

    // Call Cerebras API
    const response = await fetch(CEREBRAS_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${CEREBRAS_API_KEY}`
      },
      body: JSON.stringify({
        model: "qwen-3-coder-480b",
        messages: messages,
        max_tokens: 2000,
        temperature: 0.7,
        top_p: 0.95,
        stream: false
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("Cerebras API error:", errorText)
      throw new Error(`Cerebras API error: ${response.status}`)
    }

    const data = await response.json()
    console.log("Cerebras API response received")
    
    return NextResponse.json({
      response: data.choices[0].message.content,
      compatibilityData: compatibilityContext,
      model: data.model,
      usage: data.usage
    })

  } catch (error) {
    console.error("Chat API error:", error)
    return NextResponse.json(
      { 
        error: "Failed to process chat request",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    )
  }
}

async function fetchCompatibilityData(query: string) {
  try {
    // Extract feature keywords from query
    const features = extractFeatureKeywords(query)
    
    if (features.length === 0) return null

    // Fetch all features from WebStatus.dev
    const response = await fetch(WEBSTATUS_API_URL)
    if (!response.ok) return null

    const data = await response.json()
    
    // Find matching features
    const matchedFeatures = data.data.filter((feature: any) => 
      features.some(keyword => 
        feature.feature_id.includes(keyword) || 
        feature.name.toLowerCase().includes(keyword.toLowerCase())
      )
    ).slice(0, 3) // Limit to 3 most relevant features

    return matchedFeatures.length > 0 ? matchedFeatures : null

  } catch (error) {
    console.error("WebStatus API error:", error)
    return null
  }
}

function extractFeatureKeywords(query: string): string[] {
  const lowerQuery = query.toLowerCase()
  
  // Common web features mapping
  const featurePatterns: Record<string, string[]> = {
    'content-visibility': ['content-visibility', 'content visibility'],
    'container': ['container queries', 'container query', '@container', 'container-type'],
    'grid': ['css grid', 'grid layout', 'display: grid', 'display grid'],
    'flexbox': ['flexbox', 'flex', 'display: flex', 'display flex'],
    'urlpattern': ['urlpattern', 'url pattern'],
    'popover': ['popover', 'pop over'],
    'dialog': ['dialog', 'modal', '<dialog>'],
    'has': [':has', 'has selector', 'has()'],
    'nesting': ['css nesting', 'nested css', 'nest'],
    'view-transitions': ['view transitions', 'view transition'],
    'scroll': ['scroll animation', 'scroll timeline', 'scroll-driven'],
    'anchor': ['anchor', 'position anchor', 'anchor positioning'],
    'subgrid': ['subgrid', 'grid subgrid'],
    'aspect-ratio': ['aspect-ratio', 'aspect ratio'],
    'color-mix': ['color-mix', 'color mix'],
    'scroll-snap': ['scroll snap', 'scroll-snap'],
    'backdrop-filter': ['backdrop-filter', 'backdrop blur'],
    'object-fit': ['object-fit', 'object fit'],
    'clip-path': ['clip-path', 'clip path'],
    'fetch': ['fetch priority', 'fetchpriority'],
    'ruby': ['ruby-align', 'ruby-position', 'ruby'],
    'scrollbar': ['scrollbar-gutter', 'scrollbar-width'],
    'iterator': ['iterator', 'iterator methods'],
    'promise': ['promise.try', 'promise try'],
    'intl': ['intl.durationformat', 'duration format'],
    'float16': ['float16array', 'float16'],
    'regexp': ['regexp.escape', 'regexp escape'],
    'json': ['json modules', 'json import'],
    'wasm': ['webassembly', 'wasm']
  }

  const keywords: string[] = []

  for (const [featureId, patterns] of Object.entries(featurePatterns)) {
    if (patterns.some(pattern => lowerQuery.includes(pattern))) {
      keywords.push(featureId)
    }
  }

  return keywords
}
