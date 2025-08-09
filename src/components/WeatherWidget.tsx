import { useState, useEffect } from 'react'
import { Cloud, Sun, CloudRain, AlertTriangle, Thermometer } from 'lucide-react'
import { weatherService } from '../services/weatherService'
import { Destination } from '../types'

interface WeatherWidgetProps {
  destinations: Destination[]
}

export function WeatherWidget({ destinations }: WeatherWidgetProps) {
  const [weatherData, setWeatherData] = useState<Record<string, any>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadWeatherData()
  }, [destinations])

  const loadWeatherData = async () => {
    setLoading(true)
    const data: Record<string, any> = {}

    for (const destination of destinations) {
      try {
        const weather = await weatherService.getCurrentWeather(destination.name)
        const forecast = await weatherService.getWeatherForecast(destination.name, 5)
        
        data[destination.id] = {
          current: weather,
          forecast: forecast
        }
      } catch (error) {
        console.error(`Error loading weather for ${destination.name}:`, error)
      }
    }

    setWeatherData(data)
    setLoading(false)
  }

  const getWeatherIcon = (condition: string) => {
    switch (condition) {
      case 'sunny': return <Sun className="w-5 h-5 text-yellow-500" />
      case 'cloudy': return <Cloud className="w-5 h-5 text-gray-500" />
      case 'rainy': return <CloudRain className="w-5 h-5 text-blue-500" />
      case 'partly-cloudy': return <Cloud className="w-5 h-5 text-gray-400" />
      default: return <Sun className="w-5 h-5 text-yellow-500" />
    }
  }

  const getTemperatureColor = (temp: number) => {
    if (temp < 10) return 'text-blue-600'
    if (temp < 20) return 'text-green-600'
    if (temp < 30) return 'text-yellow-600'
    return 'text-red-600'
  }

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center space-x-3 mb-4">
          <Cloud className="w-6 h-6 text-blue-600" />
          <h2 className="text-xl font-semibold text-gray-900">Weather Forecast</h2>
        </div>
        <div className="animate-pulse space-y-4">
          {destinations.map(dest => (
            <div key={dest.id} className="h-20 bg-gray-200 rounded-lg"></div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex items-center space-x-3 mb-6">
        <Cloud className="w-6 h-6 text-blue-600" />
        <h2 className="text-xl font-semibold text-gray-900">Weather Forecast</h2>
      </div>

      <div className="space-y-6">
        {destinations.map(destination => {
          const destWeather = weatherData[destination.id]
          if (!destWeather) return null

          const { current, forecast } = destWeather
          const hasWeatherAlert = current && weatherService.shouldShowWeatherAlert(current.condition, current.precipitation)

          return (
            <div key={destination.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">{destination.name}</h3>
                {hasWeatherAlert && (
                  <div className="flex items-center space-x-1 text-amber-600">
                    <AlertTriangle className="w-4 h-4" />
                    <span className="text-sm">Weather Alert</span>
                  </div>
                )}
              </div>

              {current && (
                <div className="flex items-center justify-between mb-4 p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    {getWeatherIcon(current.condition)}
                    <div>
                      <p className="font-medium text-gray-900 capitalize">{current.condition}</p>
                      <p className="text-sm text-gray-600">Currently</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-2xl font-bold ${getTemperatureColor(current.temperature)}`}>
                      {current.temperature}°C
                    </p>
                    <p className="text-sm text-gray-600">{current.humidity}% humidity</p>
                  </div>
                </div>
              )}

              {forecast && forecast.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">5-Day Forecast</h4>
                  <div className="grid grid-cols-5 gap-2">
                    {forecast.map(day => (
                      <div key={day.date} className="text-center p-2 bg-gray-50 rounded">
                        <p className="text-xs text-gray-600 mb-1">
                          {new Date(day.date).toLocaleDateString('en', { weekday: 'short' })}
                        </p>
                        <div className="flex justify-center mb-1">
                          <span className="text-lg">{weatherService.getWeatherIcon(day.condition)}</span>
                        </div>
                        <p className="text-xs font-medium text-gray-900">
                          {day.high}°/{day.low}°
                        </p>
                        {day.precipitation > 50 && (
                          <p className="text-xs text-blue-600">{day.precipitation}%</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {hasWeatherAlert && (
                <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <div className="flex items-start space-x-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-amber-800">Weather Advisory</p>
                      <p className="text-sm text-amber-700">
                        {current.condition === 'rainy' && current.precipitation > 70 && 
                          'Heavy rain expected. Consider indoor activities or bring rain gear.'}
                        {current.condition === 'stormy' && 
                          'Stormy weather forecasted. Plan for potential delays and indoor alternatives.'}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      <div className="mt-6 pt-4 border-t border-gray-200">
        <button
          onClick={loadWeatherData}
          className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
        >
          Refresh Weather Data
        </button>
      </div>
    </div>
  )
}