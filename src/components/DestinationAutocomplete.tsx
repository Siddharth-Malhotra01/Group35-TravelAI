import { useState, useEffect, useRef } from 'react'
import { MapPin, Search, X } from 'lucide-react'
import { googlePlacesService } from '../services/googlePlacesService'
import { destinationService } from '../services/destinationService'

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
}

interface DestinationAutocompleteProps {
  value: string
  onChange: (value: string, placeData?: PlaceResult) => void
  placeholder?: string
  className?: string
}

export function DestinationAutocomplete({ 
  value, 
  onChange, 
  placeholder = "Search destinations...",
  className = ""
}: DestinationAutocompleteProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [suggestions, setSuggestions] = useState<PlaceResult[]>([])
  const [loading, setLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const searchDestinations = async (query: string) => {
    if (!query.trim()) {
      setSuggestions([])
      return
    }

    setLoading(true)
    try {
      // Get popular destinations first
      const popularDestinations = destinationService.searchDestinations(query)
      
      // Convert to PlaceResult format
      const popularResults: PlaceResult[] = popularDestinations.map(dest => ({
        place_id: `popular_${dest.name.toLowerCase().replace(/\s+/g, '_')}`,
        name: dest.name,
        formatted_address: `${dest.name}, ${dest.country}`,
        geometry: {
          location: dest.coordinates
        },
        types: ['locality', 'political']
      }))

      // Also get Google Places results
      const googleResults = await googlePlacesService.searchDestinations(query)
      
      // Combine results, prioritizing popular destinations
      const combinedResults = [
        ...popularResults,
        ...googleResults.filter(google => 
          !popularResults.some(popular => 
            popular.name.toLowerCase() === google.name.toLowerCase()
          )
        )
      ].slice(0, 10)
      
      setSuggestions(combinedResults)
      setSuggestions(results)
      setIsOpen(true)
    } catch (error) {
      console.error('Error searching destinations:', error)
      setSuggestions([])
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    onChange(newValue)
    
    // Debounce search
    const timeoutId = setTimeout(() => {
      searchDestinations(newValue)
    }, 300)

    return () => clearTimeout(timeoutId)
  }

  const handleSelectSuggestion = async (suggestion: PlaceResult) => {
    // Get detailed place information
    const placeDetails = await googlePlacesService.getPlaceDetails(suggestion.place_id)
    onChange(suggestion.name, placeDetails || suggestion)
    setIsOpen(false)
    setSuggestions([])
  }

  const clearInput = () => {
    onChange('')
    setSuggestions([])
    setIsOpen(false)
    inputRef.current?.focus()
  }

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={handleInputChange}
          onFocus={() => value && searchDestinations(value)}
          placeholder={placeholder}
          className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        {value && (
          <button
            onClick={clearInput}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {loading ? (
            <div className="p-4 text-center text-gray-500">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 mx-auto mb-2"></div>
              Searching destinations...
            </div>
          ) : suggestions.length > 0 ? (
            suggestions.map((suggestion) => (
              <button
                key={suggestion.place_id}
                onClick={() => handleSelectSuggestion(suggestion)}
                className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0 flex items-center space-x-3"
              >
                <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-gray-900 truncate">
                    {suggestion.name}
                  </div>
                  <div className="text-sm text-gray-500 truncate">
                    {suggestion.formatted_address}
                  </div>
                  {suggestion.place_id.startsWith('popular_') && (
                    <div className="text-xs text-blue-600 mt-1">
                      Popular destination
                    </div>
                  )}
                </div>
              </button>
            ))
          ) : value.trim() && !loading ? (
            <div className="p-4 text-center text-gray-500">
              No destinations found for "{value}"
            </div>
          ) : null}
        </div>
      )}
    </div>
  )
}