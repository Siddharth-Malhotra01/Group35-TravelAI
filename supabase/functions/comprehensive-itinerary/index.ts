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

interface DetailedItineraryRequest {
  destination: string
  duration: number
  startDate: string
  budget: 'budget' | 'mid-range' | 'luxury'
  travelStyle: 'relaxed' | 'balanced' | 'packed'
  interests: string[]
  groupSize: number
  accessibility?: string[]
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
    const request: DetailedItineraryRequest = await req.json()

    const openaiApiKey = Deno.env.get('OPENAI_API_KEY')
    if (!openaiApiKey) {
      throw new Error('OpenAI API key not configured')
    }

    const systemPrompt = `You are an expert travel concierge with deep local knowledge of destinations worldwide. Create comprehensive, minute-by-minute travel itineraries that include specific recommendations for:

1. ACCOMMODATIONS: Specific hotel names with price ranges, locations, amenities, and booking tips
2. DINING: Exact restaurant names for breakfast, lunch, and dinner with specialties, prices, and reservation info
3. ATTRACTIONS: Specific places to visit with opening hours, ticket prices, crowd levels, and insider tips
4. TRANSPORTATION: Detailed commute options (airport transfers, local transport, intercity travel) with costs and booking info
5. CULTURAL INSIGHTS: Local customs, etiquette, safety tips, and cultural do's and don'ts
6. COST BREAKDOWN: Detailed budget estimates for all categories
7. PRACTICAL INFO: Emergency contacts, packing lists, weather considerations

Format your response as a detailed JSON object with this structure:
{
  "destination": "City Name",
  "overview": "Brief destination overview",
  "bestTimeToVisit": "Optimal months",
  "safetyRating": 8,
  "safetyTips": ["tip1", "tip2"],
  "culturalTips": ["tip1", "tip2"],
  "hotels": [
    {
      "name": "Specific Hotel Name",
      "category": "budget|mid-range|luxury",
      "priceRange": "$50-100 per night",
      "location": "Specific area/district",
      "amenities": ["WiFi", "Breakfast", "Pool"],
      "rating": 4.2,
      "bookingTips": "Book 2 months ahead for best rates",
      "address": "Exact address"
    }
  ],
  "restaurants": [
    {
      "name": "Specific Restaurant Name",
      "cuisine": "Italian",
      "mealType": "lunch",
      "priceRange": "$15-25",
      "specialties": ["Pasta Carbonara", "Tiramisu"],
      "location": "District name",
      "reservationRequired": true,
      "rating": 4.5,
      "dietaryOptions": ["Vegetarian", "Gluten-free"]
    }
  ],
  "attractions": [
    {
      "name": "Specific Attraction Name",
      "type": "Museum",
      "description": "What makes it special",
      "duration": "2-3 hours",
      "bestTime": "Morning to avoid crowds",
      "ticketPrice": "$15 adults, $10 students",
      "location": "Exact address or area",
      "crowdLevel": "moderate",
      "accessibility": ["Wheelchair accessible"],
      "tips": ["Buy tickets online", "Free on Sundays"]
    }
  ],
  "transportation": {
    "airport": [
      {
        "mode": "Express Train",
        "description": "Fastest option to city center",
        "cost": "$12",
        "duration": "35 minutes",
        "bookingInfo": "Buy at airport or online",
        "tips": ["Runs every 15 minutes"],
        "accessibility": ["Wheelchair accessible"]
      }
    ],
    "local": [
      {
        "mode": "Metro",
        "description": "Comprehensive subway system",
        "cost": "$2.50 per ride, $12 day pass",
        "duration": "Varies",
        "bookingInfo": "Buy at stations or use app",
        "tips": ["Download city transport app"],
        "accessibility": ["Most stations accessible"]
      }
    ],
    "intercity": [
      {
        "mode": "High-speed rail",
        "description": "Connect to nearby cities",
        "cost": "$25-60",
        "duration": "1-3 hours",
        "bookingInfo": "Book online 30 days ahead",
        "tips": ["Cheaper on weekdays"],
        "accessibility": ["Accessible carriages available"]
      }
    ]
  },
  "dailyItinerary": [
    {
      "day": 1,
      "date": "2024-03-15",
      "theme": "Arrival & Historic Center",
      "morning": {
        "time": "09:00",
        "activity": "Walking tour of Old Town",
        "location": "Historic District",
        "cost": "$20",
        "tips": ["Wear comfortable shoes", "Bring water"]
      },
      "lunch": {
        "restaurant": "Specific Restaurant Name",
        "cuisine": "Local",
        "cost": "$18",
        "specialties": ["Local dish name", "Traditional dessert"]
      },
      "afternoon": {
        "time": "14:00",
        "activity": "Visit Main Museum",
        "location": "Museum District",
        "cost": "$15",
        "tips": ["Free audio guide with admission"]
      },
      "dinner": {
        "restaurant": "Specific Evening Restaurant",
        "cuisine": "Fine dining",
        "cost": "$45",
        "specialties": ["Chef's tasting menu", "Local wine pairing"]
      },
      "evening": {
        "activity": "Sunset viewpoint",
        "location": "Specific hill/tower name",
        "cost": "Free",
        "tips": ["Best photos 30 minutes before sunset"]
      }
    }
  ],
  "costBreakdown": {
    "accommodation": {"min": 300, "max": 800},
    "food": {"min": 150, "max": 400},
    "activities": {"min": 100, "max": 250},
    "transport": {"min": 50, "max": 150},
    "total": {"min": 600, "max": 1600}
  },
  "packingList": ["Comfortable walking shoes", "Weather-appropriate layers"],
  "emergencyInfo": {
    "emergencyNumber": "112",
    "hospitals": ["City General Hospital - 123 Main St"],
    "embassies": ["US Embassy - 456 Embassy Row"],
    "importantPhones": ["Tourist Police: +1-234-567-8900"]
  }
}`

