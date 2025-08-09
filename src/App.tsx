import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Navbar } from './components/Navbar'
import { TripCard } from './components/TripCard'
import { CreateTripModal } from './components/CreateTripModal'
import { TripDetail } from './components/TripDetail'
import { TripTemplates } from './components/TripTemplates'
import { ExpenseTracker } from './components/ExpenseTracker'
import { CalendarView } from './components/CalendarView'
import { WeatherWidget } from './components/WeatherWidget'
import { AccessibilitySettings } from './components/AccessibilitySettings'
import { TravelExpertChatbot } from './components/TravelExpertChatbot'
import { Plane, Plus, MapPin } from 'lucide-react'
import { Trip, TripTemplate, Destination, Activity } from './types'
import { useLocalStorage } from './hooks/useLocalStorage'

type ViewMode = 'dashboard' | 'trip-detail' | 'templates' | 'calendar' | 'settings'

function App() {
  const [trips, setTrips] = useLocalStorage<Trip[]>('travel-trips', [])
  const [destinations, setDestinations] = useLocalStorage<Destination[]>('travel-destinations', [])
  const [activities, setActivities] = useLocalStorage<Record<string, Activity[]>>('travel-activities', {})
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [currentView, setCurrentView] = useState<ViewMode>('dashboard')
  const [selectedTripId, setSelectedTripId] = useState<string | null>(null)
  const [accessibilitySettings, setAccessibilitySettings] = useLocalStorage('accessibility-settings', {})
  const [isChatbotOpen, setIsChatbotOpen] = useState(false)

  useEffect(() => {
    setLoading(false)
  }, [])

  const handleCreateTrip = () => {
    setShowCreateModal(true)
  }

  const handleTripCreated = (newTrip: Trip) => {
    setTrips([...trips, newTrip])
  }

  const handleDeleteTrip = (tripId: string) => {
    setTrips(trips.filter(trip => trip.id !== tripId))
    setDestinations(destinations.filter(dest => dest.trip_id !== tripId))
    // Remove activities for deleted destinations
    const updatedActivities = { ...activities }
    destinations.filter(dest => dest.trip_id === tripId).forEach(dest => {
      delete updatedActivities[dest.id]
    })
    setActivities(updatedActivities)
  }

  const handleCreateFromTemplate = (template: TripTemplate) => {
    // Create a new trip based on the template
    const newTrip: Trip = {
      id: crypto.randomUUID(),
      creator_id: 'local-user',
      name: template.name,
      description: template.description || null,
      start_date: new Date().toISOString().split('T')[0],
      end_date: new Date(Date.now() + (template.duration_days || 7) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      budget_range: template.template_data.budget_range || 'mid-range',
      travel_style: template.template_data.travel_style || 'balanced',
      status: 'planning',
      cover_image: null,
      pace: 'balanced',
      group_size: 1,
      accessibility_requirements: {},
      weather_preferences: {},
      is_template: false,
      total_budget: 0,
      currency: 'USD',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    setTrips([...trips, newTrip])
    setSelectedTripId(newTrip.id)
    setCurrentView('trip-detail')
    setShowCreateModal(false)
  }

  const getCurrentViewDestinations = (): Destination[] => {
    if (currentView === 'calendar' || currentView === 'dashboard') {
      return destinations
    }
    if (selectedTripId) {
      return destinations.filter(dest => dest.trip_id === selectedTripId)
    }
    return []
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  const renderCurrentView = () => {
    switch (currentView) {
      case 'trip-detail':
        if (!selectedTripId) {
          setCurrentView('dashboard')
          return null
        }
        const selectedTrip = trips.find(trip => trip.id === selectedTripId)
        if (!selectedTrip) {
          setCurrentView('dashboard')
          setSelectedTripId(null)
          return null
        }
        return (
          <TripDetail
            trip={selectedTrip}
            onBack={() => {
              setCurrentView('dashboard')
              setSelectedTripId(null)
            }}
          />
        )
      
      case 'templates':
        return (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <TripTemplates onCreateFromTemplate={handleCreateFromTemplate} />
          </div>
        )
      
      case 'calendar':
        return (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                <CalendarView 
                  destinations={getCurrentViewDestinations()} 
                  activities={activities} 
                />
              </div>
              <div>
                <WeatherWidget destinations={getCurrentViewDestinations()} />
              </div>
            </div>
          </div>
        )
      
      case 'settings':
        return (
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <AccessibilitySettings 
              settings={accessibilitySettings}
              onSettingsChange={setAccessibilitySettings}
            />
          </div>
        )
      
      default:
        return renderDashboard()
    }
  }

  const renderDashboard = () => (
    <>
      {/* Hero Section */}
      {trips.length === 0 && (
        <div className="relative bg-gradient-to-r from-blue-600 to-purple-700 text-white">
          <div className="absolute inset-0 bg-black opacity-20"></div>
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
            <div className="text-center">
              <div className="flex justify-center mb-8">
                <div className="bg-white bg-opacity-20 rounded-full p-4">
                  <Plane className="w-16 h-16" />
                </div>
              </div>
              <h1 className="text-5xl font-bold mb-6">
                Plan Your Perfect Trip with AI
              </h1>
              <p className="text-xl text-blue-100 mb-8 max-w-3xl mx-auto">
                Create personalized itineraries, discover amazing destinations, and get AI-powered recommendations. 
                Start planning your next unforgettable adventure today.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={handleCreateTrip}
                  className="bg-white text-blue-600 px-8 py-4 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
                >
                  Start Planning Your Trip
                </button>
                <button
                  onClick={() => setCurrentView('templates')}
                  className="bg-transparent border-2 border-white text-white px-8 py-4 rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition-colors"
                >
                  Browse Templates
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {trips.length > 0 && (
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Your Trips</h1>
              <p className="text-gray-600 mt-2">Plan, organize, and manage your travel adventures</p>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setCurrentView('templates')}
                className="text-purple-600 hover:text-purple-800 transition-colors font-medium"
              >
                Browse Templates
              </button>
              <button
                onClick={handleCreateTrip}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center space-x-2"
              >
                <Plus className="w-5 h-5" />
                <span>New Trip</span>
              </button>
            </div>
          </div>
        )}

        {trips.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {trips.map((trip) => (
              <TripCard
                key={trip.id}
                trip={trip}
                onClick={() => {
                  setSelectedTripId(trip.id)
                  setCurrentView('trip-detail')
                }}
                onEdit={() => {
                  // TODO: Implement edit functionality
                  console.log('Edit trip:', trip.id)
                }}
                onDelete={() => handleDeleteTrip(trip.id)}
              />
            ))}
          </div>
        )}

        {trips.length === 0 && (
          <div className="py-16">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-gray-900 mb-8">Why Choose TravelAI?</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
                <div className="text-center">
                  <div className="bg-blue-100 rounded-full p-4 w-16 h-16 mx-auto mb-4">
                    <Plane className="w-8 h-8 text-blue-600 mx-auto" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">AI-Powered Planning</h3>
                  <p className="text-gray-600">Get personalized recommendations and optimized itineraries based on your preferences.</p>
                </div>
                <div className="text-center">
                  <div className="bg-green-100 rounded-full p-4 w-16 h-16 mx-auto mb-4">
                    <MapPin className="w-8 h-8 text-green-600 mx-auto" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Smart Organization</h3>
                  <p className="text-gray-600">Keep all your travel plans organized in one place with intuitive editing capabilities.</p>
                </div>
                <div className="text-center">
                  <div className="bg-purple-100 rounded-full p-4 w-16 h-16 mx-auto mb-4">
                    <Plus className="w-8 h-8 text-purple-600 mx-auto" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Easy Planning</h3>
                  <p className="text-gray-600">Create detailed itineraries with destinations, activities, and timing all in one place.</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar 
        onCreateTrip={handleCreateTrip}
        currentView={currentView}
        onViewChange={setCurrentView}
      />
      
      {renderCurrentView()}

      {/* Modals */}
      <CreateTripModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onTripCreated={handleTripCreated}
      />

      {/* Travel Chatbot */}
      <TravelExpertChatbot
        isOpen={isChatbotOpen}
        onToggle={() => setIsChatbotOpen(!isChatbotOpen)}
      />
    </div>
  )
}


export default App