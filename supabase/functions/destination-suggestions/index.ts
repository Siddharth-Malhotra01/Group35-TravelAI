import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

interface SuggestionRequest {
  query: string
  limit?: number
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { query, limit = 10 }: SuggestionRequest = await req.json()

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    let suggestions = []

    if (query && query.trim().length > 0) {
      // Search destinations using fuzzy matching
      const { data, error } = await supabase
        .from('destination_suggestions')
        .select('*')
        .or(`name.ilike.%${query}%,country.ilike.%${query}%,description.ilike.%${query}%`)
        .order('popularity_score', { ascending: false })
        .limit(limit)

      if (error) {
        console.error('Database error:', error)
        suggestions = getFallbackSuggestions(query)
      } else {
        suggestions = data.map(item => ({
          name: item.name,
          country: item.country,
          continent: item.continent,
          description: item.description,
          popularFor: item.popular_for,
          bestTime: item.best_time,
          coordinates: item.coordinates,
          popularityScore: item.popularity_score
        }))
      }
    } else {
      // Return popular destinations when no query
      const { data, error } = await supabase
        .from('destination_suggestions')
        .select('*')
        .order('popularity_score', { ascending: false })
        .limit(limit)

      if (error) {
        console.error('Database error:', error)
        suggestions = getFallbackSuggestions('')
      } else {
        suggestions = data.map(item => ({
          name: item.name,
          country: item.country,
          continent: item.continent,
          description: item.description,
          popularFor: item.popular_for,
          bestTime: item.best_time,
          coordinates: item.coordinates,
          popularityScore: item.popularity_score
        }))
      }
    }

    return new Response(
      JSON.stringify({ suggestions }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )
  } catch (error) {
    console.error('Error getting destination suggestions:', error)
    return new Response(
      JSON.stringify({ 
        suggestions: getFallbackSuggestions(''),
        error: 'Using fallback suggestions'
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )
  }
})

function getFallbackSuggestions(query: string) {
  const fallbackDestinations = [
    {
      name: "Paris",
      country: "France",
      continent: "Europe",
      description: "City of Light and Love",
      popularFor: ["Art", "Culture", "Romance", "Food"],
      bestTime: "Apr-Jun, Sep-Oct",
      coordinates: { lat: 48.8566, lng: 2.3522 },
      popularityScore: 100
    },
    {
      name: "Tokyo",
      country: "Japan",
      continent: "Asia",
      description: "Modern Metropolis",
      popularFor: ["Technology", "Food", "Culture", "Shopping"],
      bestTime: "Mar-May, Sep-Nov",
      coordinates: { lat: 35.6762, lng: 139.6503 },
      popularityScore: 95
    },
    {
      name: "New York",
      country: "United States",
      continent: "North America",
      description: "The Big Apple",
      popularFor: ["Culture", "Broadway", "Food", "Museums"],
      bestTime: "Apr-Jun, Sep-Nov",
      coordinates: { lat: 40.7128, lng: -74.0060 },
      popularityScore: 90
    },
    {
      name: "London",
      country: "United Kingdom",
      continent: "Europe",
      description: "Historic Capital",
      popularFor: ["History", "Museums", "Theater", "Culture"],
      bestTime: "May-Sep",
      coordinates: { lat: 51.5074, lng: -0.1278 },
      popularityScore: 85
    },
    {
      name: "Rome",
      country: "Italy",
      continent: "Europe",
      description: "Eternal City",
      popularFor: ["History", "Architecture", "Food", "Art"],
      bestTime: "Apr-Jun, Sep-Oct",
      coordinates: { lat: 41.9028, lng: 12.4964 },
      popularityScore: 80
    }
  ]

  if (!query || query.trim().length === 0) {
    return fallbackDestinations
  }

  return fallbackDestinations.filter(dest =>
    dest.name.toLowerCase().includes(query.toLowerCase()) ||
    dest.country.toLowerCase().includes(query.toLowerCase()) ||
    dest.popularFor.some(tag => tag.toLowerCase().includes(query.toLowerCase()))
  )
}