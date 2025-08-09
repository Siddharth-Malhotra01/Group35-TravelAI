/*
  # Create Travel Itinerary App Schema

  1. New Tables
    - `profiles` - User profiles with travel preferences
    - `trips` - Trip information with dates and metadata
    - `destinations` - Destinations within trips with order
    - `activities` - Activities within destinations with timing
    - `trip_collaborators` - Shared access to trips for group planning
    - `ai_suggestions` - Cache AI-generated suggestions

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to access their own data
    - Add policies for trip collaborators to access shared trips
*/

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  full_name text,
  avatar_url text,
  travel_preferences jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create trips table
CREATE TABLE IF NOT EXISTS trips (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  description text,
  start_date date NOT NULL,
  end_date date NOT NULL,
  budget_range text DEFAULT 'mid-range',
  travel_style text DEFAULT 'balanced',
  status text DEFAULT 'planning',
  cover_image text,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create destinations table
CREATE TABLE IF NOT EXISTS destinations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id uuid REFERENCES trips(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  city text,
  country text,
  arrival_date date NOT NULL,
  departure_date date NOT NULL,
  order_index integer NOT NULL DEFAULT 0,
  coordinates jsonb,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create activities table
CREATE TABLE IF NOT EXISTS activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  destination_id uuid REFERENCES destinations(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  description text,
  activity_date date NOT NULL,
  start_time time,
  end_time time,
  location text,
  activity_type text DEFAULT 'sightseeing',
  price_estimate decimal(10,2),
  booking_status text DEFAULT 'planned',
  order_index integer NOT NULL DEFAULT 0,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create trip collaborators table
CREATE TABLE IF NOT EXISTS trip_collaborators (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id uuid REFERENCES trips(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  role text DEFAULT 'viewer',
  invited_by uuid REFERENCES profiles(id),
  joined_at timestamptz DEFAULT now(),
  UNIQUE(trip_id, user_id)
);

-- Create AI suggestions table
CREATE TABLE IF NOT EXISTS ai_suggestions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id uuid REFERENCES trips(id) ON DELETE CASCADE NOT NULL,
  suggestion_type text NOT NULL,
  content jsonb NOT NULL,
  used boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE destinations ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE trip_collaborators ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_suggestions ENABLE ROW LEVEL SECURITY;

-- Policies for profiles
CREATE POLICY "Users can view and update own profile"
  ON profiles FOR ALL
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Policies for trips
CREATE POLICY "Users can view own trips and collaborative trips"
  ON trips FOR SELECT
  TO authenticated
  USING (
    creator_id = auth.uid() 
    OR id IN (
      SELECT trip_id FROM trip_collaborators 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own trips"
  ON trips FOR INSERT
  TO authenticated
  WITH CHECK (creator_id = auth.uid());

CREATE POLICY "Users can update own trips and collaborative trips"
  ON trips FOR UPDATE
  TO authenticated
  USING (
    creator_id = auth.uid() 
    OR id IN (
      SELECT trip_id FROM trip_collaborators 
      WHERE user_id = auth.uid() AND role IN ('editor', 'admin')
    )
  );

CREATE POLICY "Users can delete own trips"
  ON trips FOR DELETE
  TO authenticated
  USING (creator_id = auth.uid());

-- Policies for destinations
CREATE POLICY "Users can manage destinations in accessible trips"
  ON destinations FOR ALL
  TO authenticated
  USING (
    trip_id IN (
      SELECT id FROM trips WHERE creator_id = auth.uid()
      UNION
      SELECT trip_id FROM trip_collaborators WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    trip_id IN (
      SELECT id FROM trips WHERE creator_id = auth.uid()
      UNION
      SELECT trip_id FROM trip_collaborators WHERE user_id = auth.uid() AND role IN ('editor', 'admin')
    )
  );

-- Policies for activities
CREATE POLICY "Users can manage activities in accessible destinations"
  ON activities FOR ALL
  TO authenticated
  USING (
    destination_id IN (
      SELECT d.id FROM destinations d
      JOIN trips t ON d.trip_id = t.id
      WHERE t.creator_id = auth.uid()
      UNION
      SELECT d.id FROM destinations d
      JOIN trip_collaborators tc ON d.trip_id = tc.trip_id
      WHERE tc.user_id = auth.uid()
    )
  )
  WITH CHECK (
    destination_id IN (
      SELECT d.id FROM destinations d
      JOIN trips t ON d.trip_id = t.id
      WHERE t.creator_id = auth.uid()
      UNION
      SELECT d.id FROM destinations d
      JOIN trip_collaborators tc ON d.trip_id = tc.trip_id
      WHERE tc.user_id = auth.uid() AND tc.role IN ('editor', 'admin')
    )
  );

-- Policies for trip collaborators
CREATE POLICY "Users can view collaborators of accessible trips"
  ON trip_collaborators FOR SELECT
  TO authenticated
  USING (
    trip_id IN (
      SELECT id FROM trips WHERE creator_id = auth.uid()
      UNION
      SELECT trip_id FROM trip_collaborators WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Trip creators can manage collaborators"
  ON trip_collaborators FOR ALL
  TO authenticated
  USING (
    trip_id IN (SELECT id FROM trips WHERE creator_id = auth.uid())
  )
  WITH CHECK (
    trip_id IN (SELECT id FROM trips WHERE creator_id = auth.uid())
  );

-- Policies for AI suggestions
CREATE POLICY "Users can manage AI suggestions for accessible trips"
  ON ai_suggestions FOR ALL
  TO authenticated
  USING (
    trip_id IN (
      SELECT id FROM trips WHERE creator_id = auth.uid()
      UNION
      SELECT trip_id FROM trip_collaborators WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    trip_id IN (
      SELECT id FROM trips WHERE creator_id = auth.uid()
      UNION
      SELECT trip_id FROM trip_collaborators WHERE user_id = auth.uid() AND role IN ('editor', 'admin')
    )
  );

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_trips_creator ON trips(creator_id);
CREATE INDEX IF NOT EXISTS idx_destinations_trip ON destinations(trip_id);
CREATE INDEX IF NOT EXISTS idx_activities_destination ON activities(destination_id);
CREATE INDEX IF NOT EXISTS idx_trip_collaborators_trip ON trip_collaborators(trip_id);
CREATE INDEX IF NOT EXISTS idx_trip_collaborators_user ON trip_collaborators(user_id);

-- Function to handle user profile creation
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();