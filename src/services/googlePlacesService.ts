interface PlaceResult {
  place_id: string
  name: string
  formatted_address: string
  geometry: {
    location: {
      lat: number
      lng: number
    }
  }
  types: string[]
  photos?: any[]
  rating?: number
  price_level?: number
}

interface RestaurantRecommendation {
  place_id: string
  name: string
  cuisine_type: string
  price_level: number
  rating: number
  address: string
  photos: string[]
  opening_hours?: {
    open_now: boolean
    weekday_text: string[]
  }
  reviews?: {
    author_name: string
    rating: number
    text: string
  }[]
}

interface DishRecommendation {
  name: string
  description: string
  cuisine: string
  dietary_tags: string[]
  popularity_score: number
  local_specialty: boolean
}

export class GooglePlacesService {
  private apiKey: string
  private placesService: google.maps.places.PlacesService | null = null
  private autocompleteService: google.maps.places.AutocompleteService | null = null

  constructor() {
    this.apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ''
    this.initializeServices()
  }

  private async initializeServices() {
    if (!this.apiKey) {
      console.warn('Google Maps API key not found. Using mock data.')
      return
    }

    try {
      const { Loader } = await import('@googlemaps/js-api-loader')
      const loader = new Loader({
        apiKey: this.apiKey,
        version: 'weekly',
        libraries: ['places']
      })

      await loader.load()
      
      // Create a dummy div for PlacesService
      const div = document.createElement('div')
      this.placesService = new google.maps.places.PlacesService(div)
      this.autocompleteService = new google.maps.places.AutocompleteService()
    } catch (error) {
      console.error('Failed to load Google Maps API:', error)
    }
  }

  async searchDestinations(query: string): Promise<PlaceResult[]> {
    if (!this.autocompleteService || !query.trim()) {
      return this.getMockDestinations(query)
    }

    return new Promise((resolve) => {
      this.autocompleteService!.getPlacePredictions(
        {
          input: query,
          types: ['(cities)'],
          componentRestrictions: { country: [] }
        },
        (predictions, status) => {
          if (status === google.maps.places.PlacesServiceStatus.OK && predictions) {
            const results = predictions.map(prediction => ({
              place_id: prediction.place_id,
              name: prediction.structured_formatting.main_text,
              formatted_address: prediction.description,
              geometry: {
                location: { lat: 0, lng: 0 } // Will be filled by getPlaceDetails
              },
              types: prediction.types
            }))
            resolve(results)
          } else {
            resolve(this.getMockDestinations(query))
          }
        }
      )
    })
  }

  async getPlaceDetails(placeId: string): Promise<PlaceResult | null> {
    if (!this.placesService) {
      return null
    }

    return new Promise((resolve) => {
      this.placesService!.getDetails(
        {
          placeId: placeId,
          fields: ['name', 'formatted_address', 'geometry', 'photos', 'rating', 'types']
        },
        (place, status) => {
          if (status === google.maps.places.PlacesServiceStatus.OK && place) {
            resolve({
              place_id: placeId,
              name: place.name || '',
              formatted_address: place.formatted_address || '',
              geometry: {
                location: {
                  lat: place.geometry?.location?.lat() || 0,
                  lng: place.geometry?.location?.lng() || 0
                }
              },
              types: place.types || [],
              photos: place.photos,
              rating: place.rating
            })
          } else {
            resolve(null)
          }
        }
      )
    })
  }

