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

interface HotelRecommendation {
  name: string
  category: 'budget' | 'mid-range' | 'luxury'
  priceRange: string
  location: string
  amenities: string[]
  rating: number
  bookingTips: string
  address: string
}

interface RestaurantRecommendation {
  name: string
  cuisine: string
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack'
  priceRange: string
  specialties: string[]
  location: string
  reservationRequired: boolean
  rating: number
  dietaryOptions: string[]
}

interface AttractionRecommendation {
  name: string
  type: string
  description: string
  duration: string
  bestTime: string
  ticketPrice: string
  location: string
  crowdLevel: 'low' | 'moderate' | 'high' | 'very_high'
  accessibility: string[]
  tips: string[]
}

interface TransportRecommendation {
  mode: string
  description: string
  cost: string
  duration: string
  bookingInfo: string
  tips: string[]
  accessibility: string[]
}

interface DetailedDestinationPlan {
  destination: string
  overview: string
  bestTimeToVisit: string
  safetyRating: number
  safetyTips: string[]
  culturalTips: string[]
  hotels: HotelRecommendation[]
  restaurants: RestaurantRecommendation[]
  attractions: AttractionRecommendation[]
  transportation: {
    airport: TransportRecommendation[]
    local: TransportRecommendation[]
    intercity: TransportRecommendation[]
  }
  dailyItinerary: Array<{
    day: number
    date: string
    theme: string
    morning: {
      time: string
      activity: string
      location: string
      cost: string
      tips: string[]
    }
    lunch: {
      restaurant: string
      cuisine: string
      cost: string
      specialties: string[]
    }
    afternoon: {
      time: string
      activity: string
      location: string
      cost: string
      tips: string[]
    }
    dinner: {
      restaurant: string
      cuisine: string
      cost: string
      specialties: string[]
    }
    evening: {
      activity: string
      location: string
      cost: string
      tips: string[]
    }
  }>
  costBreakdown: {
    accommodation: { min: number; max: number }
    food: { min: number; max: number }
    activities: { min: number; max: number }
    transport: { min: number; max: number }
    total: { min: number; max: number }
  }
  packingList: string[]
  emergencyInfo: {
    emergencyNumber: string
    hospitals: string[]
    embassies: string[]
    importantPhones: string[]
  }
}

export class ComprehensiveAIService {
  private supabaseUrl: string
  private supabaseAnonKey: string

  constructor() {
    this.supabaseUrl = import.meta.env.VITE_SUPABASE_URL
    this.supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
  }

