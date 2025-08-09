/*
  # Enhanced Travel Itinerary App Schema

  1. New Tables
    - `user_preferences` - Store user travel preferences and behavior
    - `trip_themes` - Predefined trip themes (romantic, family, adventure, etc.)
    - `trip_collaborators` - Enhanced group collaboration with roles
    - `expenses` - Trip expense tracking with categories
    - `favorites` - User favorite destinations and activities
    - `trip_templates` - Reusable trip templates
    - `activity_reviews` - User reviews and ratings for activities
    - `weather_alerts` - Weather-based notifications
    - `accessibility_requirements` - Accessibility needs tracking

  2. Enhanced Tables
    - Enhanced `trips` table with theme, pace, accessibility options
    - Enhanced `activities` table with booking status, reviews, weather dependency
    - Enhanced `destinations` table with weather info, accessibility rating

  3. Security
    - Enable RLS on all tables
    - Add policies for user data access and collaboration
*/

-- User preferences and behavior tracking
CREATE TABLE IF NOT EXISTS user_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  preferred_pace text DEFAULT 'balanced' CHECK (preferred_pace IN ('slow', 'balanced', 'fast')),
  preferred_budget text DEFAULT 'mid-range' CHECK (preferred_budget IN ('budget', 'mid-range', 'luxury')),
  travel_style jsonb DEFAULT '{}',
  accessibility_needs jsonb DEFAULT '{}',
  language_preference text DEFAULT 'en',
  dietary_restrictions jsonb DEFAULT '[]',
  interests jsonb DEFAULT '[]',
  past_destinations jsonb DEFAULT '[]',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Trip themes
CREATE TABLE IF NOT EXISTS trip_themes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  description text,
  icon text,
  color text,
  suggested_activities jsonb DEFAULT '[]',
  created_at timestamptz DEFAULT now()
);

-- Enhanced trips table
ALTER TABLE trips ADD COLUMN IF NOT EXISTS theme_id uuid REFERENCES trip_themes(id);
ALTER TABLE trips ADD COLUMN IF NOT EXISTS pace text DEFAULT 'balanced' CHECK (pace IN ('slow', 'balanced', 'fast'));
ALTER TABLE trips ADD COLUMN IF NOT EXISTS group_size integer DEFAULT 1;
ALTER TABLE trips ADD COLUMN IF NOT EXISTS accessibility_requirements jsonb DEFAULT '{}';
ALTER TABLE trips ADD COLUMN IF NOT EXISTS weather_preferences jsonb DEFAULT '{}';
ALTER TABLE trips ADD COLUMN IF NOT EXISTS is_template boolean DEFAULT false;
ALTER TABLE trips ADD COLUMN IF NOT EXISTS template_name text;
ALTER TABLE trips ADD COLUMN IF NOT EXISTS total_budget numeric(10,2);
ALTER TABLE trips ADD COLUMN IF NOT EXISTS currency text DEFAULT 'USD';

-- Expenses tracking
CREATE TABLE IF NOT EXISTS expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id uuid REFERENCES trips(id) ON DELETE CASCADE,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  amount numeric(10,2) NOT NULL,
  currency text DEFAULT 'USD',
  category text DEFAULT 'other' CHECK (category IN ('accommodation', 'transport', 'food', 'activities', 'shopping', 'other')),
  description text,
  incurred_on date DEFAULT CURRENT_DATE,
  receipt_url text,
  is_shared boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- User favorites
CREATE TABLE IF NOT EXISTS favorites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  item_type text NOT NULL CHECK (item_type IN ('destination', 'activity', 'restaurant', 'accommodation')),
  item_name text NOT NULL,
  item_data jsonb DEFAULT '{}',
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Trip templates
CREATE TABLE IF NOT EXISTS trip_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  duration_days integer,
  theme_id uuid REFERENCES trip_themes(id),
  template_data jsonb NOT NULL,
  is_public boolean DEFAULT false,
  usage_count integer DEFAULT 0,
  rating numeric(2,1) DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Activity reviews and ratings
CREATE TABLE IF NOT EXISTS activity_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id uuid REFERENCES activities(id) ON DELETE CASCADE,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  rating integer CHECK (rating >= 1 AND rating <= 5),
  review_text text,
  photos jsonb DEFAULT '[]',
  helpful_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Weather alerts and notifications
CREATE TABLE IF NOT EXISTS weather_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id uuid REFERENCES trips(id) ON DELETE CASCADE,
  destination_id uuid REFERENCES destinations(id) ON DELETE CASCADE,
  alert_type text NOT NULL CHECK (alert_type IN ('rain', 'storm', 'extreme_heat', 'extreme_cold', 'snow')),
  alert_date date NOT NULL,
  severity text DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high')),
  message text,
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Enhanced activities table
ALTER TABLE activities ADD COLUMN IF NOT EXISTS booking_status text DEFAULT 'planned' CHECK (booking_status IN ('planned', 'booked', 'confirmed', 'cancelled'));
ALTER TABLE activities ADD COLUMN IF NOT EXISTS booking_reference text;
ALTER TABLE activities ADD COLUMN IF NOT EXISTS weather_dependent boolean DEFAULT false;
ALTER TABLE activities ADD COLUMN IF NOT EXISTS accessibility_rating integer CHECK (accessibility_rating >= 1 AND accessibility_rating <= 5);
ALTER TABLE activities ADD COLUMN IF NOT EXISTS difficulty_level text DEFAULT 'easy' CHECK (difficulty_level IN ('easy', 'moderate', 'challenging'));
ALTER TABLE activities ADD COLUMN IF NOT EXISTS duration_minutes integer;
ALTER TABLE activities ADD COLUMN IF NOT EXISTS tags jsonb DEFAULT '[]';

