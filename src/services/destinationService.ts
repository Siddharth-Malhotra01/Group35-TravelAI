interface PopularDestination {
  name: string
  country: string
  continent: string
  description: string
  popularFor: string[]
  bestTime: string
  coordinates: {
    lat: number
    lng: number
  }
}

export class DestinationService {
  private popularDestinations: PopularDestination[] = [
    // Europe
    { name: "Paris", country: "France", continent: "Europe", description: "City of Light and Love", popularFor: ["Art", "Culture", "Romance"], bestTime: "Apr-Jun, Sep-Oct", coordinates: { lat: 48.8566, lng: 2.3522 } },
    { name: "Rome", country: "Italy", continent: "Europe", description: "Eternal City", popularFor: ["History", "Architecture", "Food"], bestTime: "Apr-Jun, Sep-Oct", coordinates: { lat: 41.9028, lng: 12.4964 } },
    { name: "Barcelona", country: "Spain", continent: "Europe", description: "Gaudi's Masterpiece", popularFor: ["Architecture", "Beaches", "Nightlife"], bestTime: "May-Jun, Sep-Oct", coordinates: { lat: 41.3851, lng: 2.1734 } },
    { name: "Amsterdam", country: "Netherlands", continent: "Europe", description: "Venice of the North", popularFor: ["Canals", "Museums", "Culture"], bestTime: "Apr-May, Sep-Nov", coordinates: { lat: 52.3676, lng: 4.9041 } },
    { name: "London", country: "United Kingdom", continent: "Europe", description: "Historic Capital", popularFor: ["History", "Museums", "Theater"], bestTime: "May-Sep", coordinates: { lat: 51.5074, lng: -0.1278 } },
    { name: "Prague", country: "Czech Republic", continent: "Europe", description: "City of a Hundred Spires", popularFor: ["Architecture", "History", "Beer"], bestTime: "May-Jun, Sep-Oct", coordinates: { lat: 50.0755, lng: 14.4378 } },
    { name: "Vienna", country: "Austria", continent: "Europe", description: "Imperial City", popularFor: ["Music", "Architecture", "Coffee"], bestTime: "Apr-May, Sep-Oct", coordinates: { lat: 48.2082, lng: 16.3738 } },
    { name: "Santorini", country: "Greece", continent: "Europe", description: "Aegean Paradise", popularFor: ["Sunsets", "Beaches", "Romance"], bestTime: "Apr-Jun, Sep-Oct", coordinates: { lat: 36.3932, lng: 25.4615 } },

    // Asia
    { name: "Tokyo", country: "Japan", continent: "Asia", description: "Modern Metropolis", popularFor: ["Technology", "Food", "Culture"], bestTime: "Mar-May, Sep-Nov", coordinates: { lat: 35.6762, lng: 139.6503 } },
    { name: "Kyoto", country: "Japan", continent: "Asia", description: "Ancient Capital", popularFor: ["Temples", "Gardens", "Tradition"], bestTime: "Mar-May, Sep-Nov", coordinates: { lat: 35.0116, lng: 135.7681 } },
    { name: "Bangkok", country: "Thailand", continent: "Asia", description: "City of Angels", popularFor: ["Street Food", "Temples", "Nightlife"], bestTime: "Nov-Mar", coordinates: { lat: 13.7563, lng: 100.5018 } },
    { name: "Singapore", country: "Singapore", continent: "Asia", description: "Garden City", popularFor: ["Food", "Shopping", "Architecture"], bestTime: "Feb-Apr", coordinates: { lat: 1.3521, lng: 103.8198 } },
    { name: "Mumbai", country: "India", continent: "Asia", description: "Bollywood Capital", popularFor: ["Culture", "Food", "Business"], bestTime: "Nov-Feb", coordinates: { lat: 19.0760, lng: 72.8777 } },
    { name: "Delhi", country: "India", continent: "Asia", description: "Capital of India", popularFor: ["History", "Food", "Culture"], bestTime: "Oct-Mar", coordinates: { lat: 28.7041, lng: 77.1025 } },
    { name: "Seoul", country: "South Korea", continent: "Asia", description: "K-Culture Hub", popularFor: ["Technology", "Food", "Culture"], bestTime: "Mar-May, Sep-Nov", coordinates: { lat: 37.5665, lng: 126.9780 } },
    { name: "Hong Kong", country: "Hong Kong", continent: "Asia", description: "Pearl of the Orient", popularFor: ["Skyline", "Food", "Shopping"], bestTime: "Oct-Dec", coordinates: { lat: 22.3193, lng: 114.1694 } },

    // North America
    { name: "New York", country: "United States", continent: "North America", description: "The Big Apple", popularFor: ["Culture", "Broadway", "Food"], bestTime: "Apr-Jun, Sep-Nov", coordinates: { lat: 40.7128, lng: -74.0060 } },
    { name: "Los Angeles", country: "United States", continent: "North America", description: "City of Angels", popularFor: ["Hollywood", "Beaches", "Entertainment"], bestTime: "Mar-May, Sep-Nov", coordinates: { lat: 34.0522, lng: -118.2437 } },
    { name: "San Francisco", country: "United States", continent: "North America", description: "Golden Gate City", popularFor: ["Technology", "Culture", "Food"], bestTime: "Sep-Nov", coordinates: { lat: 37.7749, lng: -122.4194 } },
    { name: "Toronto", country: "Canada", continent: "North America", description: "Multicultural Hub", popularFor: ["Culture", "Food", "Diversity"], bestTime: "May-Oct", coordinates: { lat: 43.6532, lng: -79.3832 } },
    { name: "Vancouver", country: "Canada", continent: "North America", description: "Pacific Gateway", popularFor: ["Nature", "Food", "Outdoor Activities"], bestTime: "Jun-Aug", coordinates: { lat: 49.2827, lng: -123.1207 } },

    // South America
    { name: "Rio de Janeiro", country: "Brazil", continent: "South America", description: "Marvelous City", popularFor: ["Beaches", "Carnival", "Culture"], bestTime: "Dec-Mar", coordinates: { lat: -22.9068, lng: -43.1729 } },
    { name: "Buenos Aires", country: "Argentina", continent: "South America", description: "Paris of South America", popularFor: ["Tango", "Food", "Architecture"], bestTime: "Mar-May, Sep-Nov", coordinates: { lat: -34.6118, lng: -58.3960 } },
    { name: "Lima", country: "Peru", continent: "South America", description: "Culinary Capital", popularFor: ["Food", "History", "Culture"], bestTime: "Dec-Apr", coordinates: { lat: -12.0464, lng: -77.0428 } },

    // Africa
    { name: "Cape Town", country: "South Africa", continent: "Africa", description: "Mother City", popularFor: ["Nature", "Wine", "History"], bestTime: "Nov-Mar", coordinates: { lat: -33.9249, lng: 18.4241 } },
    { name: "Marrakech", country: "Morocco", continent: "Africa", description: "Red City", popularFor: ["Culture", "Markets", "Architecture"], bestTime: "Mar-May, Sep-Nov", coordinates: { lat: 31.6295, lng: -7.9811 } },
    { name: "Cairo", country: "Egypt", continent: "Africa", description: "City of a Thousand Minarets", popularFor: ["History", "Pyramids", "Culture"], bestTime: "Oct-Apr", coordinates: { lat: 30.0444, lng: 31.2357 } },

    // Oceania
    { name: "Sydney", country: "Australia", continent: "Oceania", description: "Harbour City", popularFor: ["Opera House", "Beaches", "Culture"], bestTime: "Sep-Nov, Mar-May", coordinates: { lat: -33.8688, lng: 151.2093 } },
    { name: "Melbourne", country: "Australia", continent: "Oceania", description: "Cultural Capital", popularFor: ["Coffee", "Art", "Food"], bestTime: "Mar-May, Sep-Nov", coordinates: { lat: -37.8136, lng: 144.9631 } },
    { name: "Auckland", country: "New Zealand", continent: "Oceania", description: "City of Sails", popularFor: ["Nature", "Adventure", "Culture"], bestTime: "Dec-Feb", coordinates: { lat: -36.8485, lng: 174.7633 } }
  ]

  searchDestinations(query: string): PopularDestination[] {
    if (!query.trim()) return this.popularDestinations.slice(0, 10)
    
    const searchTerm = query.toLowerCase()
    return this.popularDestinations.filter(dest => 
      dest.name.toLowerCase().includes(searchTerm) ||
      dest.country.toLowerCase().includes(searchTerm) ||
      dest.continent.toLowerCase().includes(searchTerm) ||
      dest.popularFor.some(tag => tag.toLowerCase().includes(searchTerm))
    ).slice(0, 15)
  }

  getPopularDestinations(limit: number = 20): PopularDestination[] {
    return this.popularDestinations.slice(0, limit)
  }

  getDestinationsByContinent(continent: string): PopularDestination[] {
    return this.popularDestinations.filter(dest => 
      dest.continent.toLowerCase() === continent.toLowerCase()
    )
  }

  getDestinationDetails(name: string): PopularDestination | null {
    return this.popularDestinations.find(dest => 
      dest.name.toLowerCase() === name.toLowerCase()
    ) || null
  }
}

export const destinationService = new DestinationService()