'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { Flame, Trophy, ChevronRight, CheckCircle2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { authFetch } from '@/lib/auth-fetch'

export function ChallengeWidget() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchChallengeStatus() {
      try {
        const res = await authFetch('/api/challenges/widget')
        if (res.ok) {
          const result = await res.json()
          setData(result)
        }
      } catch (error) {
        console.error('Failed to fetch challenge widget data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchChallengeStatus()
  }, [])

  if (loading) {
    return (
      <Card className="animate-pulse bg-slate-100 dark:bg-slate-900 border-none h-32" />
    )
  }

  // If not participating and no open challenges to promote
  if (!data?.activeParticipation && !data?.promotedChallenge) {
    return null
  }

  if (data?.activeParticipation) {
    const { challenge, progress } = data.activeParticipation
    const { currentDay, totalDays, todayCompleted } = progress
    const percentage = Math.round((currentDay / totalDays) * 100)

    return (
      <Card className="overflow-hidden border-amber-200 dark:border-amber-900/50 relative">
        <div className="absolute top-0 left-0 w-full h-1 bg-amber-500" />
        <CardContent className="p-4 sm:p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="bg-amber-100 dark:bg-amber-900/30 p-1.5 rounded-md text-amber-600 dark:text-amber-500">
                <Flame className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-sm leading-tight text-slate-900 dark:text-slate-100">
                  Thử thách ngày {currentDay}/{totalDays}
                </h3>
                <p className="text-xs text-slate-500 truncate max-w-[200px]">{challenge.name}</p>
              </div>
            </div>
            <Link href={`/challenge/${challenge.slug}`}>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200">
                <ChevronRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-slate-600 dark:text-slate-400">
              <span className="flex items-center gap-1">
                {todayCompleted ? (
                  <span className="text-green-600 dark:text-green-500 flex items-center gap-1 font-medium">
                    <CheckCircle2 className="w-3 h-3" /> Xong hôm nay
                  </span>
                ) : (
                  <span>Chưa xong hôm nay</span>
                )}
              </span>
              <span>{percentage}%</span>
            </div>
            <Progress value={percentage} className="h-2 bg-slate-100 dark:bg-slate-800 [&>div]:bg-amber-500" />
          </div>
        </CardContent>
      </Card>
    )
  }

  // Promotion mode for an open challenge
  if (data?.promotedChallenge) {
    const { challenge } = data.promotedChallenge
    return (
      <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-slate-900 dark:to-indigo-950/30 border-blue-100 dark:border-blue-900">
        <CardContent className="p-4 sm:p-5 flex items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="bg-blue-100 dark:bg-blue-900/50 p-2 rounded-full text-blue-600 dark:text-blue-400 shrink-0">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 mb-1">{challenge.name}</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-1">{challenge.description}</p>
            </div>
          </div>
          <Link href={`/challenge/${challenge.slug}`} className="shrink-0">
            <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm">
              Tham gia
            </Button>
          </Link>
        </CardContent>
      </Card>
    )
  }

  return null
}