  async getRestaurantRecommendations(
    location: { lat: number; lng: number },
    preferences: {
      cuisine?: string[]
      priceLevel?: number[]
      dietary?: string[]
      radius?: number
    } = {}
  ): Promise<RestaurantRecommendation[]> {
    if (!this.placesService) {
      return this.getMockRestaurants(location, preferences)
    }

    const { radius = 2000, priceLevel = [1, 2, 3, 4] } = preferences

    return new Promise((resolve) => {
      this.placesService!.nearbySearch(
        {
          location: new google.maps.LatLng(location.lat, location.lng),
          radius: radius,
          type: 'restaurant',
          minPriceLevel: Math.min(...priceLevel),
          maxPriceLevel: Math.max(...priceLevel)
        },
        (results, status) => {
          if (status === google.maps.places.PlacesServiceStatus.OK && results) {
            const restaurants = results.slice(0, 10).map(place => ({
              place_id: place.place_id || '',
              name: place.name || '',
              cuisine_type: this.extractCuisineType(place.types || []),
              price_level: place.price_level || 2,
              rating: place.rating || 0,
              address: place.vicinity || '',
              photos: place.photos ? [place.photos[0].getUrl()] : []
            }))
            resolve(restaurants)
          } else {
            resolve(this.getMockRestaurants(location, preferences))
          }
        }
      )
    })
  }

  async getDishRecommendations(
    destination: string,
    preferences: {
      dietary?: string[]
      spiceLevel?: string
      budget?: string
    } = {}
  ): Promise<DishRecommendation[]> {
    // This would typically call a food/cuisine API or use AI to generate recommendations
    return this.getMockDishRecommendations(destination, preferences)
  }

  private extractCuisineType(types: string[]): string {
    const cuisineMap: Record<string, string> = {
      'italian_restaurant': 'Italian',
      'chinese_restaurant': 'Chinese',
      'japanese_restaurant': 'Japanese',
      'mexican_restaurant': 'Mexican',
      'indian_restaurant': 'Indian',
      'french_restaurant': 'French',
      'thai_restaurant': 'Thai',
      'american_restaurant': 'American',
      'mediterranean_restaurant': 'Mediterranean'
    }

    for (const type of types) {
      if (cuisineMap[type]) {
        return cuisineMap[type]
      }
    }
    return 'International'
  }

  private getMockDestinations(query: string): PlaceResult[] {
    const mockDestinations = [
      {
        place_id: 'mock_paris',
        name: 'Paris',
        formatted_address: 'Paris, France',
        geometry: { location: { lat: 48.8566, lng: 2.3522 } },
        types: ['locality', 'political']
      },
      {
        place_id: 'mock_tokyo',
        name: 'Tokyo',
        formatted_address: 'Tokyo, Japan',
        geometry: { location: { lat: 35.6762, lng: 139.6503 } },
        types: ['locality', 'political']
      },
      {
        place_id: 'mock_nyc',
        name: 'New York',
        formatted_address: 'New York, NY, USA',
        geometry: { location: { lat: 40.7128, lng: -74.0060 } },
        types: ['locality', 'political']
      },
      {
        place_id: 'mock_london',
        name: 'London',
        formatted_address: 'London, UK',
        geometry: { location: { lat: 51.5074, lng: -0.1278 } },
        types: ['locality', 'political']
      },
      {
        place_id: 'mock_rome',
        name: 'Rome',
        formatted_address: 'Rome, Italy',
        geometry: { location: { lat: 41.9028, lng: 12.4964 } },
        types: ['locality', 'political']
      }
    ]

    return mockDestinations.filter(dest => 
      dest.name.toLowerCase().includes(query.toLowerCase()) ||
      dest.formatted_address.toLowerCase().includes(query.toLowerCase())
    )
  }

