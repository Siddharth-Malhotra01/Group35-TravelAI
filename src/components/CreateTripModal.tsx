import { useState } from 'react'
import { X, Plus, MapPin, Calendar } from 'lucide-react'
import { format } from 'date-fns'
import { EnhancedDestinationAutocomplete } from './EnhancedDestinationAutocomplete'
import { Trip } from '../types'

interface CreateTripModalProps {
  isOpen: boolean
  onClose: () => void
  onTripCreated: (trip: Trip) => void
}

export function CreateTripModal({ isOpen, onClose, onTripCreated }: CreateTripModalProps) {
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [tripData, setTripData] = useState({
    name: '',
    description: '',
    startDate: '',
    endDate: '',
    budgetRange: 'mid-range',
    travelStyle: 'balanced'
  })
  const [destinations, setDestinations] = useState<string[]>([''])
  const [destinationData, setDestinationData] = useState<Record<number, any>>({})

  if (!isOpen) return null

  const addDestination = () => {
    setDestinations([...destinations, ''])
  }

  const removeDestination = (index: number) => {
    if (destinations.length > 1) {
      setDestinations(destinations.filter((_, i) => i !== index))
    }
  }

  const updateDestination = (index: number, value: string) => {
    const updated = [...destinations]
    updated[index] = value
    setDestinations(updated)
  }

  const updateDestinationWithData = (index: number, value: string, placeData?: any) => {
    updateDestination(index, value)
    if (placeData) {
      setDestinationData(prev => ({ ...prev, [index]: placeData }))
    }
  }

  const handleCreateTrip = async () => {
    setLoading(true)
    try {
      // Generate unique ID
      const tripId = crypto.randomUUID()
      
      // Create trip object
      const newTrip: Trip = {
        id: tripId,
        creator_id: 'local-user',
        name: tripData.name,
        description: tripData.description,
        start_date: tripData.startDate,
        end_date: tripData.endDate,
        budget_range: tripData.budgetRange,
        travel_style: tripData.travelStyle,
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

      // Create destinations data
      const validDestinations = destinations.filter(dest => dest.trim())
      const destinationsData = []
      
      if (validDestinations.length > 0) {
        const startDate = new Date(tripData.startDate)
        const endDate = new Date(tripData.endDate)
        const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
        const daysPerDestination = Math.floor(totalDays / validDestinations.length)

        destinationsData.push(...validDestinations.map((destination, index) => {
          const arrivalDate = new Date(startDate.getTime() + (index * daysPerDestination * 24 * 60 * 60 * 1000))
          const departureDate = index === validDestinations.length - 1 
            ? endDate 
            : new Date(arrivalDate.getTime() + (daysPerDestination * 24 * 60 * 60 * 1000))

          return {
            id: crypto.randomUUID(),
            trip_id: tripId,
            name: destination.trim(),
            city: destinationData[index]?.formatted_address?.split(',')[1]?.trim() || null,
            country: destinationData[index]?.formatted_address?.split(',').pop()?.trim() || null,
            arrival_date: format(arrivalDate, 'yyyy-MM-dd'),
            departure_date: format(departureDate, 'yyyy-MM-dd'),
            order_index: index,
            coordinates: destinationData[index]?.geometry?.location || null,
            notes: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        }))
      }

      // Save to localStorage
      const existingTrips = JSON.parse(localStorage.getItem('travel-trips') || '[]')
      const existingDestinations = JSON.parse(localStorage.getItem('travel-destinations') || '[]')
      
      existingTrips.push(newTrip)
      existingDestinations.push(...destinationsData)
      
      localStorage.setItem('travel-trips', JSON.stringify(existingTrips))
      localStorage.setItem('travel-destinations', JSON.stringify(existingDestinations))

      onTripCreated(newTrip)
      onClose()
      
      // Reset form
      setStep(1)
      setTripData({
        name: '',
        description: '',
        startDate: '',
        endDate: '',
        budgetRange: 'mid-range',
        travelStyle: 'balanced'
      })
      setDestinations([''])
      setDestinationData({})
      setDestinationData({})
    } catch (error) {
      console.error('Error creating trip:', error)
    } finally {
      setLoading(false)
    }
  }

  const nextStep = () => setStep(step + 1)
  const prevStep = () => setStep(step - 1)

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">Create New Trip</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="w-6 h-6" />
            </button>
          </div>
          
          {/* Progress indicator */}
          <div className="flex items-center space-x-2 mt-4">
            {[1, 2, 3].map((stepNum) => (
              <div
                key={stepNum}
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  stepNum <= step ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
                }`}
              >
                {stepNum}
              </div>
            ))}
          </div>
        </div>

        <div className="p-6">
          {step === 1 && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900">Basic Information</h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Trip Name *
                </label>
                <input
                  type="text"
                  value={tripData.name}
                  onChange={(e) => setTripData({ ...tripData, name: e.target.value })}
                  placeholder="e.g., European Adventure 2024"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description (optional)
                </label>
                <textarea
                  value={tripData.description}
                  onChange={(e) => setTripData({ ...tripData, description: e.target.value })}
                  placeholder="Tell us about your trip..."
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Start Date *
                  </label>
                  <input
                    type="date"
                    value={tripData.startDate}
                    onChange={(e) => setTripData({ ...tripData, startDate: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    End Date *
                  </label>
                  <input
                    type="date"
                    value={tripData.endDate}
                    onChange={(e) => setTripData({ ...tripData, endDate: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900">Destinations</h3>
              
              {destinations.map((destination, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <MapPin className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  <EnhancedDestinationAutocomplete
                    value={destination}
                    onChange={(value, suggestionData) => updateDestinationWithData(index, value, suggestionData)}
                    placeholder="e.g., Paris, France"
                    className="flex-1"
                  />
                  {destinations.length > 1 && (
                    <button
                      onClick={() => removeDestination(index)}
                      className="text-red-600 hover:text-red-800 transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  )}
                </div>
              ))}

              <button
                onClick={addDestination}
                className="flex items-center space-x-2 text-blue-600 hover:text-blue-800 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Add Destination</span>
              </button>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900">Travel Preferences</h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Budget Range
                </label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {[
                    { value: 'budget', label: 'Budget', desc: 'Under $100/day' },
                    { value: 'mid-range', label: 'Mid-range', desc: '$100-300/day' },
                    { value: 'luxury', label: 'Luxury', desc: '$300+/day' }
                  ].map((option) => (
                    <label key={option.value} className="relative">
                      <input
                        type="radio"
                        name="budget"
                        value={option.value}
                        checked={tripData.budgetRange === option.value}
                        onChange={(e) => setTripData({ ...tripData, budgetRange: e.target.value })}
                        className="sr-only"
                      />
                      <div className={`p-4 border rounded-lg cursor-pointer transition-all ${
                        tripData.budgetRange === option.value
                          ? 'border-blue-600 bg-blue-50'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}>
                        <div className="font-medium text-gray-900">{option.label}</div>
                        <div className="text-sm text-gray-500">{option.desc}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Travel Style
                </label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {[
                    { value: 'relaxed', label: 'Relaxed', desc: 'Take it slow' },
                    { value: 'balanced', label: 'Balanced', desc: 'Mix of activities' },
                    { value: 'packed', label: 'Action-packed', desc: 'See everything' }
                  ].map((option) => (
                    <label key={option.value} className="relative">
                      <input
                        type="radio"
                        name="style"
                        value={option.value}
                        checked={tripData.travelStyle === option.value}
                        onChange={(e) => setTripData({ ...tripData, travelStyle: e.target.value })}
                        className="sr-only"
                      />
                      <div className={`p-4 border rounded-lg cursor-pointer transition-all ${
                        tripData.travelStyle === option.value
                          ? 'border-blue-600 bg-blue-50'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}>
                        <div className="font-medium text-gray-900">{option.label}</div>
                        <div className="text-sm text-gray-500">{option.desc}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-between mt-8 pt-6 border-t border-gray-200">
            <button
              onClick={prevStep}
              disabled={step === 1}
              className="px-6 py-2 text-gray-600 hover:text-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>

            <div className="space-x-3">
              {step < 3 ? (
                <button
                  onClick={nextStep}
                  disabled={
                    (step === 1 && (!tripData.name || !tripData.startDate || !tripData.endDate)) ||
                    (step === 2 && destinations.filter(d => d.trim()).length === 0)
                  }
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              ) : (
                <button
                  onClick={handleCreateTrip}
                  disabled={loading}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Creating...' : 'Create Trip'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}