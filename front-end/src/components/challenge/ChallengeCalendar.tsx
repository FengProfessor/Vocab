'use client'

import React, { useMemo } from 'react'
import { Flame } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface DailyLog {
  log_date: string // YYYY-MM-DD
  criteria_met: boolean
  srs_reviews: number
  quizzes_done: number
}

interface ChallengeCalendarProps {
  dailyLogs: DailyLog[]
  startDate: string // YYYY-MM-DD
  endDate: string // YYYY-MM-DD
  className?: string
}

export function ChallengeCalendar({ dailyLogs, startDate, endDate, className = '' }: ChallengeCalendarProps) {
  // Generate a map for quick lookup
  const logsMap = useMemo(() => {
    const map: Record<string, DailyLog> = {}
    dailyLogs.forEach(log => {
      map[log.log_date] = log
    })
    return map
  }, [dailyLogs])

  // Calculate streak
  const currentStreak = useMemo(() => {
    let streak = 0
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    // Simplistic streak logic: count backwards from today or yesterday
    const sortedDates = Object.keys(logsMap).sort((a, b) => new Date(b).getTime() - new Date(a).getTime())
    
    for (const dateStr of sortedDates) {
      if (logsMap[dateStr].criteria_met) {
        streak++
      } else {
        // If we hit a day not met (and it's not today), break
        const d = new Date(dateStr)
        if (d < today) break
      }
    }
    return streak
  }, [logsMap])

  // Generate calendar grid
  const calendarGrid = useMemo(() => {
    const start = new Date(startDate)
    start.setHours(0, 0, 0, 0)
    
    const end = new Date(endDate)
    end.setHours(0, 0, 0, 0)
    
    // Find first Monday before or equal to start date
    const gridStart = new Date(start)
    const dayOfWeek = gridStart.getDay() // 0 is Sunday, 1 is Monday
    const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1
    gridStart.setDate(gridStart.getDate() - diff)
    
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const grid = []
    let current = new Date(gridStart)
    
    while (current <= end || grid.length % 7 !== 0) {
      const dateStr = current.toISOString().split('T')[0]
      const isBeforeStart = current < start
      const isAfterEnd = current > end
      const isFuture = current > today && !isAfterEnd
      const log = logsMap[dateStr]
      
      grid.push({
        date: new Date(current),
        dateStr,
        isBeforeStart,
        isAfterEnd,
        isFuture,
        log
      })
      
      current.setDate(current.getDate() + 1)
    }
    
    return grid
  }, [startDate, endDate, logsMap])

  // Group by weeks
  const weeks = []
  for (let i = 0; i < calendarGrid.length; i += 7) {
    weeks.push(calendarGrid.slice(i, i + 7))
  }

  const getDayColor = (day: any) => {
    if (day.isBeforeStart || day.isAfterEnd) return 'bg-transparent'
    if (day.isFuture) return 'bg-slate-100 dark:bg-slate-800'
    
    if (!day.log) {
      // Past day with no log = missed
      return 'bg-red-100 dark:bg-red-900/50'
    }
    
    return day.log.criteria_met 
      ? 'bg-green-500 hover:bg-green-600 cursor-pointer' 
      : 'bg-red-400 hover:bg-red-500 cursor-pointer'
  }

  const formatMonth = (date: Date) => {
    return new Intl.DateTimeFormat('vi-VN', { month: 'short' }).format(date)
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Hành trình của bạn</CardTitle>
          <div className="flex items-center gap-1.5 text-amber-500 bg-amber-50 dark:bg-amber-500/10 px-3 py-1 rounded-full">
            <Flame className="w-4 h-4 fill-amber-500" />
            <span className="font-bold text-sm">{currentStreak} chuỗi ngày</span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex overflow-x-auto pb-4">
          <div className="flex gap-1 min-w-max">
            {/* Day labels */}
            <div className="flex flex-col gap-1 pr-2 text-xs text-slate-400 font-medium justify-between py-1">
              <span>T2</span>
              <span>T4</span>
              <span>T6</span>
              <span>CN</span>
            </div>
            
            {/* Grid */}
            <div className="flex flex-col gap-1">
              {/* Optional: Month labels row - simplified for now */}
              
              <div className="flex gap-1">
                {weeks.map((week, weekIdx) => (
                  <div key={`week-${weekIdx}`} className="flex flex-col gap-1">
                    {week.map((day, dayIdx) => (
                      <div 
                        key={day.dateStr} 
                        className={`w-4 h-4 rounded-sm ${getDayColor(day)} transition-colors`}
                        title={`${day.dateStr}${day.log ? ` - Ôn tập: ${day.log.srs_reviews}, Quizzes: ${day.log.quizzes_done}` : ''}`}
                      />
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex items-center justify-end gap-3 mt-2 text-xs text-slate-500">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-sm bg-slate-100 dark:bg-slate-800" />
            <span>Chưa tới</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-sm bg-red-400" />
            <span>Chưa đạt</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-sm bg-green-500" />
            <span>Hoàn thành</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