  private getMockRestaurants(
    location: { lat: number; lng: number },
    preferences: any
  ): RestaurantRecommendation[] {
    return [
      {
        place_id: 'mock_restaurant_1',
        name: 'Le Petit Bistro',
        cuisine_type: 'French',
        price_level: 3,
        rating: 4.5,
        address: '123 Main Street',
        photos: ['https://images.pexels.com/photos/262978/pexels-photo-262978.jpeg?auto=compress&cs=tinysrgb&w=400']
      },
      {
        place_id: 'mock_restaurant_2',
        name: 'Sakura Sushi',
        cuisine_type: 'Japanese',
        price_level: 2,
        rating: 4.3,
        address: '456 Oak Avenue',
        photos: ['https://images.pexels.com/photos/357756/pexels-photo-357756.jpeg?auto=compress&cs=tinysrgb&w=400']
      },
      {
        place_id: 'mock_restaurant_3',
        name: 'Local Street Food',
        cuisine_type: 'Local',
        description: 'Explore popular street food and local specialties recommended by locals',
        price_level: 2,
        rating: 4.7,
        address: '789 Pine Road',
        photos: ['https://images.pexels.com/photos/1566837/pexels-photo-1566837.jpeg?auto=compress&cs=tinysrgb&w=400']
      }
    ]
  }

