import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

async function fetchWithRetry(url: string, options: RequestInit, maxRetries = 3): Promise<Response> {
  let lastError: Error
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(url, options)
      
      if ((response.status === 429 || response.status >= 500) && attempt < maxRetries) {
        const delay = Math.pow(2, attempt) * 1000
        console.log(`${response.status === 429 ? 'Rate limited' : 'Server error'}, retrying in ${delay}ms (attempt ${attempt + 1}/${maxRetries + 1})`)
        await new Promise(resolve => setTimeout(resolve, delay))
        continue
      }
      
      return response
    } catch (error) {
      lastError = error as Error
      if (attempt < maxRetries) {
        const delay = Math.pow(2, attempt) * 1000
        console.log(`Request failed, retrying in ${delay}ms (attempt ${attempt + 1}/${maxRetries + 1})`)
        await new Promise(resolve => setTimeout(resolve, delay))
        continue
      }
    }
  }
  
  throw lastError || new Error('Max retries exceeded')
}

interface LocationRequest {
  destination: string
  previousDestination?: string
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { destination, previousDestination }: LocationRequest = await req.json()

    const openaiApiKey = Deno.env.get('OPENAI_API_KEY')
    if (!openaiApiKey) {
      throw new Error('OpenAI API key not configured')
    }

    const systemPrompt = `You are an expert travel assistant with deep knowledge of destinations worldwide. Provide comprehensive, practical recommendations for travelers.

For each destination, provide detailed recommendations in the following JSON format:
{
  "restaurants": [
    {
      "name": "Restaurant name",
      "cuisine": "Cuisine type",
      "priceRange": "$/$$/$$$/$$$$",
      "description": "Brief description",
      "location": "Area/district",
      "mustTry": ["dish1", "dish2"]
    }
  ],
  "sightseeing": [
    {
      "name": "Attraction name",
      "type": "Museum/Monument/Park/etc",
      "description": "What makes it special",
      "duration": "Time needed",
      "bestTime": "Best time to visit",
      "ticketPrice": "Price range or free"
    }
  ],
  "transportation": {
    "fromPrevious": {
      "modes": ["plane", "train", "bus"],
      "duration": "Travel time",
      "cost": "Price range",
      "recommendations": "Best option and tips"
    },
    "local": {
      "modes": ["metro", "bus", "taxi", "walking"],
      "tips": ["tip1", "tip2"]
    }
  },
  "nightlife": [
    {
      "name": "Venue name",
      "type": "Bar/Club/Theater/etc",
      "description": "What to expect",
      "priceRange": "$/$$/$$$/$$$$"
    }
  ],
  "shopping": [
    {
      "name": "Shopping area/market",
      "type": "Market/Mall/Street/etc",
      "description": "What to find there",
      "specialties": ["item1", "item2"]
    }
  ],
  "tips": ["practical tip 1", "cultural tip 2", "safety tip 3"]
}`

    let userPrompt = `Provide comprehensive travel recommendations for ${destination}. Include specific restaurant names, must-visit attractions, transportation options, nightlife, shopping areas, and practical tips.`
    
    if (previousDestination) {
      userPrompt += ` Also include transportation recommendations from ${previousDestination} to ${destination}.`
    }

    const response = await fetchWithRetry('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiApiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: 3000,
      }),
    }, 3)

    if (!response.ok) {
      const errorText = await response.text()
      console.warn(`OpenAI API unavailable: ${response.status} ${response.statusText} - ${errorText}`)
      // Return fallback instead of throwing error
      const fallbackRecommendations = createFallbackRecommendations(destination)
      return new Response(
        JSON.stringify(fallbackRecommendations),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      )
    }

    const data = await response.json()
    const content = data.choices[0].message.content

    let recommendations
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        recommendations = JSON.parse(jsonMatch[0])
      } else {
        throw new Error('No JSON found in response')
      }
    } catch (parseError) {
      recommendations = createFallbackRecommendations(destination)
    }

    return new Response(
      JSON.stringify(recommendations),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )
  } catch (error) {
    console.warn('OpenAI API unavailable, using fallback:', error)
    const fallbackRecommendations = createFallbackRecommendations(destination)
    return new Response(
      JSON.stringify(fallbackRecommendations),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )
  }
})

function createFallbackRecommendations(destination: string) {
  return {
    restaurants: [
      {
        name: "Local Favorite Restaurant",
        cuisine: "Local",
        priceRange: "$$",
        description: `Popular local restaurant in ${destination}`,
        location: "City Center",
        mustTry: ["Local specialty dish", "Traditional dessert"]
      }
    ],
    sightseeing: [
      {
        name: `${destination} Main Attraction`,
        type: "Historical Site",
        description: `Must-visit landmark in ${destination}`,
        duration: "2-3 hours",
        bestTime: "Morning",
        ticketPrice: "Varies"
      }
    ],
    transportation: {
      local: {
        modes: ["Walking", "Public Transport", "Taxi"],
        tips: ["Use local transport apps", "Keep small change handy"]
      }
    },
    nightlife: [
      {
        name: "Local Bar District",
        type: "Entertainment Area",
        description: `Popular nightlife area in ${destination}`,
        priceRange: "$$"
      }
    ],
    shopping: [
      {
        name: "Local Market",
        type: "Traditional Market",
        description: `Traditional shopping area in ${destination}`,
        specialties: ["Local crafts", "Souvenirs"]
      }
    ],
    tips: [
      "Learn basic local phrases",
      "Carry local currency",
      "Respect local customs"
    ]
  }
}