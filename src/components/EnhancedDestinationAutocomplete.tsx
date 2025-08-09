import { useState, useEffect, useRef } from 'react'
import { MapPin, Search, X, Star, Globe } from 'lucide-react'
import { comprehensiveAIService } from '../services/comprehensiveAIService'

interface DestinationSuggestion {
  name: string
  country: string
  continent: string
  description: string
  popularFor: string[]
  bestTime: string
  coordinates: { lat: number; lng: number }
  popularityScore: number
}

interface EnhancedDestinationAutocompleteProps {
  value: string
  onChange: (value: string, suggestion?: DestinationSuggestion) => void
  placeholder?: string
  className?: string
}

export function EnhancedDestinationAutocomplete({ 
  value, 
  onChange, 
  placeholder = "Search destinations worldwide...",
  className = ""
}: EnhancedDestinationAutocompleteProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [suggestions, setSuggestions] = useState<DestinationSuggestion[]>([])
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
      // Load popular destinations when no query
      setLoading(true)
      try {
        const results = await comprehensiveAIService.getDestinationSuggestions('')
        setSuggestions(results)
        setIsOpen(true)
      } catch (error) {
        console.error('Error loading popular destinations:', error)
        setSuggestions([])
      } finally {
        setLoading(false)
      }
      return
    }

    setLoading(true)
    try {
      const results = await comprehensiveAIService.getDestinationSuggestions(query)
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

  const handleSelectSuggestion = (suggestion: DestinationSuggestion) => {
    onChange(suggestion.name, suggestion)
    setIsOpen(false)
    setSuggestions([])
  }

  const clearInput = () => {
    onChange('')
    setSuggestions([])
    setIsOpen(false)
    inputRef.current?.focus()
  }

  const handleFocus = () => {
    if (!value) {
      searchDestinations('')
    } else if (suggestions.length > 0) {
      setIsOpen(true)
    }
  }

  const getPopularityColor = (score: number) => {
    if (score >= 80) return 'text-red-500'
    if (score >= 60) return 'text-orange-500'
    if (score >= 40) return 'text-yellow-500'
    return 'text-gray-400'
  }

  const getPopularityLabel = (score: number) => {
    if (score >= 80) return 'Very Popular'
    if (score >= 60) return 'Popular'
    if (score >= 40) return 'Trending'
    return 'Hidden Gem'
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
          onFocus={handleFocus}
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
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-96 overflow-y-auto">
          {loading ? (
            <div className="p-4 text-center text-gray-500">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 mx-auto mb-2"></div>
              Searching destinations...
            </div>
          ) : suggestions.length > 0 ? (
            <>
              {!value && (
                <div className="px-4 py-2 bg-gray-50 border-b border-gray-200">
                  <p className="text-sm font-medium text-gray-700">Popular Destinations</p>
                </div>
              )}
              {suggestions.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => handleSelectSuggestion(suggestion)}
                  className="w-full px-4 py-4 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3 flex-1 min-w-0">
                      <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0 mt-1" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <h3 className="font-medium text-gray-900 truncate">
                            {suggestion.name}
                          </h3>
                          <span className="text-sm text-gray-500">
                            {suggestion.country}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 line-clamp-1 mb-2">
                          {suggestion.description}
                        </p>
                        <div className="flex items-center space-x-2 mb-2">
                          <Globe className="w-3 h-3 text-gray-400" />
                          <span className="text-xs text-gray-500">{suggestion.continent}</span>
                          <span className="text-xs text-gray-400">•</span>
                          <span className="text-xs text-gray-500">Best: {suggestion.bestTime}</span>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {suggestion.popularFor.slice(0, 3).map((tag, tagIndex) => (
                            <span key={tagIndex} className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                              {tag}
                            </span>
                          ))}
                          {suggestion.popularFor.length > 3 && (
                            <span className="text-xs text-gray-500">
                              +{suggestion.popularFor.length - 3} more
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end space-y-1 ml-3">
                      <div className="flex items-center space-x-1">
                        <Star className={`w-3 h-3 ${getPopularityColor(suggestion.popularityScore)} fill-current`} />
                        <span className="text-xs text-gray-500">{suggestion.popularityScore}</span>
                      </div>
                      <span className={`text-xs font-medium ${getPopularityColor(suggestion.popularityScore)}`}>
                        {getPopularityLabel(suggestion.popularityScore)}
                      </span>
                    </div>
                  </div>
                </button>
              ))}
            </>
          ) : value.trim() && !loading ? (
            <div className="p-4 text-center text-gray-500">
              <MapPin className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p>No destinations found for "{value}"</p>
              <p className="text-sm">Try searching for a city or country name</p>
            </div>
          ) : null}
        </div>
      )}
    </div>
  )
}