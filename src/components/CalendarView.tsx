import { useState, useMemo } from 'react'
import { Calendar, ChevronLeft, ChevronRight, Clock, MapPin } from 'lucide-react'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths } from 'date-fns'
import { Activity, Destination } from '../types'

interface CalendarViewProps {
  destinations: Destination[]
  activities: Record<string, Activity[]>
}

export function CalendarView({ destinations, activities }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date())

  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd })

  // Get all activities for the current month
  const monthActivities = useMemo(() => {
    const activitiesMap: Record<string, Activity[]> = {}
    
    Object.values(activities).flat().forEach(activity => {
      const activityDate = activity.activity_date
      if (!activitiesMap[activityDate]) {
        activitiesMap[activityDate] = []
      }
      activitiesMap[activityDate].push(activity)
    })

    return activitiesMap
  }, [activities])

  const getDestinationForActivity = (activity: Activity): Destination | undefined => {
    return destinations.find(dest => dest.id === activity.destination_id)
  }

  const getActivityTypeColor = (type: string): string => {
    const colors: Record<string, string> = {
      sightseeing: 'bg-blue-100 text-blue-800',
      dining: 'bg-orange-100 text-orange-800',
      culture: 'bg-purple-100 text-purple-800',
      outdoor: 'bg-green-100 text-green-800',
      shopping: 'bg-pink-100 text-pink-800',
      transport: 'bg-gray-100 text-gray-800'
    }
    return colors[type] || 'bg-gray-100 text-gray-800'
  }

  const previousMonth = () => setCurrentDate(subMonths(currentDate, 1))
  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1))

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <Calendar className="w-6 h-6 text-blue-600" />
          <h2 className="text-xl font-semibold text-gray-900">Calendar View</h2>
        </div>
        
        <div className="flex items-center space-x-4">
          <button
            onClick={previousMonth}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          
          <h3 className="text-lg font-medium text-gray-900 min-w-48 text-center">
            {format(currentDate, 'MMMM yyyy')}
          </h3>
          
          <button
            onClick={nextMonth}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1 mb-4">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="p-3 text-center text-sm font-medium text-gray-500 border-b">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {daysInMonth.map(day => {
          const dayString = format(day, 'yyyy-MM-dd')
          const dayActivities = monthActivities[dayString] || []
          const isCurrentMonth = isSameMonth(day, currentDate)
          const isToday = isSameDay(day, new Date())

          return (
            <div
              key={dayString}
              className={`min-h-32 p-2 border border-gray-200 ${
                isCurrentMonth ? 'bg-white' : 'bg-gray-50'
              } ${isToday ? 'ring-2 ring-blue-500' : ''}`}
            >
              <div className={`text-sm font-medium mb-2 ${
                isCurrentMonth ? 'text-gray-900' : 'text-gray-400'
              } ${isToday ? 'text-blue-600' : ''}`}>
                {format(day, 'd')}
              </div>

              <div className="space-y-1">
                {dayActivities.slice(0, 3).map(activity => {
                  const destination = getDestinationForActivity(activity)
                  return (
                    <div
                      key={activity.id}
                      className={`text-xs p-1 rounded truncate ${getActivityTypeColor(activity.activity_type)}`}
                      title={`${activity.title} - ${destination?.name || 'Unknown location'}`}
                    >
                      <div className="flex items-center space-x-1">
                        {activity.start_time && (
                          <Clock className="w-3 h-3 flex-shrink-0" />
                        )}
                        <span className="truncate">{activity.title}</span>
                      </div>
                    </div>
                  )
                })}
                
                {dayActivities.length > 3 && (
                  <div className="text-xs text-gray-500 text-center">
                    +{dayActivities.length - 3} more
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Legend */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <h4 className="text-sm font-medium text-gray-900 mb-3">Activity Types</h4>
        <div className="flex flex-wrap gap-2">
          {[
            { type: 'sightseeing', label: 'Sightseeing', icon: '📸' },
            { type: 'dining', label: 'Dining', icon: '🍽️' },
            { type: 'culture', label: 'Culture', icon: '🎭' },
            { type: 'outdoor', label: 'Outdoor', icon: '🌳' },
            { type: 'shopping', label: 'Shopping', icon: '🛍️' },
            { type: 'transport', label: 'Transport', icon: '🚗' }
          ].map(({ type, label, icon }) => (
            <div
              key={type}
              className={`flex items-center space-x-1 px-2 py-1 rounded text-xs ${getActivityTypeColor(type)}`}
            >
              <span>{icon}</span>
              <span>{label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}