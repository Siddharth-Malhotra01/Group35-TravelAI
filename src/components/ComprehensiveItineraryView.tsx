import { useState, useEffect } from 'react'
import { MapPin, Clock, DollarSign, Star, Users, Shield, Utensils, Bed, Car, Camera, Phone, Package, AlertTriangle } from 'lucide-react'
import { comprehensiveAIService } from '../services/comprehensiveAIService'

interface DetailedDestinationPlan {
  destination: string
  overview: string
  bestTimeToVisit: string
  safetyRating: number
  safetyTips: string[]
  culturalTips: string[]
  hotels: Array<{
    name: string
    category: string
    priceRange: string
    location: string
    amenities: string[]
    rating: number
    bookingTips: string
    address: string
  }>
  restaurants: Array<{
    name: string
    cuisine: string
    mealType: string
    priceRange: string
    specialties: string[]
    location: string
    reservationRequired: boolean
    rating: number
    dietaryOptions: string[]
  }>
  attractions: Array<{
    name: string
    type: string
    description: string
    duration: string
    bestTime: string
    ticketPrice: string
    location: string
    crowdLevel: string
    accessibility: string[]
    tips: string[]
  }>
  transportation: {
    airport: Array<{
      mode: string
      description: string
      cost: string
      duration: string
      bookingInfo: string
      tips: string[]
      accessibility: string[]
    }>
    local: Array<{
      mode: string
      description: string
      cost: string
      duration: string
      bookingInfo: string
      tips: string[]
      accessibility: string[]
    }>
    intercity: Array<{
      mode: string
      description: string
      cost: string
      duration: string
      bookingInfo: string
      tips: string[]
      accessibility: string[]
    }>
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

interface ComprehensiveItineraryViewProps {
  destination: string
  duration: number
  startDate: string
  budget: 'budget' | 'mid-range' | 'luxury'
  travelStyle: 'relaxed' | 'balanced' | 'packed'
  interests: string[]
  groupSize: number
  accessibility?: string[]
}

export function ComprehensiveItineraryView({
  destination,
  duration,
  startDate,
  budget,
  travelStyle,
  interests,
  groupSize,
  accessibility
}: ComprehensiveItineraryViewProps) {
  const [itinerary, setItinerary] = useState<DetailedDestinationPlan | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'overview' | 'hotels' | 'restaurants' | 'attractions' | 'transport' | 'itinerary' | 'budget' | 'practical'>('overview')

  useEffect(() => {
    generateComprehensiveItinerary()
  }, [destination, duration, startDate, budget, travelStyle, interests, groupSize, accessibility])

  const generateComprehensiveItinerary = async () => {
    setLoading(true)
    try {
      const plan = await comprehensiveAIService.generateDetailedItinerary({
        destination,
        duration,
        startDate,
        budget,
        travelStyle,
        interests,
        groupSize,
        accessibility
      })
      setItinerary(plan)
    } catch (error) {
      console.error('Error generating comprehensive itinerary:', error)
    } finally {
      setLoading(false)
    }
  }

  const getCrowdLevelColor = (level: string) => {
    switch (level) {
      case 'low': return 'text-green-600 bg-green-100'
      case 'moderate': return 'text-yellow-600 bg-yellow-100'
      case 'high': return 'text-orange-600 bg-orange-100'
      case 'very_high': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getSafetyColor = (rating: number) => {
    if (rating >= 8) return 'text-green-600'
    if (rating >= 6) return 'text-yellow-600'
    return 'text-red-600'
  }

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Generating Comprehensive Itinerary</h3>
          <p className="text-gray-600">Creating detailed recommendations for {destination}...</p>
        </div>
      </div>
    )
  }

  if (!itinerary) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-8 text-center">
        <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Unable to Generate Itinerary</h3>
        <p className="text-gray-600">Please try again or contact support.</p>
      </div>
    )
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: MapPin },
    { id: 'hotels', label: 'Hotels', icon: Bed },
    { id: 'restaurants', label: 'Dining', icon: Utensils },
    { id: 'attractions', label: 'Attractions', icon: Camera },
    { id: 'transport', label: 'Transport', icon: Car },
    { id: 'itinerary', label: 'Daily Plan', icon: Clock },
    { id: 'budget', label: 'Budget', icon: DollarSign },
    { id: 'practical', label: 'Practical', icon: Package }
  ]

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
        <h1 className="text-3xl font-bold mb-2">{itinerary.destination} Travel Guide</h1>
        <p className="text-blue-100 mb-4">{itinerary.overview}</p>
        <div className="flex items-center space-x-6 text-sm">
          <div className="flex items-center space-x-2">
            <Clock className="w-4 h-4" />
            <span>Best Time: {itinerary.bestTimeToVisit}</span>
          </div>
          <div className="flex items-center space-x-2">
            <Shield className={`w-4 h-4 ${getSafetyColor(itinerary.safetyRating)}`} />
            <span>Safety: {itinerary.safetyRating}/10</span>
          </div>
          <div className="flex items-center space-x-2">
            <Users className="w-4 h-4" />
            <span>{groupSize} travelers</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8 px-6 overflow-x-auto">
          {tabs.map(tab => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-2 py-4 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            )
          })}
        </nav>
      </div>

      {/* Content */}
      <div className="p-6">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900 mb-3 flex items-center space-x-2">
                  <Shield className="w-5 h-5" />
                  <span>Safety Tips</span>
                </h3>
                <ul className="space-y-2">
                  {itinerary.safetyTips.map((tip, index) => (
                    <li key={index} className="text-sm text-blue-800 flex items-start space-x-2">
                      <span className="text-blue-600 mt-1">•</span>
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <h3 className="font-semibold text-purple-900 mb-3 flex items-center space-x-2">
                  <Users className="w-5 h-5" />
                  <span>Cultural Tips</span>
                </h3>
                <ul className="space-y-2">
                  {itinerary.culturalTips.map((tip, index) => (
                    <li key={index} className="text-sm text-purple-800 flex items-start space-x-2">
                      <span className="text-purple-600 mt-1">•</span>
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'hotels' && (
          <div className="space-y-4">
            {itinerary.hotels.map((hotel, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-6 hover:border-blue-300 transition-colors">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-1">{hotel.name}</h3>
                    <p className="text-gray-600 mb-2">{hotel.address}</p>
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <span className="capitalize bg-blue-100 text-blue-800 px-2 py-1 rounded-full">{hotel.category}</span>
                      <div className="flex items-center space-x-1">
                        <Star className="w-4 h-4 text-yellow-500 fill-current" />
                        <span>{hotel.rating}</span>
                      </div>
                      <span className="font-medium text-green-600">{hotel.priceRange}</span>
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Amenities</h4>
                    <div className="flex flex-wrap gap-1">
                      {hotel.amenities.map((amenity, amenityIndex) => (
                        <span key={amenityIndex} className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded-full">
                          {amenity}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Location</h4>
                    <p className="text-sm text-gray-600">{hotel.location}</p>
                  </div>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <h4 className="font-medium text-yellow-900 mb-1">Booking Tips</h4>
                  <p className="text-sm text-yellow-800">{hotel.bookingTips}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'restaurants' && (
          <div className="space-y-4">
            {itinerary.restaurants.map((restaurant, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-6 hover:border-orange-300 transition-colors">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-1">{restaurant.name}</h3>
                    <div className="flex items-center space-x-4 text-sm text-gray-500 mb-2">
                      <span className="capitalize">{restaurant.cuisine}</span>
                      <span className="capitalize bg-orange-100 text-orange-800 px-2 py-1 rounded-full">{restaurant.mealType}</span>
                      <div className="flex items-center space-x-1">
                        <Star className="w-4 h-4 text-yellow-500 fill-current" />
                        <span>{restaurant.rating}</span>
                      </div>
                      <span className="font-medium text-green-600">{restaurant.priceRange}</span>
                    </div>
                    <p className="text-gray-600">{restaurant.location}</p>
                  </div>
                  {restaurant.reservationRequired && (
                    <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full">
                      Reservation Required
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Specialties</h4>
                    <div className="flex flex-wrap gap-1">
                      {restaurant.specialties.map((specialty, specialtyIndex) => (
                        <span key={specialtyIndex} className="bg-orange-100 text-orange-800 text-xs px-2 py-1 rounded-full">
                          {specialty}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Dietary Options</h4>
                    <div className="flex flex-wrap gap-1">
                      {restaurant.dietaryOptions.map((option, optionIndex) => (
                        <span key={optionIndex} className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                          {option}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'attractions' && (
          <div className="space-y-4">
            {itinerary.attractions.map((attraction, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-6 hover:border-purple-300 transition-colors">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-1">{attraction.name}</h3>
                    <div className="flex items-center space-x-4 text-sm text-gray-500 mb-2">
                      <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full">{attraction.type}</span>
                      <span>{attraction.duration}</span>
                      <span className="font-medium text-green-600">{attraction.ticketPrice}</span>
                    </div>
                    <p className="text-gray-600 mb-2">{attraction.location}</p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${getCrowdLevelColor(attraction.crowdLevel)}`}>
                    {attraction.crowdLevel} crowds
                  </span>
                </div>

                <p className="text-gray-700 mb-4">{attraction.description}</p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Best Time</h4>
                    <p className="text-sm text-gray-600">{attraction.bestTime}</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Accessibility</h4>
                    <div className="flex flex-wrap gap-1">
                      {attraction.accessibility.map((feature, featureIndex) => (
                        <span key={featureIndex} className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                          {feature}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Tips</h4>
                    <ul className="text-sm text-gray-600">
                      {attraction.tips.slice(0, 2).map((tip, tipIndex) => (
                        <li key={tipIndex} className="flex items-start space-x-1">
                          <span className="text-purple-600 mt-1">•</span>
                          <span>{tip}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'transport' && (
          <div className="space-y-6">
            {['airport', 'local', 'intercity'].map(category => (
              <div key={category}>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 capitalize">
                  {category === 'airport' ? 'Airport Transport' : category === 'local' ? 'Local Transport' : 'Intercity Transport'}
                </h3>
                <div className="space-y-3">
                  {itinerary.transportation[category as keyof typeof itinerary.transportation].map((transport, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="font-medium text-gray-900">{transport.mode}</h4>
                          <p className="text-sm text-gray-600 mb-2">{transport.description}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-green-600">{transport.cost}</p>
                          <p className="text-sm text-gray-500">{transport.duration}</p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <h5 className="font-medium text-gray-700 mb-1">Booking Info</h5>
                          <p className="text-gray-600">{transport.bookingInfo}</p>
                        </div>
                        <div>
                          <h5 className="font-medium text-gray-700 mb-1">Tips</h5>
                          <ul className="text-gray-600">
                            {transport.tips.slice(0, 2).map((tip, tipIndex) => (
                              <li key={tipIndex} className="flex items-start space-x-1">
                                <span className="text-blue-600 mt-1">•</span>
                                <span>{tip}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'itinerary' && (
          <div className="space-y-6">
            {itinerary.dailyItinerary.map((day) => (
              <div key={day.day} className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="bg-gradient-to-r from-blue-500 to-purple-500 text-white p-4">
                  <h3 className="text-lg font-semibold">Day {day.day} - {day.theme}</h3>
                  <p className="text-blue-100">{day.date}</p>
                </div>
                
                <div className="p-6 space-y-6">
                  {/* Morning */}
                  <div className="flex items-start space-x-4">
                    <div className="bg-yellow-100 rounded-full p-2">
                      <Clock className="w-4 h-4 text-yellow-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-gray-900">Morning - {day.morning.time}</h4>
                        <span className="text-green-600 font-medium">{day.morning.cost}</span>
                      </div>
                      <p className="text-gray-700 mb-1">{day.morning.activity}</p>
                      <p className="text-sm text-gray-500 mb-2">{day.morning.location}</p>
                      {day.morning.tips && day.morning.tips.length > 0 && (
                        <div className="bg-yellow-50 border border-yellow-200 rounded p-2">
                          <p className="text-xs text-yellow-800">{day.morning.tips[0]}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Lunch */}
                  <div className="flex items-start space-x-4">
                    <div className="bg-orange-100 rounded-full p-2">
                      <Utensils className="w-4 h-4 text-orange-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-gray-900">Lunch</h4>
                        <span className="text-green-600 font-medium">{day.lunch.cost}</span>
                      </div>
                      <p className="text-gray-700 mb-1">{day.lunch.restaurant}</p>
                      <p className="text-sm text-gray-500 mb-2">{day.lunch.cuisine}</p>
                      <div className="flex flex-wrap gap-1">
                        {day.lunch.specialties.map((specialty, index) => (
                          <span key={index} className="bg-orange-100 text-orange-800 text-xs px-2 py-1 rounded-full">
                            {specialty}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Afternoon */}
                  <div className="flex items-start space-x-4">
                    <div className="bg-blue-100 rounded-full p-2">
                      <Camera className="w-4 h-4 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-gray-900">Afternoon - {day.afternoon.time}</h4>
                        <span className="text-green-600 font-medium">{day.afternoon.cost}</span>
                      </div>
                      <p className="text-gray-700 mb-1">{day.afternoon.activity}</p>
                      <p className="text-sm text-gray-500 mb-2">{day.afternoon.location}</p>
                      {day.afternoon.tips && day.afternoon.tips.length > 0 && (
                        <div className="bg-blue-50 border border-blue-200 rounded p-2">
                          <p className="text-xs text-blue-800">{day.afternoon.tips[0]}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Dinner */}
                  <div className="flex items-start space-x-4">
                    <div className="bg-purple-100 rounded-full p-2">
                      <Utensils className="w-4 h-4 text-purple-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-gray-900">Dinner</h4>
                        <span className="text-green-600 font-medium">{day.dinner.cost}</span>
                      </div>
                      <p className="text-gray-700 mb-1">{day.dinner.restaurant}</p>
                      <p className="text-sm text-gray-500 mb-2">{day.dinner.cuisine}</p>
                      <div className="flex flex-wrap gap-1">
                        {day.dinner.specialties.map((specialty, index) => (
                          <span key={index} className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded-full">
                            {specialty}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Evening */}
                  <div className="flex items-start space-x-4">
                    <div className="bg-indigo-100 rounded-full p-2">
                      <MapPin className="w-4 h-4 text-indigo-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-gray-900">Evening</h4>
                        <span className="text-green-600 font-medium">{day.evening.cost}</span>
                      </div>
                      <p className="text-gray-700 mb-1">{day.evening.activity}</p>
                      <p className="text-sm text-gray-500 mb-2">{day.evening.location}</p>
                      {day.evening.tips && day.evening.tips.length > 0 && (
                        <div className="bg-indigo-50 border border-indigo-200 rounded p-2">
                          <p className="text-xs text-indigo-800">{day.evening.tips[0]}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'budget' && (
          <div className="space-y-6">
            <div className="bg-green-50 border border-green-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-green-900 mb-4">Total Trip Cost</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">${itinerary.costBreakdown.total.min}</p>
                  <p className="text-sm text-green-700">Minimum Budget</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">${itinerary.costBreakdown.total.max}</p>
                  <p className="text-sm text-green-700">Maximum Budget</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {Object.entries(itinerary.costBreakdown).filter(([key]) => key !== 'total').map(([category, costs]) => (
                <div key={category} className="border border-gray-200 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-3 capitalize flex items-center space-x-2">
                    {category === 'accommodation' && <Bed className="w-4 h-4" />}
                    {category === 'food' && <Utensils className="w-4 h-4" />}
                    {category === 'activities' && <Camera className="w-4 h-4" />}
                    {category === 'transport' && <Car className="w-4 h-4" />}
                    <span>{category}</span>
                  </h4>
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-lg font-semibold text-gray-900">${costs.min} - ${costs.max}</p>
                      <p className="text-sm text-gray-500">Per person</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'practical' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900 mb-3 flex items-center space-x-2">
                  <Package className="w-5 h-5" />
                  <span>Packing List</span>
                </h3>
                <ul className="space-y-1">
                  {itinerary.packingList.map((item, index) => (
                    <li key={index} className="text-sm text-blue-800 flex items-center space-x-2">
                      <span className="text-blue-600">✓</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h3 className="font-semibold text-red-900 mb-3 flex items-center space-x-2">
                  <Phone className="w-5 h-5" />
                  <span>Emergency Information</span>
                </h3>
                <div className="space-y-3 text-sm">
                  <div>
                    <p className="font-medium text-red-800">Emergency Number</p>
                    <p className="text-red-700">{itinerary.emergencyInfo.emergencyNumber}</p>
                  </div>
                  <div>
                    <p className="font-medium text-red-800">Hospitals</p>
                    {itinerary.emergencyInfo.hospitals.map((hospital, index) => (
                      <p key={index} className="text-red-700">{hospital}</p>
                    ))}
                  </div>
                  <div>
                    <p className="font-medium text-red-800">Important Contacts</p>
                    {itinerary.emergencyInfo.importantPhones.map((phone, index) => (
                      <p key={index} className="text-red-700">{phone}</p>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}