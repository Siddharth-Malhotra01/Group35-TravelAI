import { useState, useEffect } from 'react'
import { Utensils, Star, DollarSign, Clock, MapPin, Filter, Heart } from 'lucide-react'
import { googlePlacesService } from '../services/googlePlacesService'

interface RestaurantRecommendation {
  place_id: string
  name: string
  cuisine_type: string
  price_level: number
  rating: number
  address: string
  photos: string[]
}

interface DishRecommendation {
  name: string
  description: string
  cuisine: string
  dietary_tags: string[]
  popularity_score: number
  local_specialty: boolean
}

interface DiningRecommendationsProps {
  destination: {
    name: string
    coordinates?: { lat: number; lng: number }
  }
  preferences?: {
    cuisine?: string[]
    priceLevel?: number[]
    dietary?: string[]
  }
}

export function DiningRecommendations({ destination, preferences = {} }: DiningRecommendationsProps) {
  const [restaurants, setRestaurants] = useState<RestaurantRecommendation[]>([])
  const [dishes, setDishes] = useState<DishRecommendation[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'restaurants' | 'dishes'>('restaurants')
  const [filters, setFilters] = useState({
    cuisine: preferences.cuisine || [],
    priceLevel: preferences.priceLevel || [1, 2, 3, 4],
    dietary: preferences.dietary || []
  })

  useEffect(() => {
    loadRecommendations()
  }, [destination, filters])

  const loadRecommendations = async () => {
    setLoading(true)
    try {
      const location = destination.coordinates || { lat: 0, lng: 0 }
      
      const [restaurantResults, dishResults] = await Promise.all([
        googlePlacesService.getRestaurantRecommendations(location, filters),
        googlePlacesService.getDishRecommendations(destination.name, {
          dietary: filters.dietary,
          budget: getPriceLevelString(Math.max(...filters.priceLevel))
        })
      ])

      setRestaurants(restaurantResults)
      setDishes(dishResults)
    } catch (error) {
      console.error('Error loading dining recommendations:', error)
    } finally {
      setLoading(false)
    }
  }

  const getPriceLevelString = (level: number): string => {
    const levels = ['Free', 'Budget', 'Moderate', 'Expensive', 'Very Expensive']
    return levels[level] || 'Moderate'
  }

  const getPriceLevelDisplay = (level: number): string => {
    return '$'.repeat(Math.max(1, level))
  }

  const toggleCuisineFilter = (cuisine: string) => {
    setFilters(prev => ({
      ...prev,
      cuisine: prev.cuisine.includes(cuisine)
        ? prev.cuisine.filter(c => c !== cuisine)
        : [...prev.cuisine, cuisine]
    }))
  }

  const toggleDietaryFilter = (dietary: string) => {
    setFilters(prev => ({
      ...prev,
      dietary: prev.dietary.includes(dietary)
        ? prev.dietary.filter(d => d !== dietary)
        : [...prev.dietary, dietary]
    }))
  }

  const cuisineOptions = ['Italian', 'French', 'Japanese', 'Chinese', 'Indian', 'Mexican', 'Thai', 'American', 'Mediterranean']
  const dietaryOptions = ['Vegetarian', 'Vegan', 'Gluten-free', 'Halal', 'Kosher']

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <Utensils className="w-6 h-6 text-orange-600" />
            <h2 className="text-xl font-semibold text-gray-900">
              Dining in {destination.name}
            </h2>
          </div>
          <Filter className="w-5 h-5 text-gray-400" />
        </div>

        {/* Tabs */}
        <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setActiveTab('restaurants')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'restaurants'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Restaurants
          </button>
          <button
            onClick={() => setActiveTab('dishes')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'dishes'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Must-Try Dishes
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="p-6 bg-gray-50 border-b border-gray-200">
        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">Cuisine Type</h4>
            <div className="flex flex-wrap gap-2">
              {cuisineOptions.map(cuisine => (
                <button
                  key={cuisine}
                  onClick={() => toggleCuisineFilter(cuisine)}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                    filters.cuisine.includes(cuisine)
                      ? 'bg-orange-600 text-white'
                      : 'bg-white text-gray-700 border border-gray-300 hover:border-orange-300'
                  }`}
                >
                  {cuisine}
                </button>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">Dietary Preferences</h4>
            <div className="flex flex-wrap gap-2">
              {dietaryOptions.map(dietary => (
                <button
                  key={dietary}
                  onClick={() => toggleDietaryFilter(dietary)}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                    filters.dietary.includes(dietary)
                      ? 'bg-green-600 text-white'
                      : 'bg-white text-gray-700 border border-gray-300 hover:border-green-300'
                  }`}
                >
                  {dietary}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {activeTab === 'restaurants' ? (
          <div className="space-y-4">
            {restaurants.length > 0 ? (
              restaurants.map((restaurant) => (
                <div key={restaurant.place_id} className="border border-gray-200 rounded-lg p-4 hover:border-orange-300 transition-colors">
                  <div className="flex items-start space-x-4">
                    {restaurant.photos.length > 0 && (
                      <img
                        src={restaurant.photos[0]}
                        alt={restaurant.name}
                        className="w-20 h-20 rounded-lg object-cover flex-shrink-0"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold text-gray-900 mb-1">{restaurant.name}</h3>
                          <p className="text-sm text-gray-600 mb-2">{restaurant.cuisine_type}</p>
                        </div>
                        <button className="text-gray-400 hover:text-red-500 transition-colors">
                          <Heart className="w-5 h-5" />
                        </button>
                      </div>
                      
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <div className="flex items-center space-x-1">
                          <Star className="w-4 h-4 text-yellow-500 fill-current" />
                          <span>{restaurant.rating}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <DollarSign className="w-4 h-4" />
                          <span>{getPriceLevelDisplay(restaurant.price_level)}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <MapPin className="w-4 h-4" />
                          <span className="truncate">{restaurant.address}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Utensils className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p>No restaurants found matching your criteria</p>
                <p className="text-sm">Try adjusting your filters</p>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {dishes.length > 0 ? (
              dishes.map((dish, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4 hover:border-orange-300 transition-colors">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <h3 className="font-semibold text-gray-900">{dish.name}</h3>
                      {dish.local_specialty && (
                        <span className="bg-orange-100 text-orange-800 text-xs px-2 py-1 rounded-full">
                          Local Specialty
                        </span>
                      )}
                    </div>
                    <div className="flex items-center space-x-1">
                      <Star className="w-4 h-4 text-yellow-500 fill-current" />
                      <span className="text-sm text-gray-600">{dish.popularity_score}/10</span>
                    </div>
                  </div>
                  
                  <p className="text-gray-600 text-sm mb-3">{dish.description}</p>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-gray-500">{dish.cuisine}</span>
                      {dish.dietary_tags.map(tag => (
                        <span key={tag} className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                          {tag}
                        </span>
                      ))}
                    </div>
                    <div className="flex items-center space-x-2">
                      <button 
                        onClick={() => addToFavorites(dish)}
                        className="text-gray-400 hover:text-red-500 transition-colors"
                        title="Add to favorites"
                      >
                      <Heart className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => findRestaurantsForDish(dish)}
                        className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full hover:bg-blue-200 transition-colors"
                      >
                        Find Restaurants
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Utensils className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p>No dishes found for {destination.name}</p>
                <p className="text-sm">Check back later for recommendations</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )

  const addToFavorites = (dish: DishRecommendation) => {
    // Add to localStorage favorites
    const favorites = JSON.parse(localStorage.getItem('favorite-dishes') || '[]')
    const newFavorite = {
      id: crypto.randomUUID(),
      dish: dish.name,
      description: dish.description,
      destination: destination.name,
      cuisine: dish.cuisine,
      addedAt: new Date().toISOString()
    }
    
    favorites.push(newFavorite)
    localStorage.setItem('favorite-dishes', JSON.stringify(favorites))
    
    // Show notification
    showNotification(`${dish.name} added to favorites!`)
  }

  const findRestaurantsForDish = (dish: DishRecommendation) => {
    // Filter restaurants by cuisine type
    const matchingRestaurants = restaurants.filter(restaurant => 
      restaurant.cuisine_type.toLowerCase() === dish.cuisine.toLowerCase()
    )
    
    if (matchingRestaurants.length > 0) {
      showNotification(`Found ${matchingRestaurants.length} restaurants serving ${dish.name}`)
      // Could scroll to restaurants section or highlight matching ones
    } else {
      showNotification(`Search for "${dish.name}" in the restaurants above`)
    }
  }

  const showNotification = (message: string) => {
    const notification = document.createElement('div')
    notification.textContent = message
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #10b981;
      color: white;
      padding: 12px 24px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      z-index: 10000;
      font-family: system-ui, -apple-system, sans-serif;
      font-size: 14px;
      font-weight: 500;
    `
    
    document.body.appendChild(notification)
    
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification)
      }
    }, 3000)
  }
}