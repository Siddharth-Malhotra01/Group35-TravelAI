interface WeatherData {
  temperature: number
  condition: string
  humidity: number
  windSpeed: number
  precipitation: number
  icon: string
}

interface WeatherForecast {
  date: string
  high: number
  low: number
  condition: string
  precipitation: number
  icon: string
}

export class WeatherService {
  private apiKey = import.meta.env.VITE_WEATHER_API_KEY

  async getCurrentWeather(city: string, country?: string): Promise<WeatherData | null> {
    try {
      // Mock weather data for demo purposes
      // In production, integrate with OpenWeatherMap, WeatherAPI, or similar
      const mockWeather: WeatherData = {
        temperature: Math.floor(Math.random() * 30) + 10,
        condition: ['sunny', 'cloudy', 'rainy', 'partly-cloudy'][Math.floor(Math.random() * 4)],
        humidity: Math.floor(Math.random() * 40) + 40,
        windSpeed: Math.floor(Math.random() * 20) + 5,
        precipitation: Math.floor(Math.random() * 100),
        icon: '☀️'
      }

      return mockWeather
    } catch (error) {
      console.error('Error fetching weather data:', error)
      return null
    }
  }

  async getWeatherForecast(city: string, days: number = 7): Promise<WeatherForecast[]> {
    try {
      // Mock forecast data
      const forecast: WeatherForecast[] = []
      const today = new Date()

      for (let i = 0; i < days; i++) {
        const date = new Date(today.getTime() + (i * 24 * 60 * 60 * 1000))
        forecast.push({
          date: date.toISOString().split('T')[0],
          high: Math.floor(Math.random() * 15) + 20,
          low: Math.floor(Math.random() * 10) + 10,
          condition: ['sunny', 'cloudy', 'rainy', 'partly-cloudy'][Math.floor(Math.random() * 4)],
          precipitation: Math.floor(Math.random() * 100),
          icon: ['☀️', '☁️', '🌧️', '⛅'][Math.floor(Math.random() * 4)]
        })
      }

      return forecast
    } catch (error) {
      console.error('Error fetching weather forecast:', error)
      return []
    }
  }

  getWeatherIcon(condition: string): string {
    const icons: Record<string, string> = {
      'sunny': '☀️',
      'cloudy': '☁️',
      'rainy': '🌧️',
      'partly-cloudy': '⛅',
      'stormy': '⛈️',
      'snowy': '❄️',
      'foggy': '🌫️'
    }
    return icons[condition] || '☀️'
  }

  shouldShowWeatherAlert(condition: string, precipitation: number): boolean {
    return condition === 'rainy' && precipitation > 70 ||
           condition === 'stormy' ||
           condition === 'snowy'
  }
}

export const weatherService = new WeatherService()