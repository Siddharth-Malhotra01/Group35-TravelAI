import { useState, useEffect } from 'react'
import { MapPin, Utensils, Camera, Car, ShoppingBag, Moon, Star, Clock, DollarSign } from 'lucide-react'
import { createOpenAIService } from '../services/openaiService'

interface LocationRecommendation {
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

interface LocationRecommendationsProps {
  destination: string
  previousDestination?: string
}

export function LocationRecommendations({ destination, previousDestination }: LocationRecommendationsProps) {
  const [recommendations, setRecommendations] = useState<LocationRecommendation | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'restaurants' | 'sightseeing' | 'transportation' | 'nightlife' | 'shopping'>('restaurants')

  useEffect(() => {
    loadRecommendations()
  }, [destination, previousDestination])

  const loadRecommendations = async () => {
    setLoading(true)
    try {
      const openaiService = createOpenAIService()
      const data = await openaiService.getLocationRecommendations(destination, previousDestination)
      setRecommendations(data)
    } catch (error) {
      console.error('Error loading recommendations:', error)
    } finally {
      setLoading(false)
    }
  }

  const tabs = [
    { id: 'restaurants', label: 'Restaurants', icon: Utensils },
    { id: 'sightseeing', label: 'Sightseeing', icon: Camera },
    { id: 'transportation', label: 'Transport', icon: Car },
    { id: 'nightlife', label: 'Nightlife', icon: Moon },
    { id: 'shopping', label: 'Shopping', icon: ShoppingBag }
  ]

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

  if (!recommendations) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6 text-center">
        <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600">Unable to load recommendations for {destination}</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center space-x-3 mb-4">
          <MapPin className="w-6 h-6 text-blue-600" />
          <h2 className="text-xl font-semibold text-gray-900">
            Recommendations for {destination}
          </h2>
        </div>

        {/* Tabs */}
        <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
          {tabs.map(tab => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex-1 flex items-center justify-center space-x-2 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      <div className="p-6">
        {activeTab === 'restaurants' && (
          <div className="space-y-4">
            {recommendations.restaurants.map((restaurant, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-gray-900">{restaurant.name}</h3>
                  <span className="text-sm text-gray-600">{restaurant.priceRange}</span>
                </div>
                <p className="text-sm text-gray-600 mb-2">{restaurant.cuisine} • {restaurant.location}</p>
                <p className="text-gray-700 mb-3">{restaurant.description}</p>
                {restaurant.mustTry.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-1">Must Try:</h4>
                    <div className="flex flex-wrap gap-1">
                      {restaurant.mustTry.map((dish, dishIndex) => (
                        <span key={dishIndex} className="bg-orange-100 text-orange-800 text-xs px-2 py-1 rounded-full">
                          {dish}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {activeTab === 'sightseeing' && (
          <div className="space-y-4">
            {recommendations.sightseeing.map((attraction, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-gray-900">{attraction.name}</h3>
                  <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                    {attraction.type}
                  </span>
                </div>
                <p className="text-gray-700 mb-3">{attraction.description}</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                  <div className="flex items-center space-x-1">
                    <Clock className="w-4 h-4" />
                    <span>{attraction.duration}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Star className="w-4 h-4" />
                    <span>Best: {attraction.bestTime}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <DollarSign className="w-4 h-4" />
                    <span>{attraction.ticketPrice}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'transportation' && (
          <div className="space-y-6">
            {recommendations.transportation.fromPrevious && (
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-3">
                  From {previousDestination} to {destination}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                  <div>
                    <h4 className="text-sm font-medium text-gray-700">Transport Options</h4>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {recommendations.transportation.fromPrevious.modes.map((mode, index) => (
                        <span key={index} className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                          {mode}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-700">Duration</h4>
                    <p className="text-sm text-gray-600">{recommendations.transportation.fromPrevious.duration}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-700">Estimated Cost</h4>
                    <p className="text-sm text-gray-600">{recommendations.transportation.fromPrevious.cost}</p>
                  </div>
                </div>
                <p className="text-gray-700">{recommendations.transportation.fromPrevious.recommendations}</p>
              </div>
            )}

            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-3">Local Transportation in {destination}</h3>
              <div className="mb-3">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Available Options</h4>
                <div className="flex flex-wrap gap-1">
                  {recommendations.transportation.local.modes.map((mode, index) => (
                    <span key={index} className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                      {mode}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Tips</h4>
                <ul className="space-y-1">
                  {recommendations.transportation.local.tips.map((tip, index) => (
                    <li key={index} className="text-sm text-gray-600 flex items-start space-x-2">
                      <span className="text-blue-600 mt-1">•</span>
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'nightlife' && (
          <div className="space-y-4">
            {recommendations.nightlife.map((venue, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-gray-900">{venue.name}</h3>
                  <span className="text-sm text-gray-600">{venue.priceRange}</span>
                </div>
                <p className="text-sm text-purple-600 mb-2">{venue.type}</p>
                <p className="text-gray-700">{venue.description}</p>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'shopping' && (
          <div className="space-y-4">
            {recommendations.shopping.map((shop, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-gray-900">{shop.name}</h3>
                  <span className="bg-pink-100 text-pink-800 text-xs px-2 py-1 rounded-full">
                    {shop.type}
                  </span>
                </div>
                <p className="text-gray-700 mb-3">{shop.description}</p>
                {shop.specialties.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-1">Specialties:</h4>
                    <div className="flex flex-wrap gap-1">
                      {shop.specialties.map((specialty, specialtyIndex) => (
                        <span key={specialtyIndex} className="bg-pink-100 text-pink-800 text-xs px-2 py-1 rounded-full">
                          {specialty}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* General Tips */}
        {recommendations.tips.length > 0 && (
          <div className="mt-8 pt-6 border-t border-gray-200">
            <h3 className="font-semibold text-gray-900 mb-3">Local Tips for {destination}</h3>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <ul className="space-y-2">
                {recommendations.tips.map((tip, index) => (
                  <li key={index} className="text-sm text-blue-800 flex items-start space-x-2">
                    <span className="text-blue-600 mt-1">💡</span>
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}