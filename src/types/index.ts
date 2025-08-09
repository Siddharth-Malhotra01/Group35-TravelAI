export interface User {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  created_at: string
}

export interface UserPreferences {
  id: string
  user_id: string
  preferred_pace: 'slow' | 'balanced' | 'fast'
  preferred_budget: 'budget' | 'mid-range' | 'luxury'
  travel_style: Record<string, any>
  accessibility_needs: Record<string, any>
  language_preference: string
  dietary_restrictions: string[]
  interests: string[]
  past_destinations: string[]
}

export interface TripTheme {
  id: string
  name: string
  description: string
  icon: string
  color: string
  suggested_activities: string[]
}

export interface Trip {
  id: string
  creator_id: string
  name: string
  description: string | null
  start_date: string
  end_date: string
  budget_range: string
  travel_style: string
  status: string
  cover_image: string | null
  theme_id?: string
  pace: 'slow' | 'balanced' | 'fast'
  group_size: number
  accessibility_requirements: Record<string, any>
  weather_preferences: Record<string, any>
  is_template: boolean
  template_name?: string
  total_budget?: number
  currency: string
  created_at: string
  updated_at: string
}

export interface Destination {
  id: string
  trip_id: string
  name: string
  city: string | null
  country: string | null
  arrival_date: string
  departure_date: string
  order_index: number
  coordinates: any | null
  notes: string | null
  weather_info: Record<string, any>
  accessibility_rating?: number
  transportation_options: string[]
  local_currency?: string
  timezone?: string
  created_at: string
  updated_at: string
}

export interface Activity {
  id: string
  destination_id: string
  title: string
  description: string | null
  activity_date: string
  start_time: string | null
  end_time: string | null
  location: string | null
  activity_type: string
  price_estimate: number | null
  booking_status: 'planned' | 'booked' | 'confirmed' | 'cancelled'
  booking_reference?: string
  weather_dependent: boolean
  accessibility_rating?: number
  difficulty_level: 'easy' | 'moderate' | 'challenging'
  duration_minutes?: number
  tags: string[]
  order_index: number
  metadata: Record<string, any>
  created_at: string
  updated_at: string
}

export interface Expense {
  id: string
  trip_id: string
  user_id: string
  title: string
  amount: number
  currency: string
  category: 'accommodation' | 'transport' | 'food' | 'activities' | 'shopping' | 'other'
  description?: string
  incurred_on: string
  receipt_url?: string
  is_shared: boolean
  created_at: string
  updated_at: string
}

export interface Favorite {
  id: string
  user_id: string
  item_type: 'destination' | 'activity' | 'restaurant' | 'accommodation'
  item_name: string
  item_data: Record<string, any>
  notes?: string
  created_at: string
}

export interface TripTemplate {
  id: string
  creator_id: string
  name: string
  description?: string
  duration_days?: number
  theme_id?: string
  template_data: Record<string, any>
  is_public: boolean
  usage_count: number
  rating: number
  created_at: string
  updated_at: string
}

export interface ActivityReview {
  id: string
  activity_id: string
  user_id: string
  rating: number
  review_text?: string
  photos: string[]
  helpful_count: number
  created_at: string
  updated_at: string
}

export interface WeatherAlert {
  id: string
  trip_id: string
  destination_id: string
  alert_type: 'rain' | 'storm' | 'extreme_heat' | 'extreme_cold' | 'snow'
  alert_date: string
  severity: 'low' | 'medium' | 'high'
  message?: string
  is_read: boolean
  created_at: string
}

export interface TripCollaborator {
  id: string
  trip_id: string
  user_id: string
  role: 'owner' | 'editor' | 'viewer'
  invited_by?: string
  joined_at: string
}