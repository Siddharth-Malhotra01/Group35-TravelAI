import { useState } from 'react'
import { Copy, Star, Users, Calendar, MapPin, Sparkles } from 'lucide-react'
import { TripTemplate, Trip } from '../types'
import { useLocalStorage } from '../hooks/useLocalStorage'

interface TripTemplatesProps {
  onCreateFromTemplate: (template: TripTemplate) => void
}

export function TripTemplates({ onCreateFromTemplate }: TripTemplatesProps) {
  const [templates] = useLocalStorage<TripTemplate[]>('travel-templates', [])
  const [selectedCategory, setSelectedCategory] = useState<string>('all')

  // Mock popular templates for demo
  const popularTemplates: TripTemplate[] = [
    {
      id: 'template-1',
      creator_id: 'system',
      name: 'European Grand Tour',
      description: 'Classic 14-day journey through Europe\'s most iconic cities',
      duration_days: 14,
      theme_id: 'cultural',
      template_data: {
        destinations: ['Paris', 'Rome', 'Barcelona', 'Amsterdam'],
        budget_range: 'mid-range',
        travel_style: 'balanced'
      },
      is_public: true,
      usage_count: 1247,
      rating: 4.8,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z'
    },
    {
      id: 'template-2',
      creator_id: 'system',
      name: 'Southeast Asia Adventure',
      description: 'Backpacking adventure through Thailand, Vietnam, and Cambodia',
      duration_days: 21,
      theme_id: 'adventure',
      template_data: {
        destinations: ['Bangkok', 'Ho Chi Minh City', 'Siem Reap', 'Phuket'],
        budget_range: 'budget',
        travel_style: 'packed'
      },
      is_public: true,
      usage_count: 892,
      rating: 4.6,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z'
    },
    {
      id: 'template-3',
      creator_id: 'system',
      name: 'Romantic Paris Weekend',
      description: 'Perfect 3-day romantic getaway in the City of Love',
      duration_days: 3,
      theme_id: 'romantic',
      template_data: {
        destinations: ['Paris'],
        budget_range: 'luxury',
        travel_style: 'relaxed'
      },
      is_public: true,
      usage_count: 654,
      rating: 4.9,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z'
    },
    {
      id: 'template-4',
      creator_id: 'system',
      name: 'Family Disney World',
      description: 'Magical 7-day family vacation at Disney World Orlando',
      duration_days: 7,
      theme_id: 'family',
      template_data: {
        destinations: ['Orlando'],
        budget_range: 'mid-range',
        travel_style: 'packed'
      },
      is_public: true,
      usage_count: 1156,
      rating: 4.7,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z'
    }
  ]

  const allTemplates = [...popularTemplates, ...templates]

  const categories = [
    { id: 'all', name: 'All Templates', icon: '📋' },
    { id: 'popular', name: 'Popular', icon: '🔥' },
    { id: 'romantic', name: 'Romantic', icon: '💕' },
    { id: 'family', name: 'Family', icon: '👨‍👩‍👧‍👦' },
    { id: 'adventure', name: 'Adventure', icon: '🏔️' },
    { id: 'cultural', name: 'Cultural', icon: '🏛️' },
    { id: 'luxury', name: 'Luxury', icon: '✨' }
  ]

  const filteredTemplates = allTemplates.filter(template => {
    if (selectedCategory === 'all') return true
    if (selectedCategory === 'popular') return template.usage_count > 500
    return template.theme_id === selectedCategory
  })

  const getThemeColor = (themeId?: string) => {
    const colors: Record<string, string> = {
      romantic: 'bg-pink-100 text-pink-800',
      family: 'bg-green-100 text-green-800',
      adventure: 'bg-orange-100 text-orange-800',
      cultural: 'bg-purple-100 text-purple-800',
      luxury: 'bg-yellow-100 text-yellow-800',
      relaxation: 'bg-blue-100 text-blue-800'
    }
    return colors[themeId || ''] || 'bg-gray-100 text-gray-800'
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex items-center space-x-3 mb-6">
        <Sparkles className="w-6 h-6 text-purple-600" />
        <h2 className="text-xl font-semibold text-gray-900">Trip Templates</h2>
      </div>

      {/* Category Filter */}
      <div className="flex flex-wrap gap-2 mb-6">
        {categories.map(category => (
          <button
            key={category.id}
            onClick={() => setSelectedCategory(category.id)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              selectedCategory === category.id
                ? 'bg-purple-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <span>{category.icon}</span>
            <span>{category.name}</span>
          </button>
        ))}
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTemplates.map(template => (
          <div key={template.id} className="border border-gray-200 rounded-lg p-4 hover:border-purple-300 transition-colors">
            <div className="flex items-start justify-between mb-3">
              <h3 className="font-medium text-gray-900 line-clamp-2">{template.name}</h3>
              {template.theme_id && (
                <span className={`px-2 py-1 rounded text-xs font-medium ${getThemeColor(template.theme_id)}`}>
                  {template.theme_id}
                </span>
              )}
            </div>

            <p className="text-sm text-gray-600 mb-4 line-clamp-2">{template.description}</p>

            <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
              <div className="flex items-center space-x-4">
                {template.duration_days && (
                  <div className="flex items-center space-x-1">
                    <Calendar className="w-4 h-4" />
                    <span>{template.duration_days} days</span>
                  </div>
                )}
                <div className="flex items-center space-x-1">
                  <MapPin className="w-4 h-4" />
                  <span>{template.template_data.destinations?.length || 0} stops</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="flex items-center space-x-1">
                  <Star className="w-4 h-4 text-yellow-500 fill-current" />
                  <span className="text-sm font-medium">{template.rating}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Users className="w-4 h-4" />
                  <span className="text-sm">{template.usage_count}</span>
                </div>
              </div>

              <button
                onClick={() => onCreateFromTemplate(template)}
                className="flex items-center space-x-1 bg-purple-600 text-white px-3 py-1.5 rounded-lg hover:bg-purple-700 transition-colors text-sm"
              >
                <Copy className="w-4 h-4" />
                <span>Use Template</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredTemplates.length === 0 && (
        <div className="text-center py-12">
          <Sparkles className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No templates found</h3>
          <p className="text-gray-600">Try selecting a different category or create your own template.</p>
        </div>
      )}
    </div>
  )
}