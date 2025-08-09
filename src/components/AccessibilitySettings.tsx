import { useState } from 'react'
import { Accessibility, Eye, Volume2, Navigation, Heart, Users } from 'lucide-react'

interface AccessibilitySettingsProps {
  settings: Record<string, any>
  onSettingsChange: (settings: Record<string, any>) => void
}

export function AccessibilitySettings({ settings, onSettingsChange }: AccessibilitySettingsProps) {
  const [localSettings, setLocalSettings] = useState({
    mobility_assistance: settings.mobility_assistance || false,
    wheelchair_accessible: settings.wheelchair_accessible || false,
    visual_impairment: settings.visual_impairment || false,
    hearing_impairment: settings.hearing_impairment || false,
    cognitive_assistance: settings.cognitive_assistance || false,
    dietary_restrictions: settings.dietary_restrictions || [],
    medical_conditions: settings.medical_conditions || [],
    preferred_pace: settings.preferred_pace || 'moderate',
    group_assistance: settings.group_assistance || false,
    emergency_contact: settings.emergency_contact || '',
    special_notes: settings.special_notes || ''
  })

  const updateSetting = (key: string, value: any) => {
    const updated = { ...localSettings, [key]: value }
    setLocalSettings(updated)
    onSettingsChange(updated)
  }

  const toggleArrayItem = (key: string, item: string) => {
    const currentArray = localSettings[key] || []
    const updated = currentArray.includes(item)
      ? currentArray.filter((i: string) => i !== item)
      : [...currentArray, item]
    updateSetting(key, updated)
  }

  const dietaryOptions = [
    'Vegetarian', 'Vegan', 'Gluten-free', 'Dairy-free', 'Nut allergies',
    'Halal', 'Kosher', 'Low sodium', 'Diabetic-friendly'
  ]

  const medicalOptions = [
    'Heart condition', 'Diabetes', 'Asthma', 'Arthritis', 'Back problems',
    'Anxiety', 'Epilepsy', 'Blood pressure', 'Medication dependent'
  ]

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex items-center space-x-3 mb-6">
        <Accessibility className="w-6 h-6 text-blue-600" />
        <h2 className="text-xl font-semibold text-gray-900">Accessibility & Special Needs</h2>
      </div>

      <div className="space-y-8">
        {/* Physical Accessibility */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center space-x-2">
            <Navigation className="w-5 h-5" />
            <span>Physical Accessibility</span>
          </h3>
          
          <div className="space-y-3">
            <label className="flex items-center space-x-3">
              <input
                type="checkbox"
                checked={localSettings.mobility_assistance}
                onChange={(e) => updateSetting('mobility_assistance', e.target.checked)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-gray-700">Requires mobility assistance (cane, walker, etc.)</span>
            </label>

            <label className="flex items-center space-x-3">
              <input
                type="checkbox"
                checked={localSettings.wheelchair_accessible}
                onChange={(e) => updateSetting('wheelchair_accessible', e.target.checked)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-gray-700">Requires wheelchair accessibility</span>
            </label>
          </div>
        </div>

        {/* Sensory Accessibility */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center space-x-2">
            <Eye className="w-5 h-5" />
            <span>Sensory Accessibility</span>
          </h3>
          
          <div className="space-y-3">
            <label className="flex items-center space-x-3">
              <input
                type="checkbox"
                checked={localSettings.visual_impairment}
                onChange={(e) => updateSetting('visual_impairment', e.target.checked)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-gray-700">Visual impairment or blindness</span>
            </label>

            <label className="flex items-center space-x-3">
              <input
                type="checkbox"
                checked={localSettings.hearing_impairment}
                onChange={(e) => updateSetting('hearing_impairment', e.target.checked)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-gray-700">Hearing impairment or deafness</span>
            </label>

            <label className="flex items-center space-x-3">
              <input
                type="checkbox"
                checked={localSettings.cognitive_assistance}
                onChange={(e) => updateSetting('cognitive_assistance', e.target.checked)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-gray-700">Cognitive assistance needed</span>
            </label>
          </div>
        </div>

        {/* Travel Pace */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Preferred Travel Pace</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {[
              { value: 'slow', label: 'Slow & Relaxed', desc: 'Plenty of rest time' },
              { value: 'moderate', label: 'Moderate', desc: 'Balanced schedule' },
              { value: 'active', label: 'Active', desc: 'Full schedule' }
            ].map(option => (
              <label key={option.value} className="relative">
                <input
                  type="radio"
                  name="pace"
                  value={option.value}
                  checked={localSettings.preferred_pace === option.value}
                  onChange={(e) => updateSetting('preferred_pace', e.target.value)}
                  className="sr-only"
                />
                <div className={`p-4 border rounded-lg cursor-pointer transition-all ${
                  localSettings.preferred_pace === option.value
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

        {/* Dietary Restrictions */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Dietary Restrictions</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {dietaryOptions.map(option => (
              <label key={option} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={localSettings.dietary_restrictions.includes(option)}
                  onChange={() => toggleArrayItem('dietary_restrictions', option)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">{option}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Medical Conditions */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center space-x-2">
            <Heart className="w-5 h-5" />
            <span>Medical Conditions</span>
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {medicalOptions.map(option => (
              <label key={option} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={localSettings.medical_conditions.includes(option)}
                  onChange={() => toggleArrayItem('medical_conditions', option)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">{option}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Group Assistance */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center space-x-2">
            <Users className="w-5 h-5" />
            <span>Group Travel</span>
          </h3>
          
          <label className="flex items-center space-x-3">
            <input
              type="checkbox"
              checked={localSettings.group_assistance}
              onChange={(e) => updateSetting('group_assistance', e.target.checked)}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <span className="text-gray-700">Traveling with someone who needs assistance</span>
          </label>
        </div>

        {/* Emergency Contact */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Emergency Contact</h3>
          <input
            type="text"
            placeholder="Emergency contact name and phone number"
            value={localSettings.emergency_contact}
            onChange={(e) => updateSetting('emergency_contact', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Special Notes */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Special Notes</h3>
          <textarea
            placeholder="Any additional accessibility needs or special requirements..."
            value={localSettings.special_notes}
            onChange={(e) => updateSetting('special_notes', e.target.value)}
            rows={4}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      <div className="mt-8 pt-6 border-t border-gray-200">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <Accessibility className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-blue-900">Accessibility Features</h4>
              <p className="text-sm text-blue-700 mt-1">
                These settings help us recommend accessible activities, accommodations, and transportation options. 
                We'll also prioritize venues with appropriate facilities and suggest alternative options when needed.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}