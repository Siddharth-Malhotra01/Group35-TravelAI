import { useState, useEffect } from 'react'
import { ArrowLeft, Calendar, MapPin, Users, Settings, Bot, Plus, Clock, DollarSign, Download, Share2, Utensils } from 'lucide-react'
import { format } from 'date-fns'
import { comprehensiveAIService } from '../services/comprehensiveAIService'
import { exportService } from '../services/exportService'
import { ExpenseTracker } from './ExpenseTracker'
import { WeatherWidget } from './WeatherWidget'
import { DiningRecommendations } from './DiningRecommendations'
import { LocationRecommendations } from './LocationRecommendations'
import { ComprehensiveItineraryView } from './ComprehensiveItineraryView'
import { Trip, Destination, Activity } from '../types'
import { useLocalStorage } from '../hooks/useLocalStorage'

type TabType = 'itinerary' | 'ai-plan' | 'expenses' | 'weather' | 'dining' | 'recommendations'

interface TripDetailProps {
  trip: Trip
  onBack: () => void
}

export function TripDetail({ trip, onBack }: TripDetailProps) {
  const [destinations, setDestinations] = useState<Destination[]>([])
  const [activities, setActivities] = useState<Record<string, Activity[]>>({})
  const [activeTab, setActiveTab] = useState<TabType>('itinerary')
  const [loading, setLoading] = useState(true)
  const [generatingItinerary, setGeneratingItinerary] = useState(false)
  const [showAddActivity, setShowAddActivity] = useState<string | null>(null)
  const [newActivity, setNewActivity] = useState({
    title: '',
    description: '',
    activityDate: '',
    startTime: '',
    endTime: '',
    location: '',
    activityType: 'sightseeing',
    priceEstimate: ''
  })

  useEffect(() => {
    loadTripData()
  }, [trip.id])

  const loadTripData = async () => {
    try {
      // Load from localStorage
      const destinations = JSON.parse(localStorage.getItem('travel-destinations') || '[]')
      const activities = JSON.parse(localStorage.getItem('travel-activities') || '[]')
      

      const destinationsData = destinations
        .filter((d: Destination) => d.trip_id === trip.id)
        .sort((a: Destination, b: Destination) => a.order_index - b.order_index)
      setDestinations(destinationsData)

      // Group activities by destination
      const activitiesData: Record<string, Activity[]> = {}
      for (const destination of destinationsData) {
        const destActivities = activities
          .filter((a: Activity) => a.destination_id === destination.id)
          .sort((a: Activity, b: Activity) => {
            if (a.activity_date !== b.activity_date) {
              return a.activity_date.localeCompare(b.activity_date)
            }
            return a.order_index - b.order_index
          })
        activitiesData[destination.id] = destActivities
      }
      setActivities(activitiesData)
    } catch (error) {
      console.error('Error loading trip data:', error)
    } finally {
      setLoading(false)
    }
  }

  const generateAIItinerary = async () => {
    if (!trip || destinations.length === 0) return

    setGeneratingItinerary(true)
    try {
      const startDate = new Date(trip.start_date)
      const endDate = new Date(trip.end_date)
      const duration = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
      
      const itineraryData = await comprehensiveAIService.generateDetailedItinerary({
        destinations: destinations.map(d => d.name),
        duration,
        startDate: trip.start_date,
        budget: trip.budget_range,
        travelStyle: trip.travel_style,
        interests: ['sightseeing', 'culture', 'dining'],
        groupSize: trip.group_size || 1
      })
      
      // Insert activities for each destination
      for (const day of itineraryData.days) {
        // Find the destination for this day
        const destination = destinations.find(d => 
          d.name.toLowerCase().includes(day.destination.toLowerCase()) ||
          day.destination.toLowerCase().includes(d.name.toLowerCase())
        ) || destinations[0]

        if (day.activities && day.activities.length > 0) {
          const existingActivities = JSON.parse(localStorage.getItem('travel-activities') || '[]')
          const newActivities = day.activities.map((activity, index) => ({
            id: crypto.randomUUID(),
            destination_id: destination.id,
            title: activity.title,
            description: activity.description,
            activity_date: day.date,
            start_time: activity.time,
            end_time: activity.endTime,
            location: activity.location,
            activity_type: activity.type,
            price_estimate: activity.priceEstimate,
            booking_status: 'planned',
            order_index: index,
            metadata: {},
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }))
          
          existingActivities.push(...newActivities)
          localStorage.setItem('travel-activities', JSON.stringify(existingActivities))
        }
      }

      // Reload activities
      await loadTripData()
    } catch (error) {
      console.error('Error generating itinerary:', error)
    } finally {
      setGeneratingItinerary(false)
    }
  }

  const addActivity = async (destinationId: string) => {
    try {
      const existingActivities = JSON.parse(localStorage.getItem('travel-activities') || '[]')
      const newActivityData = {
        id: crypto.randomUUID(),
        destination_id: destinationId,
        title: newActivity.title,
        description: newActivity.description,
        activity_date: newActivity.activityDate,
        start_time: newActivity.startTime || null,
        end_time: newActivity.endTime || null,
        location: newActivity.location,
        activity_type: newActivity.activityType,
        price_estimate: newActivity.priceEstimate ? parseFloat(newActivity.priceEstimate) : null,
        booking_status: 'planned',
        order_index: (activities[destinationId]?.length || 0),
        metadata: {},
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
      
      existingActivities.push(newActivityData)
      localStorage.setItem('travel-activities', JSON.stringify(existingActivities))

      // Reset form
      setNewActivity({
        title: '',
        description: '',
        activityDate: '',
        startTime: '',
        endTime: '',
        location: '',
        activityType: 'sightseeing',
        priceEstimate: ''
      })
      setShowAddActivity(null)

      // Reload activities
      await loadTripData()
    } catch (error) {
      console.error('Error adding activity:', error)
    }
  }

  const handleExportPDF = async () => {
    if (!trip) return
    try {
      await exportService.exportToPDF(trip, destinations, activities)
    } catch (error) {
      console.error('Export failed:', error)
      alert('Failed to export PDF. Please try again.')
    }
  }

  const handleShareTrip = async () => {
    if (!trip) return
    try {
      await exportService.shareTrip(trip)
    } catch (error) {
      console.error('Share failed:', error)
      // Error handling is now done in the exportService
    }
  }

  const getActivityTypeIcon = (type: string) => {
    switch (type) {
      case 'dining': return '🍽️'
      case 'culture': return '🎭'
      case 'outdoor': return '🌳'
      case 'shopping': return '🛍️'
      case 'sightseeing': return '📸'
      default: return '📍'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }


  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-16 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center space-x-4 mb-4">
              <button
                onClick={onBack}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <ArrowLeft className="w-6 h-6" />
              </button>
              <h1 className="text-3xl font-bold text-gray-900">{trip.name}</h1>
            </div>

            <div className="flex items-center space-x-6 text-sm text-gray-600">
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4" />
                <span>
                  {format(new Date(trip.start_date), 'MMM d')} - {format(new Date(trip.end_date), 'MMM d, yyyy')}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <MapPin className="w-4 h-4" />
                <span>{destinations.length} destinations</span>
              </div>
              <div className="flex items-center space-x-2">
                <DollarSign className="w-4 h-4" />
                <span className="capitalize">{trip.budget_range} budget</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm p-6 sticky top-32">
              <h3 className="font-semibold text-gray-900 mb-4">Trip Actions</h3>
              
              <div className="space-y-3">
                <button
                  onClick={generateAIItinerary}
                  disabled={generatingItinerary}
                  className="w-full flex items-center space-x-3 px-4 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-colors disabled:opacity-50"
                >
                  <Bot className="w-5 h-5" />
                  <span>{generatingItinerary ? 'Generating...' : 'Generate AI Itinerary'}</span>
                </button>

                <button 
                  onClick={handleExportPDF}
                  className="w-full flex items-center space-x-3 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Download className="w-5 h-5" />
                  <span>Export PDF</span>
                </button>

                <button 
                  onClick={handleShareTrip}
                  className="w-full flex items-center space-x-3 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Share2 className="w-5 h-5" />
                  <span>Share Trip</span>
                </button>

                <button 
                  onClick={() => setActiveTab('expenses')}
                  className="w-full flex items-center space-x-3 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <DollarSign className="w-5 h-5" />
                  <span>View Expenses</span>
                </button>

                <button 
                  onClick={() => setActiveTab('weather')}
                  className="w-full flex items-center space-x-3 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Calendar className="w-5 h-5" />
                  <span>Check Weather</span>
                </button>

                <button 
                  onClick={() => window.print()}
                  className="w-full flex items-center space-x-3 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Users className="w-5 h-5" />
                  <span>Print Itinerary</span>
                </button>

                <button 
                  onClick={() => {
                    const confirmed = confirm('Are you sure you want to delete this trip? This action cannot be undone.')
                    if (confirmed) {
                      // Handle trip deletion
                      const trips = JSON.parse(localStorage.getItem('travel-trips') || '[]')
                      const updatedTrips = trips.filter((t: Trip) => t.id !== trip.id)
                      localStorage.setItem('travel-trips', JSON.stringify(updatedTrips))
                      onBack()
                    }
                  }}
                  className="w-full flex items-center space-x-3 px-4 py-3 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                >
                  <Settings className="w-5 h-5" />
                  <span>Delete Trip</span>
                </button>
              </div>

              {trip.description && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <h4 className="font-medium text-gray-900 mb-2">Description</h4>
                  <p className="text-gray-600 text-sm">{trip.description}</p>
                </div>
              )}
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Tabs */}
            <div className="bg-white rounded-xl shadow-sm mb-8">
              <div className="border-b border-gray-200">
                <nav className="flex space-x-8 px-6">
                  {[
                    { id: 'itinerary', label: 'Itinerary', icon: MapPin },
                    { id: 'ai-plan', label: 'AI Travel Plan', icon: Bot },
                    { id: 'recommendations', label: 'AI Recommendations', icon: Bot },
                    { id: 'expenses', label: 'Expenses', icon: DollarSign },
                    { id: 'weather', label: 'Weather', icon: Calendar },
                    { id: 'dining', label: 'Dining', icon: Utensils }
                  ].map(tab => {
                    const Icon = tab.icon
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as TabType)}
                        className={`flex items-center space-x-2 py-4 border-b-2 font-medium text-sm transition-colors ${
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
            </div>

            {/* Tab Content */}
            {activeTab === 'ai-plan' && destinations.length > 0 && (
              <ComprehensiveItineraryView
                destination={destinations[0].name}
                duration={Math.ceil((new Date(trip.end_date).getTime() - new Date(trip.start_date).getTime()) / (1000 * 60 * 60 * 24))}
                startDate={trip.start_date}
                budget={trip.budget_range as 'budget' | 'mid-range' | 'luxury'}
                travelStyle={trip.travel_style as 'relaxed' | 'balanced' | 'packed'}
                interests={['sightseeing', 'culture', 'dining']}
                groupSize={trip.group_size || 1}
                accessibility={Object.keys(trip.accessibility_requirements || {})}
              />
            )}
            {activeTab === 'expenses' && <ExpenseTracker tripId={tripId} />}
           {activeTab === 'expenses' && <ExpenseTracker tripId={trip.id} />}
            {activeTab === 'weather' && <WeatherWidget destinations={destinations} />}
            {activeTab === 'dining' && destinations.length > 0 && (
              <div className="space-y-8">
                {destinations.map(destination => (
                  <DiningRecommendations
                    key={destination.id}
                    destination={{
                      name: destination.name,
                      coordinates: destination.coordinates
                    }}
                  />
                ))}
              </div>
            )}
            {activeTab === 'recommendations' && destinations.length > 0 && (
              <div className="space-y-8">
                {destinations.map((destination, index) => (
                  <LocationRecommendations
                    key={destination.id}
                    destination={destination.name}
                    previousDestination={index > 0 ? destinations[index - 1].name : undefined}
                  />
                ))}
              </div>
            )}
            {activeTab === 'itinerary' && (
            destinations.length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm p-8 text-center">
                <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No destinations yet</h3>
                <p className="text-gray-600">Start planning your trip by adding destinations and activities.</p>
              </div>
            ) : (
              <div className="space-y-8">
                {destinations.map((destination) => (
                  <div key={destination.id} className="bg-white rounded-xl shadow-sm overflow-hidden">
                    <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
                      <h2 className="text-2xl font-bold mb-2">{destination.name}</h2>
                      <div className="flex items-center space-x-4 text-blue-100">
                        <div className="flex items-center space-x-1">
                          <Calendar className="w-4 h-4" />
                          <span>
                            {format(new Date(destination.arrival_date), 'MMM d')} - {format(new Date(destination.departure_date), 'MMM d')}
                          </span>
                        </div>
                        {destination.city && destination.country && (
                          <div className="flex items-center space-x-1">
                            <MapPin className="w-4 h-4" />
                            <span>{destination.city}, {destination.country}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="p-6">
                      {activities[destination.id]?.length ? (
                        <div className="space-y-4">
                          {activities[destination.id].map((activity) => (
                            <div key={activity.id} className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center space-x-3 mb-2">
                                    <span className="text-2xl">{getActivityTypeIcon(activity.activity_type)}</span>
                                    <h3 className="font-medium text-gray-900">{activity.title}</h3>
                                  </div>
                                  
                                  {activity.description && (
                                    <p className="text-gray-600 text-sm mb-2">{activity.description}</p>
                                  )}

                                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                                    <div className="flex items-center space-x-1">
                                      <Calendar className="w-4 h-4" />
                                      <span>{format(new Date(activity.activity_date), 'MMM d')}</span>
                                    </div>
                                    {activity.start_time && (
                                      <div className="flex items-center space-x-1">
                                        <Clock className="w-4 h-4" />
                                        <span>{activity.start_time}{activity.end_time && ` - ${activity.end_time}`}</span>
                                      </div>
                                    )}
                                    {activity.location && (
                                      <div className="flex items-center space-x-1">
                                        <MapPin className="w-4 h-4" />
                                        <span>{activity.location}</span>
                                      </div>
                                    )}
                                    {activity.price_estimate && (
                                      <div className="flex items-center space-x-1">
                                        <DollarSign className="w-4 h-4" />
                                        <span>${activity.price_estimate}</span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                          <h3 className="text-lg font-medium text-gray-900 mb-2">No activities planned</h3>
                          <p className="text-gray-600 mb-4">Add activities to start planning your time in {destination.name}.</p>
                        </div>
                      )}

                      {/* Add Activity Button */}
                      <div className="mt-6 pt-6 border-t border-gray-200">
                        {showAddActivity === destination.id ? (
                          <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <input
                                type="text"
                                placeholder="Activity title"
                                value={newActivity.title}
                                onChange={(e) => setNewActivity({ ...newActivity, title: e.target.value })}
                                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              />
                              <input
                                type="date"
                                value={newActivity.activityDate}
                                onChange={(e) => setNewActivity({ ...newActivity, activityDate: e.target.value })}
                                min={destination.arrival_date}
                                max={destination.departure_date}
                                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              />
                            </div>
                            
                            <textarea
                              placeholder="Description (optional)"
                              value={newActivity.description}
                              onChange={(e) => setNewActivity({ ...newActivity, description: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              rows={2}
                            />

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                              <input
                                type="time"
                                placeholder="Start time"
                                value={newActivity.startTime}
                                onChange={(e) => setNewActivity({ ...newActivity, startTime: e.target.value })}
                                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              />
                              <input
                                type="time"
                                placeholder="End time"
                                value={newActivity.endTime}
                                onChange={(e) => setNewActivity({ ...newActivity, endTime: e.target.value })}
                                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              />
                              <input
                                type="text"
                                placeholder="Location"
                                value={newActivity.location}
                                onChange={(e) => setNewActivity({ ...newActivity, location: e.target.value })}
                                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              />
                              <select
                                value={newActivity.activityType}
                                onChange={(e) => setNewActivity({ ...newActivity, activityType: e.target.value })}
                                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              >
                                <option value="sightseeing">Sightseeing</option>
                                <option value="dining">Dining</option>
                                <option value="culture">Culture</option>
                                <option value="outdoor">Outdoor</option>
                                <option value="shopping">Shopping</option>
                              </select>
                            </div>

                            <div className="flex items-center justify-between">
                              <input
                                type="number"
                                placeholder="Estimated cost ($)"
                                value={newActivity.priceEstimate}
                                onChange={(e) => setNewActivity({ ...newActivity, priceEstimate: e.target.value })}
                                className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              />
                              <div className="space-x-3">
                                <button
                                  onClick={() => setShowAddActivity(null)}
                                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                                >
                                  Cancel
                                </button>
                                <button
                                  onClick={() => addActivity(destination.id)}
                                  disabled={!newActivity.title || !newActivity.activityDate}
                                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  Add Activity
                                </button>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => setShowAddActivity(destination.id)}
                            className="flex items-center space-x-2 text-blue-600 hover:text-blue-800 transition-colors"
                          >
                            <Plus className="w-4 h-4" />
                            <span>Add Activity</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )
            )}
          </div>
        </div>
      </div>
    </div>
  )
}