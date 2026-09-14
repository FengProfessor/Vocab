'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckCircle2, Circle, Target, BookOpen, Headphones, PenTool } from 'lucide-react'
import { DailyCriteria } from '@/lib/challenge' // Assuming imported here or adapt as needed

interface Metrics {
  srs_reviews: number
  quizzes_done: number
  reading_sessions: number
  listening_sessions: number
}

interface ChallengeDailyProgressProps {
  criteria: DailyCriteria
  metrics: Metrics
  className?: string
}

export function ChallengeDailyProgress({ criteria, metrics, className = '' }: ChallengeDailyProgressProps) {
  // Check completion logic
  const isSrsMet = metrics.srs_reviews >= (criteria.min_srs_reviews || 0)
  const isQuizzesMet = metrics.quizzes_done >= (criteria.min_quizzes || 0)
  const isReadingMet = metrics.reading_sessions >= (criteria.min_reading_sessions || 0)
  const isListeningMet = metrics.listening_sessions >= (criteria.min_listening_sessions || 0)

  // Overall status
  const isAllMet = isSrsMet && isQuizzesMet && isReadingMet && isListeningMet

  const ProgressItem = ({ 
    icon: Icon, 
    label, 
    current, 
    target, 
    isMet 
  }: { 
    icon: any, 
    label: string, 
    current: number, 
    target: number, 
    isMet: boolean 
  }) => {
    if (target <= 0) return null // Hide if no requirement

    const percentage = Math.min(100, Math.round((current / target) * 100))
    
    return (
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`p-1.5 rounded-md ${isMet ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-500' : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'}`}>
              <Icon className="w-4 h-4" />
            </div>
            <span className="text-sm font-medium">{label}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-500">
              {current} / {target}
            </span>
            {isMet ? (
              <CheckCircle2 className="w-5 h-5 text-green-500" />
            ) : (
              <Circle className="w-5 h-5 text-slate-300 dark:text-slate-700" />
            )}
          </div>
        </div>
        <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
          <div 
            className={`h-full rounded-full transition-all ${isMet ? 'bg-green-500' : 'bg-amber-400'}`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    )
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Target className="w-5 h-5 text-blue-500" />
            Nhiệm vụ hôm nay
          </CardTitle>
          <div className={`px-2.5 py-1 text-xs font-medium rounded-full ${isAllMet ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400'}`}>
            {isAllMet ? 'Đã hoàn thành' : 'Đang thực hiện'}
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        <ProgressItem 
          icon={PenTool} 
          label="Ôn tập từ vựng" 
          current={metrics.srs_reviews} 
          target={criteria.min_srs_reviews || 0} 
          isMet={isSrsMet} 
        />
        <ProgressItem 
          icon={BookOpen} 
          label="Làm bài tập / Quiz" 
          current={metrics.quizzes_done} 
          target={criteria.min_quizzes || 0} 
          isMet={isQuizzesMet} 
        />
        <ProgressItem 
          icon={BookOpen} 
          label="Bài học Reading" 
          current={metrics.reading_sessions} 
          target={criteria.min_reading_sessions || 0} 
          isMet={isReadingMet} 
        />
        <ProgressItem 
          icon={Headphones} 
          label="Bài học Listening" 
          current={metrics.listening_sessions} 
          target={criteria.min_listening_sessions || 0} 
          isMet={isListeningMet} 
        />
      </CardContent>
    </Card>
  )
}