    const userPrompt = `Create a comprehensive ${request.duration}-day travel plan for ${request.destination}.

Trip Details:
- Start Date: ${request.startDate}
- Budget Level: ${request.budget}
- Travel Style: ${request.travelStyle}
- Group Size: ${request.groupSize}
- Interests: ${request.interests.join(', ')}
${request.accessibility ? `- Accessibility Needs: ${request.accessibility.join(', ')}` : ''}

Provide specific hotel names, restaurant recommendations with exact dishes, detailed transportation options, and minute-by-minute daily schedules. Include local insider tips, safety advice, and cultural etiquette. Give exact costs and booking information for everything.`

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
        max_tokens: 4000,
      }),
    }, 3)

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`OpenAI API error: ${response.status} ${response.statusText} - ${errorText}`)
    }

    const data = await response.json()
    const content = data.choices[0].message.content

    let itinerary
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        itinerary = JSON.parse(jsonMatch[0])
      } else {
        throw new Error('No JSON found in response')
      }
    } catch (parseError) {
      itinerary = createFallbackItinerary(request)
    }

    return new Response(
      JSON.stringify(itinerary),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )
  } catch (error) {
    console.error('Error generating comprehensive itinerary:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )
  }
})

function createFallbackItinerary(request: DetailedItineraryRequest) {
  return {
    destination: request.destination,
    overview: `${request.destination} offers rich cultural experiences and attractions.`,
    bestTimeToVisit: "Year-round",
    safetyRating: 8,
    safetyTips: ["Stay aware of surroundings", "Use official transportation"],
    culturalTips: ["Learn basic local phrases", "Respect local customs"],
    hotels: [{
      name: "Central Plaza Hotel",
      category: request.budget,
      priceRange: request.budget === 'budget' ? '$60-90' : request.budget === 'mid-range' ? '$120-180' : '$250-400',
      location: "City Center",
      amenities: ["WiFi", "Breakfast", "Concierge"],
      rating: 4.2,
      bookingTips: "Book 2 weeks in advance",
      address: `Main Square, ${request.destination}`
    }],
    restaurants: [{
      name: "Local Heritage Restaurant",
      cuisine: "Traditional",
      mealType: "dinner",
      priceRange: "$25-40",
      specialties: ["Regional specialty", "Traditional dessert"],
      location: "Historic Quarter",
      reservationRequired: true,
      rating: 4.6,
      dietaryOptions: ["Vegetarian options"]
    }],
    attractions: [{
      name: `${request.destination} Cultural Center`,
      type: "Cultural Site",
      description: "Main cultural attraction showcasing local heritage",
      duration: "2-3 hours",
      bestTime: "Morning",
      ticketPrice: "$15-20",
      location: "Cultural District",
      crowdLevel: "moderate",
      accessibility: ["Wheelchair accessible"],
      tips: ["Free guided tours at 10am and 2pm"]
    }],
    transportation: {
      airport: [{
        mode: "Airport Shuttle",
        description: "Direct service to city center",
        cost: "$15-25",
        duration: "45 minutes",
        bookingInfo: "Available at arrivals",
        tips: ["Runs every 30 minutes"],
        accessibility: ["Wheelchair accessible"]
      }],
      local: [{
        mode: "City Bus",
        description: "Comprehensive bus network",
        cost: "$2 per ride",
        duration: "Varies",
        bookingInfo: "Pay on board or use app",
        tips: ["Get a day pass for $8"],
        accessibility: ["Most buses accessible"]
      }],
      intercity: [{
        mode: "Regional Train",
        description: "Connect to nearby destinations",
        cost: "$20-45",
        duration: "1-4 hours",
        bookingInfo: "Book at station or online",
        tips: ["Discounts for advance booking"],
        accessibility: ["Accessible cars available"]
      }]
    },
    dailyItinerary: Array.from({ length: request.duration }, (_, i) => ({
      day: i + 1,
      date: new Date(new Date(request.startDate).getTime() + i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      theme: i === 0 ? "Arrival & Orientation" : `Day ${i + 1} Exploration`,
      morning: {
        time: "09:00",
        activity: `Explore ${request.destination} highlights`,
        location: "City Center",
        cost: "$15",
        tips: ["Start early for better photos"]
      },
      lunch: {
        restaurant: "Midday Café",
        cuisine: "Local",
        cost: "$18",
        specialties: ["Daily special", "Local favorite"]
      },
      afternoon: {
        time: "14:00",
        activity: "Cultural experience",
        location: "Heritage District",
        cost: "$20",
        tips: ["Ask about student discounts"]
      },
      dinner: {
        restaurant: "Evening Bistro",
        cuisine: "Contemporary",
        cost: "$35",
        specialties: ["Chef's special", "Local wine"]
      },
      evening: {
        activity: "Evening walk",
        location: "Waterfront",
        cost: "Free",
        tips: ["Beautiful sunset views"]
      }
    })),
    costBreakdown: {
      accommodation: { min: 60 * request.duration, max: 400 * request.duration },
      food: { min: 50 * request.duration, max: 120 * request.duration },
      activities: { min: 30 * request.duration, max: 80 * request.duration },
      transport: { min: 25 * request.duration, max: 70 * request.duration },
      total: { min: 165 * request.duration, max: 670 * request.duration }
    },
    packingList: [
      "Comfortable walking shoes",
      "Weather-appropriate clothing",
      "Portable charger",
      "Travel documents",
      "Camera",
      "Sunscreen"
    ],
    emergencyInfo: {
      emergencyNumber: "Emergency services",
      hospitals: [`${request.destination} General Hospital`],
      embassies: ["Contact your local embassy"],
      importantPhones: ["Tourist information: Local number"]
    }
  }
}