-- Enhanced destinations table
ALTER TABLE destinations ADD COLUMN IF NOT EXISTS weather_info jsonb DEFAULT '{}';
ALTER TABLE destinations ADD COLUMN IF NOT EXISTS accessibility_rating integer CHECK (accessibility_rating >= 1 AND accessibility_rating <= 5);
ALTER TABLE destinations ADD COLUMN IF NOT EXISTS transportation_options jsonb DEFAULT '[]';
ALTER TABLE destinations ADD COLUMN IF NOT EXISTS local_currency text;
ALTER TABLE destinations ADD COLUMN IF NOT EXISTS timezone text;

-- Insert default trip themes
INSERT INTO trip_themes (name, description, icon, color, suggested_activities) VALUES
('Romantic', 'Perfect for couples seeking intimate experiences', '💕', '#ec4899', '["fine_dining", "sunset_views", "couples_spa", "wine_tasting"]'),
('Family', 'Fun activities for all ages', '👨‍👩‍👧‍👦', '#10b981', '["theme_parks", "museums", "beaches", "family_restaurants"]'),
('Adventure', 'Thrilling outdoor experiences', '🏔️', '#f97316', '["hiking", "water_sports", "extreme_sports", "camping"]'),
('Cultural', 'Immerse in local culture and history', '🏛️', '#8b5cf6', '["museums", "historical_sites", "local_tours", "cultural_shows"]'),
('Relaxation', 'Unwind and rejuvenate', '🧘‍♀️', '#06b6d4', '["spa", "beaches", "yoga", "meditation"]'),
('Business', 'Efficient travel for work purposes', '💼', '#6b7280', '["business_centers", "networking_events", "efficient_transport"]'),
('Solo', 'Perfect for independent travelers', '🎒', '#f59e0b', '["solo_friendly", "safe_areas", "social_activities", "flexible_schedule"]'),
('Luxury', 'Premium experiences and accommodations', '✨', '#d946ef', '["luxury_hotels", "fine_dining", "private_tours", "premium_transport"]')
ON CONFLICT (name) DO NOTHING;

-- Enable RLS
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE trip_themes ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE trip_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE weather_alerts ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can manage own preferences" ON user_preferences
  FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "Trip themes are readable by all" ON trip_themes
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can manage expenses for accessible trips" ON expenses
  FOR ALL TO authenticated 
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

CREATE POLICY "Users can manage own favorites" ON favorites
  FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can view public templates and manage own templates" ON trip_templates
  FOR SELECT TO authenticated USING (is_public = true OR creator_id = auth.uid());

CREATE POLICY "Users can create own templates" ON trip_templates
  FOR INSERT TO authenticated WITH CHECK (creator_id = auth.uid());

CREATE POLICY "Users can update own templates" ON trip_templates
  FOR UPDATE TO authenticated USING (creator_id = auth.uid()) WITH CHECK (creator_id = auth.uid());

CREATE POLICY "Users can manage reviews for accessible activities" ON activity_reviews
  FOR ALL TO authenticated 
  USING (
    activity_id IN (
      SELECT a.id FROM activities a
      JOIN destinations d ON a.destination_id = d.id
      JOIN trips t ON d.trip_id = t.id
      WHERE t.creator_id = auth.uid() OR t.id IN (
        SELECT trip_id FROM trip_collaborators WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can view weather alerts for accessible trips" ON weather_alerts
  FOR SELECT TO authenticated 
  USING (
    trip_id IN (
      SELECT id FROM trips WHERE creator_id = auth.uid()
      UNION
      SELECT trip_id FROM trip_collaborators WHERE user_id = auth.uid()
    )
  );

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_preferences_user ON user_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_expenses_trip ON expenses(trip_id);
CREATE INDEX IF NOT EXISTS idx_expenses_user ON expenses(user_id);
CREATE INDEX IF NOT EXISTS idx_favorites_user ON favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_trip_templates_creator ON trip_templates(creator_id);
CREATE INDEX IF NOT EXISTS idx_trip_templates_public ON trip_templates(is_public) WHERE is_public = true;
CREATE INDEX IF NOT EXISTS idx_activity_reviews_activity ON activity_reviews(activity_id);
CREATE INDEX IF NOT EXISTS idx_weather_alerts_trip ON weather_alerts(trip_id);
CREATE INDEX IF NOT EXISTS idx_weather_alerts_date ON weather_alerts(alert_date);