interface ItineraryRequest {
  destinations: string[]
  duration: number
  startDate: string
  endDate: string
  budget: string
  travelStyle: string
  interests: string[]
}

interface LocationRecommendations {
  restaurants: Array<{
    name: string
    cuisine: string
    priceRange: string
    description: string
    location: string
    mustTry: string[]
  }>
  sightseeing: Array<{
    name: string
    type: string
    description: string
    duration: string
    bestTime: string
    ticketPrice: string
  }>
  transportation: {
    fromPrevious?: {
      modes: string[]
      duration: string
      cost: string
      recommendations: string
    }
    local: {
      modes: string[]
      tips: string[]
    }
  }
  nightlife: Array<{
    name: string
    type: string
    description: string
    priceRange: string
  }>
  shopping: Array<{
    name: string
    type: string
    description: string
    specialties: string[]
  }>
  tips: string[]
}

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

export class OpenAIService {
  async getLocationRecommendations(destination: string, previousDestination?: string): Promise<LocationRecommendations> {
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
      
      const response = await fetch(`${supabaseUrl}/functions/v1/location-recommendations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseAnonKey}`,
        },
        body: JSON.stringify({ destination, previousDestination }),
      })

      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`)
      }

      const data = await response.json()
      return data
    } catch (error) {
      console.error('Error getting location recommendations:', error)
      return this.createFallbackRecommendations(destination)
    }
  }

  async chatWithAssistant(messages: ChatMessage[]): Promise<string> {
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
      
      const response = await fetch(`${supabaseUrl}/functions/v1/travel-chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseAnonKey}`,
        },
        body: JSON.stringify({ messages }),
      })

      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`)
      }

      const data = await response.json()
      return data.response
    } catch (error) {
      console.error('Error in chat:', error)
      return "I'm sorry, I'm having trouble connecting right now. Please try again later."
    }
  }

  async generateItinerary(request: ItineraryRequest): Promise<any> {
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
      
      const response = await fetch(`${supabaseUrl}/functions/v1/generate-itinerary`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseAnonKey}`,
        },
        body: JSON.stringify(request),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `API error: ${response.statusText}`)
      }

      const data = await response.json()
      return data
    } catch (error) {
      console.error('Error generating itinerary:', error)
      // Return fallback itinerary if API fails
      return this.createFallbackItinerary(request)
    }
  }

  private createFallbackItinerary(request: ItineraryRequest): any {
    const startDate = new Date(request.startDate)
    const days = []
    
    for (let i = 0; i < request.duration; i++) {
      const currentDate = new Date(startDate.getTime() + (i * 24 * 60 * 60 * 1000))
      const destinationIndex = Math.floor(i / Math.ceil(request.duration / request.destinations.length))
      const destination = request.destinations[destinationIndex] || request.destinations[0]
      
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
      totalEstimatedCost: request.duration * 115,
      travelTips: [
        "Pack light and bring comfortable walking shoes",
        "Keep copies of important documents",
        "Learn basic phrases in the local language"
      ],
      packingRecommendations: [
        "Comfortable walking shoes",
        "Weather-appropriate clothing",
        "Portable charger"
      ]
    }
  }

  private createFallbackRecommendations(destination: string): LocationRecommendations {
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
}

export const createOpenAIService = () => new OpenAIService()