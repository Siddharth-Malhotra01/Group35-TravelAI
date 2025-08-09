import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

async function fetchWithRetry(url: string, options: RequestInit, maxRetries = 3): Promise<Response> {
  let lastError: Error
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(url, options)
      
      // If we get a rate limit error or server error, wait and retry
      if ((response.status === 429 || response.status >= 500) && attempt < maxRetries) {
        const delay = Math.pow(2, attempt) * 1000 // Exponential backoff: 1s, 2s, 4s
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

interface OpenAIMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

interface ItineraryRequest {
  destinations: string[]
  duration: number
  startDate: string
  endDate: string
  budget: string
  travelStyle: string
  interests: string[]
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
    const { destinations, duration, startDate, endDate, budget, travelStyle, interests }: ItineraryRequest = await req.json()

    const openaiApiKey = Deno.env.get('OPENAI_API_KEY')
    if (!openaiApiKey) {
      throw new Error('OpenAI API key not configured')
    }

    const systemPrompt = `You are an expert AI travel assistant. Your goal is to help users build realistic, personalized travel itineraries by providing accurate, helpful suggestions. You understand how to plan travel using data from places, maps, travel times, and user preferences.

Create a detailed day-by-day itinerary that includes:
- Morning, afternoon, and evening activities
- Realistic travel times between locations
- Local restaurants and dining recommendations
- Cultural attractions and experiences
- Transportation suggestions
- Practical tips and notes

Format your response as a structured JSON object with the following structure:
{
  "days": [
    {
      "day": 1,
      "date": "YYYY-MM-DD",
      "destination": "destination name",
      "activities": [
        {
          "time": "09:00",
          "endTime": "11:00",
          "title": "Activity title",
          "description": "Detailed description",
          "location": "Specific location",
          "type": "sightseeing|dining|culture|outdoor|shopping|transport",
          "priceEstimate": 25,
          "tips": "Helpful tips"
        }
      ]
    }
  ],
  "totalEstimatedCost": 500,
  "travelTips": ["tip1", "tip2"],
  "packingRecommendations": ["item1", "item2"]
}`

    const userPrompt = `Plan a ${duration}-day trip covering ${destinations.join(', ')}. 
    
Trip Details:
- Start Date: ${startDate}
- End Date: ${endDate}
- Budget Range: ${budget}
- Travel Style: ${travelStyle}
- Interests: ${interests.join(', ')}

Please provide a comprehensive itinerary with specific recommendations, timing, and practical advice. Make sure to include realistic travel times between destinations and suggest the best transportation methods.`

    const messages: OpenAIMessage[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ]

    const response = await fetchWithRetry('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiApiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages,
        temperature: 0.7,
        max_tokens: 4000,
      }),
    }, 3)

    if (!response.ok) {
      const errorText = await response.text()
      console.warn(`OpenAI API unavailable: ${response.status} ${response.statusText} - ${errorText}`)
      // Return fallback instead of throwing error
      const fallbackItinerary = createFallbackItinerary('', destinations, startDate, duration)
      return new Response(
        JSON.stringify(fallbackItinerary),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      )
    }

    const data = await response.json()
    const content = data.choices[0].message.content

    // Try to parse JSON response
    let itinerary
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        itinerary = JSON.parse(jsonMatch[0])
      } else {
        throw new Error('No JSON found in response')
      }
    } catch (parseError) {
      // Fallback to structured parsing
      itinerary = createFallbackItinerary(content, destinations, startDate, duration)
    }

    return new Response(
      JSON.stringify(itinerary),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )
  } catch (error) {
    console.warn('OpenAI API unavailable, using fallback:', error)
    const fallbackItinerary = createFallbackItinerary('', destinations, startDate, duration)
    return new Response(
      JSON.stringify(fallbackItinerary),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )
  }
})

function createFallbackItinerary(content: string, destinations: string[], startDate: string, duration: number) {
  const days = []
  const startDateObj = new Date(startDate)
  
  for (let i = 0; i < duration; i++) {
    const currentDate = new Date(startDateObj.getTime() + (i * 24 * 60 * 60 * 1000))
    const destinationIndex = Math.floor(i / Math.ceil(duration / destinations.length))
    const destination = destinations[destinationIndex] || destinations[0]
    
    days.push({
      day: i + 1,
      date: currentDate.toISOString().split('T')[0],
      destination,
      activities: [
        {
          time: "09:00",
          endTime: "12:00",
          title: `Explore ${destination}`,
          description: `Start your day exploring the highlights of ${destination}`,
          location: destination,
          type: "sightseeing",
          priceEstimate: 30,
          tips: "Start early to avoid crowds"
        },
        {
          time: "12:00",
          endTime: "14:00",
          title: "Local Lunch",
          description: `Try traditional cuisine in ${destination}`,
          location: `Local restaurant in ${destination}`,
          type: "dining",
          priceEstimate: 25,
          tips: "Ask locals for recommendations"
        },
        {
          time: "14:00",
          endTime: "17:00",
          title: "Cultural Experience",
          description: `Visit museums or cultural sites in ${destination}`,
          location: destination,
          type: "culture",
          priceEstimate: 20,
          tips: "Check for student or group discounts"
        },
        {
          time: "19:00",
          endTime: "21:00",
          title: "Dinner",
          description: `Evening dining experience in ${destination}`,
          location: `Restaurant district in ${destination}`,
          type: "dining",
          priceEstimate: 40,
          tips: "Make reservations in advance"
        }
      ]
    })
  }
  
  return {
    days,
    totalEstimatedCost: duration * 115,
    travelTips: [
      "Pack light and bring comfortable walking shoes",
      "Keep copies of important documents",
      "Learn basic phrases in the local language",
      "Research local customs and etiquette"
    ],
    packingRecommendations: [
      "Comfortable walking shoes",
      "Weather-appropriate clothing",
      "Portable charger",
      "Travel adapter",
      "First aid kit"
    ]
  }
}