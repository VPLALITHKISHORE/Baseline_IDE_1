import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { message, context } = await req.json();

    // Get compatibility data from WebStatus.dev API
    const compatData = await getCompatibilityData(message);

    // Call language model (OpenAI/Anthropic/local)
    const response = await generateResponse(message, compatData, context);

    return NextResponse.json({
      response,
      compatibilityData: compatData
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
}

async function getCompatibilityData(query: string) {
  // Extract feature name from query
  const feature = extractFeatureName(query);
  
  // Fetch from WebStatus.dev API
  const response = await fetch(
    `https://api.webstatus.dev/v1/features/${feature}`
  );
  
  if (!response.ok) return null;
  return await response.json();
}

async function generateResponse(
  message: string,
  compatData: any,
  context: any
) {
  // Call your AI model API (OpenAI, Anthropic, etc.)
  const prompt = `You are a browser compatibility expert. 
    User question: ${message}
    Compatibility data: ${JSON.stringify(compatData)}
    Current context: ${JSON.stringify(context)}
    Provide baseline-safe recommendations.`;

  // Return AI-generated response
  return "Your AI response here based on the prompt";
}

function extractFeatureName(query: string): string {
  // Simple extraction logic - enhance with NLP
  const features = ['grid', 'flexbox', 'container-queries', 'content-visibility'];
  return features.find(f => query.toLowerCase().includes(f)) || '';
}
