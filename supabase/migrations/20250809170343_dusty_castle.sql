/*
  # Add destination-specific recommendations

  1. New Columns
    - `suggested_hotels` (jsonb) - Hotel recommendations with price ranges
    - `suggested_transport` (jsonb) - Transportation options and routes
    - `suggested_lunch_spots` (jsonb) - Lunch restaurant recommendations
    - `suggested_dinner_spots` (jsonb) - Dinner restaurant recommendations
    - `suggested_attractions` (jsonb) - Tourist attractions and activities
    - `local_tips` (jsonb) - Cultural tips and safety advice
    - `cost_estimates` (jsonb) - Cost breakdown for activities
    - `best_time_to_visit` (text) - Optimal visiting times
    - `safety_rating` (integer) - Safety score 1-10
    - `crowd_level` (text) - Expected crowd levels

  2. Enhanced Features
    - Detailed place-specific recommendations
    - Cost estimation for planning
    - Safety and cultural information
*/

-- Add new columns to destinations table
ALTER TABLE destinations ADD COLUMN IF NOT EXISTS suggested_hotels JSONB DEFAULT '[]'::jsonb;
ALTER TABLE destinations ADD COLUMN IF NOT EXISTS suggested_transport JSONB DEFAULT '[]'::jsonb;
ALTER TABLE destinations ADD COLUMN IF NOT EXISTS suggested_lunch_spots JSONB DEFAULT '[]'::jsonb;
ALTER TABLE destinations ADD COLUMN IF NOT EXISTS suggested_dinner_spots JSONB DEFAULT '[]'::jsonb;
ALTER TABLE destinations ADD COLUMN IF NOT EXISTS suggested_attractions JSONB DEFAULT '[]'::jsonb;
ALTER TABLE destinations ADD COLUMN IF NOT EXISTS local_tips JSONB DEFAULT '[]'::jsonb;
ALTER TABLE destinations ADD COLUMN IF NOT EXISTS cost_estimates JSONB DEFAULT '{}'::jsonb;
ALTER TABLE destinations ADD COLUMN IF NOT EXISTS best_time_to_visit TEXT;
ALTER TABLE destinations ADD COLUMN IF NOT EXISTS safety_rating INTEGER CHECK (safety_rating >= 1 AND safety_rating <= 10);
ALTER TABLE destinations ADD COLUMN IF NOT EXISTS crowd_level TEXT CHECK (crowd_level IN ('low', 'moderate', 'high', 'very_high'));

-- Add new columns to activities table for enhanced planning
ALTER TABLE activities ADD COLUMN IF NOT EXISTS crowd_level TEXT CHECK (crowd_level IN ('low', 'moderate', 'high', 'very_high'));
ALTER TABLE activities ADD COLUMN IF NOT EXISTS safety_rating INTEGER CHECK (safety_rating >= 1 AND safety_rating <= 10);
ALTER TABLE activities ADD COLUMN IF NOT EXISTS local_tips JSONB DEFAULT '[]'::jsonb;
ALTER TABLE activities ADD COLUMN IF NOT EXISTS best_time_to_visit TEXT;
ALTER TABLE activities ADD COLUMN IF NOT EXISTS dress_code TEXT;
ALTER TABLE activities ADD COLUMN IF NOT EXISTS advance_booking_required BOOLEAN DEFAULT false;

-- Create new table for destination autocomplete suggestions
CREATE TABLE IF NOT EXISTS destination_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  country TEXT NOT NULL,
  continent TEXT NOT NULL,
  description TEXT,
  popular_for JSONB DEFAULT '[]'::jsonb,
  best_time TEXT,
  coordinates JSONB,
  popularity_score INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE destination_suggestions ENABLE ROW LEVEL SECURITY;

-- Create policy for destination suggestions (public read)
CREATE POLICY "Destination suggestions are readable by all"
  ON destination_suggestions
  FOR SELECT
  TO authenticated
  USING (true);

-- Insert popular destinations
INSERT INTO destination_suggestions (name, country, continent, description, popular_for, best_time, coordinates, popularity_score) VALUES
('Paris', 'France', 'Europe', 'City of Light and Love', '["Art", "Culture", "Romance", "Food"]', 'Apr-Jun, Sep-Oct', '{"lat": 48.8566, "lng": 2.3522}', 100),
('Tokyo', 'Japan', 'Asia', 'Modern Metropolis', '["Technology", "Food", "Culture", "Shopping"]', 'Mar-May, Sep-Nov', '{"lat": 35.6762, "lng": 139.6503}', 95),
('New York', 'United States', 'North America', 'The Big Apple', '["Culture", "Broadway", "Food", "Museums"]', 'Apr-Jun, Sep-Nov', '{"lat": 40.7128, "lng": -74.0060}', 90),
('London', 'United Kingdom', 'Europe', 'Historic Capital', '["History", "Museums", "Theater", "Culture"]', 'May-Sep', '{"lat": 51.5074, "lng": -0.1278}', 85),
('Rome', 'Italy', 'Europe', 'Eternal City', '["History", "Architecture", "Food", "Art"]', 'Apr-Jun, Sep-Oct', '{"lat": 41.9028, "lng": 12.4964}', 80),
('Barcelona', 'Spain', 'Europe', 'Gaudi''s Masterpiece', '["Architecture", "Beaches", "Nightlife", "Food"]', 'May-Jun, Sep-Oct', '{"lat": 41.3851, "lng": 2.1734}', 75),
('Bangkok', 'Thailand', 'Asia', 'City of Angels', '["Street Food", "Temples", "Nightlife", "Shopping"]', 'Nov-Mar', '{"lat": 13.7563, "lng": 100.5018}', 70),
('Sydney', 'Australia', 'Oceania', 'Harbour City', '["Opera House", "Beaches", "Culture", "Nature"]', 'Sep-Nov, Mar-May', '{"lat": -33.8688, "lng": 151.2093}', 65),
('Dubai', 'United Arab Emirates', 'Asia', 'City of Gold', '["Luxury", "Shopping", "Architecture", "Desert"]', 'Nov-Mar', '{"lat": 25.2048, "lng": 55.2708}', 60),
('Singapore', 'Singapore', 'Asia', 'Garden City', '["Food", "Shopping", "Architecture", "Gardens"]', 'Feb-Apr', '{"lat": 1.3521, "lng": 103.8198}', 55);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_destination_suggestions_name ON destination_suggestions USING gin(name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_destination_suggestions_country ON destination_suggestions USING gin(country gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_destination_suggestions_popularity ON destination_suggestions (popularity_score DESC);

-- Add trigram extension for fuzzy search
CREATE EXTENSION IF NOT EXISTS pg_trgm;