  async generateDetailedItinerary(request: DetailedItineraryRequest): Promise<DetailedDestinationPlan> {
    try {
      const response = await fetch(`${this.supabaseUrl}/functions/v1/comprehensive-itinerary`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.supabaseAnonKey}`,
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
      console.error('Error generating comprehensive itinerary:', error)
      return this.createFallbackItinerary(request)
    }
  }

  async getDestinationSuggestions(query: string): Promise<Array<{
    name: string
    country: string
    continent: string
    description: string
    popularFor: string[]
    bestTime: string
    coordinates: { lat: number; lng: number }
    popularityScore: number
  }>> {
    try {
      const response = await fetch(`${this.supabaseUrl}/functions/v1/destination-suggestions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.supabaseAnonKey}`,
        },
        body: JSON.stringify({ query }),
      })

      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`)
      }

      const data = await response.json()
      return data.suggestions
    } catch (error) {
      console.error('Error getting destination suggestions:', error)
      return this.getFallbackSuggestions(query)
    }
  }

  async chatWithTravelExpert(messages: Array<{ role: string; content: string }>): Promise<string> {
    try {
      const response = await fetch(`${this.supabaseUrl}/functions/v1/travel-expert-chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.supabaseAnonKey}`,
        },
        body: JSON.stringify({ messages }),
      })

      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`)
      }

      const data = await response.json()
      return data.response
    } catch (error) {
      console.error('Error in travel expert chat:', error)
      return "I'm having trouble connecting right now. Please try asking about specific destinations, hotels, restaurants, or travel tips!"
    }
  }

  private createFallbackItinerary(request: DetailedItineraryRequest): DetailedDestinationPlan {
    return {
      destination: request.destination,
      overview: `${request.destination} is a wonderful destination with rich culture and attractions.`,
      bestTimeToVisit: "Year-round",
      safetyRating: 8,
      safetyTips: [
        "Keep your belongings secure",
        "Stay aware of your surroundings",
        "Use official transportation"
      ],
      culturalTips: [
        "Learn basic local phrases",
        "Respect local customs",
        "Dress appropriately for religious sites"
      ],
      hotels: [
        {
          name: "Central Hotel",
          category: request.budget,
          priceRange: request.budget === 'budget' ? '$50-100' : request.budget === 'mid-range' ? '$100-200' : '$200+',
          location: "City Center",
          amenities: ["WiFi", "Breakfast", "AC"],
          rating: 4.2,
          bookingTips: "Book in advance for better rates",
          address: `Main Street, ${request.destination}`
        }
      ],
      restaurants: [
        {
          name: "Local Favorite",
          cuisine: "Local",
          mealType: "lunch",
          priceRange: "$15-25",
          specialties: ["Local specialty dish"],
          location: "Downtown",
          reservationRequired: false,
          rating: 4.5,
          dietaryOptions: ["Vegetarian options available"]
        }
      ],
      attractions: [
        {
          name: `${request.destination} Main Attraction`,
          type: "Historical Site",
          description: `Must-visit landmark in ${request.destination}`,
          duration: "2-3 hours",
          bestTime: "Morning",
          ticketPrice: "$15-25",
          location: "City Center",
          crowdLevel: "moderate",
          accessibility: ["Wheelchair accessible"],
          tips: ["Arrive early to avoid crowds"]
        }
      ],
      transportation: {
        airport: [
          {
            mode: "Taxi",
            description: "Direct transport from airport",
            cost: "$25-40",
            duration: "30-45 minutes",
            bookingInfo: "Available at airport",
            tips: ["Use official taxi services"],
            accessibility: ["Wheelchair accessible vehicles available"]
          }
        ],
        local: [
          {
            mode: "Public Transport",
            description: "Efficient city transport system",
            cost: "$2-5 per ride",
            duration: "Varies",
            bookingInfo: "Buy tickets at stations",
            tips: ["Get a day pass for savings"],
            accessibility: ["Most stations accessible"]
          }
        ],
        intercity: [
          {
            mode: "Train",
            description: "Comfortable intercity travel",
            cost: "$20-50",
            duration: "2-4 hours",
            bookingInfo: "Book online or at station",
            tips: ["Book in advance for better prices"],
            accessibility: ["Accessible carriages available"]
          }
        ]
      },
      dailyItinerary: Array.from({ length: request.duration }, (_, i) => ({
        day: i + 1,
        date: new Date(new Date(request.startDate).getTime() + i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        theme: i === 0 ? "Arrival & Exploration" : `Day ${i + 1} Adventures`,
        morning: {
          time: "09:00",
          activity: `Explore ${request.destination}`,
          location: "City Center",
          cost: "$10-20",
          tips: ["Start early to avoid crowds"]
        },
        lunch: {
          restaurant: "Local Bistro",
          cuisine: "Local",
          cost: "$15-25",
          specialties: ["Traditional dish", "Local favorite"]
        },
        afternoon: {
          time: "14:00",
          activity: "Cultural Experience",
          location: "Museum District",
          cost: "$15-30",
          tips: ["Check for student discounts"]
        },
        dinner: {
          restaurant: "Evening Restaurant",
          cuisine: "International",
          cost: "$25-40",
          specialties: ["Chef's special", "Local wine"]
        },
        evening: {
          activity: "Evening Stroll",
          location: "Historic District",
          cost: "Free",
          tips: ["Great for photos"]
        }
      })),
      costBreakdown: {
        accommodation: { min: 50 * request.duration, max: 200 * request.duration },
        food: { min: 40 * request.duration, max: 100 * request.duration },
        activities: { min: 30 * request.duration, max: 80 * request.duration },
        transport: { min: 20 * request.duration, max: 60 * request.duration },
        total: { min: 140 * request.duration, max: 440 * request.duration }
      },
      packingList: [
        "Comfortable walking shoes",
        "Weather-appropriate clothing",
        "Portable charger",
        "Travel adapter",
        "First aid kit",
        "Sunscreen",
        "Camera"
      ],
      emergencyInfo: {
        emergencyNumber: "911",
        hospitals: [`${request.destination} General Hospital`],
        embassies: ["Contact your embassy"],
        importantPhones: ["Tourist helpline: 123-456-7890"]
      }
    }
  }

  private getFallbackSuggestions(query: string) {
    const fallbackDestinations = [
      {
        name: "Paris",
        country: "France",
        continent: "Europe",
        description: "City of Light and Love",
        popularFor: ["Art", "Culture", "Romance", "Food"],
        bestTime: "Apr-Jun, Sep-Oct",
        coordinates: { lat: 48.8566, lng: 2.3522 },
        popularityScore: 100
      },
      {
        name: "Tokyo",
        country: "Japan",
        continent: "Asia",
        description: "Modern Metropolis",
        popularFor: ["Technology", "Food", "Culture", "Shopping"],
        bestTime: "Mar-May, Sep-Nov",
        coordinates: { lat: 35.6762, lng: 139.6503 },
        popularityScore: 95
      },
      {
        name: "New York",
        country: "United States",
        continent: "North America",
        description: "The Big Apple",
        popularFor: ["Culture", "Broadway", "Food", "Museums"],
        bestTime: "Apr-Jun, Sep-Nov",
        coordinates: { lat: 40.7128, lng: -74.0060 },
        popularityScore: 90
      }
    ]

    return fallbackDestinations.filter(dest =>
      dest.name.toLowerCase().includes(query.toLowerCase()) ||
      dest.country.toLowerCase().includes(query.toLowerCase()) ||
      dest.popularFor.some(tag => tag.toLowerCase().includes(query.toLowerCase()))
    )
  }
}

export const comprehensiveAIService = new ComprehensiveAIService()