  private getMockDishRecommendations(
    destination: string,
    preferences: any
  ): DishRecommendation[] {
    const dishDatabase: Record<string, DishRecommendation[]> = {
      'Paris': [
        {
          name: 'Croissant au Beurre',
          description: 'Buttery, flaky pastry perfect for breakfast with coffee',
          cuisine: 'French',
          dietary_tags: [],
          popularity_score: 9,
          local_specialty: true
        },
        {
          name: 'Croque Monsieur',
          description: 'Grilled ham and cheese sandwich topped with béchamel sauce',
          cuisine: 'French',
          dietary_tags: [],
          popularity_score: 8,
          local_specialty: true
        },
        {
          name: 'Macarons',
          description: 'Delicate almond-based cookies with various flavored fillings',
          cuisine: 'French',
          dietary_tags: ['vegetarian'],
          popularity_score: 10,
          local_specialty: true
        },
        {
          name: 'Crêpes Suzette',
          description: 'Thin pancakes flambéed with orange liqueur and served with orange sauce',
          cuisine: 'French',
          dietary_tags: ['vegetarian'],
          popularity_score: 9,
          local_specialty: true
        },
        {
          name: 'French Onion Soup',
          description: 'Rich onion soup topped with melted Gruyère cheese and croutons',
          cuisine: 'French',
          dietary_tags: ['vegetarian'],
          popularity_score: 8,
          local_specialty: true
        },
        {
          name: 'Coq au Vin',
          description: 'Classic French chicken braised in red wine with mushrooms and onions',
          cuisine: 'French',
          dietary_tags: [],
          popularity_score: 9,
          local_specialty: true
        },
        {
          name: 'Escargots de Bourgogne',
          description: 'Burgundy snails cooked in garlic, parsley and butter',
          cuisine: 'French',
          dietary_tags: [],
          popularity_score: 7,
          local_specialty: true
        }
      ],
      'Tokyo': [
        {
          name: 'Ramen',
          description: 'Rich noodle soup with various toppings and broths',
          cuisine: 'Japanese',
          dietary_tags: [],
          popularity_score: 10,
          local_specialty: true
        },
        {
          name: 'Sushi Omakase',
          description: 'Chef\'s choice selection of the finest fresh sushi',
          cuisine: 'Japanese',
          dietary_tags: ['pescatarian'],
          popularity_score: 9,
          local_specialty: true
        },
        {
          name: 'Tonkotsu Ramen',
          description: 'Rich pork bone broth ramen with chashu pork, soft-boiled egg, and nori',
          cuisine: 'Japanese',
          dietary_tags: [],
          popularity_score: 9,
          local_specialty: true
        },
        {
          name: 'Chirashi Bowl',
          description: 'Assorted fresh sashimi over seasoned sushi rice',
          cuisine: 'Japanese',
          dietary_tags: ['pescatarian'],
          popularity_score: 8,
          local_specialty: true
        },
        {
          name: 'Takoyaki',
          description: 'Octopus balls with takoyaki sauce, mayo, and bonito flakes',
          cuisine: 'Japanese',
          dietary_tags: [],
          popularity_score: 8,
          local_specialty: true
        },
        {
          name: 'Katsu Curry',
          description: 'Breaded pork cutlet with Japanese curry and steamed rice',
          cuisine: 'Japanese',
          dietary_tags: [],
          popularity_score: 9,
          local_specialty: true
        },
        {
          name: 'Mochi Ice Cream',
          description: 'Sweet rice cake filled with ice cream in various flavors',
          cuisine: 'Japanese',
          dietary_tags: ['vegetarian'],
          popularity_score: 8,
          local_specialty: true
        }
      ],
      'Rome': [
        {
          name: 'Carbonara',
          description: 'Pasta with eggs, pecorino cheese, pancetta, and black pepper',
          cuisine: 'Italian',
          dietary_tags: [],
          popularity_score: 10,
          local_specialty: true
        },
        {
          name: 'Margherita Pizza',
          description: 'Classic pizza with tomato sauce, mozzarella, and fresh basil',
          cuisine: 'Italian',
          dietary_tags: ['vegetarian'],
          popularity_score: 10,
          local_specialty: true
        },
        {
          name: 'Gelato',
          description: 'Creamy Italian ice cream in flavors like pistachio, stracciatella, or limoncello',
          cuisine: 'Italian',
          dietary_tags: ['vegetarian'],
          popularity_score: 9,
          local_specialty: true
        },
        {
          name: 'Supplì',
          description: 'Fried rice balls stuffed with mozzarella and tomato sauce',
          cuisine: 'Italian',
          dietary_tags: ['vegetarian'],
          popularity_score: 8,
          local_specialty: true
        }
      ],
      'Mumbai': [
        {
          name: 'Butter Chicken with Naan',
          description: 'Creamy tomato-based chicken curry served with soft leavened bread',
          cuisine: 'Indian',
          dietary_tags: [],
          popularity_score: 10,
          local_specialty: true
        },
        {
          name: 'Masala Dosa',
          description: 'Crispy rice crepe filled with spiced potato curry, served with sambar and chutney',
          cuisine: 'Indian',
          dietary_tags: ['vegetarian', 'vegan'],
          popularity_score: 9,
          local_specialty: true
        },
        {
          name: 'Pav Bhaji',
          description: 'Spiced vegetable curry served with buttered bread rolls',
          cuisine: 'Indian',
          dietary_tags: ['vegetarian'],
          popularity_score: 9,
          local_specialty: true
        },
        {
          name: 'Biryani',
          description: 'Fragrant basmati rice layered with spiced meat or vegetables',
          cuisine: 'Indian',
          dietary_tags: [],
          popularity_score: 10,
          local_specialty: true
        }
      ],
      'Bangkok': [
        {
          name: 'Pad Thai',
          description: 'Stir-fried rice noodles with shrimp, tofu, bean sprouts, and tamarind sauce',
          cuisine: 'Thai',
          dietary_tags: [],
          popularity_score: 10,
          local_specialty: true
        },
        {
          name: 'Tom Yum Goong',
          description: 'Spicy and sour soup with shrimp, lemongrass, and lime leaves',
          cuisine: 'Thai',
          dietary_tags: [],
          popularity_score: 9,
          local_specialty: true
        },
        {
          name: 'Green Curry',
          description: 'Spicy coconut curry with Thai basil, eggplant, and your choice of protein',
          cuisine: 'Thai',
          dietary_tags: [],
          popularity_score: 9,
          local_specialty: true
        },
        {
          name: 'Mango Sticky Rice',
          description: 'Sweet dessert with ripe mango slices over coconut sticky rice',
          cuisine: 'Thai',
          dietary_tags: ['vegetarian', 'vegan'],
          popularity_score: 8,
          local_specialty: true
        }
      ]
    }

    return dishDatabase[destination] || [
      {
        name: 'Local Specialty',
        description: 'Try the signature dish of this region',
        cuisine: 'Local',
        dietary_tags: [],
        popularity_score: 8,
        local_specialty: true
      }
    ]
  }
}

export const googlePlacesService = new GooglePlacesService()