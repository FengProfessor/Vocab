'use client'

import React, { useEffect, useState } from 'react'
import { Trophy, Target, Award, Sparkles } from 'lucide-react'
import { ChallengeCard } from '@/components/challenge/ChallengeCard'
import { authFetch } from '@/lib/auth-fetch'
import { Challenge } from '@/lib/challenge'

export default function ChallengePage() {
  const [challenges, setChallenges] = useState<Challenge[]>([])
  const [participantCounts, setParticipantCounts] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchChallenges() {
      try {
        const res = await authFetch('/api/challenges')
        if (res.ok) {
          const data = await res.json()
          setChallenges(data.challenges || [])
          setParticipantCounts(data.participantCounts || {})
        }
      } catch (error) {
        console.error('Failed to fetch challenges:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchChallenges()
  }, [])

  return (
    <div className="container max-w-5xl mx-auto py-8 px-4 space-y-10">
      {/* Hero Section */}
      <section className="text-center space-y-4 max-w-2xl mx-auto pt-6 pb-4">
        <div className="inline-flex items-center justify-center p-3 bg-amber-100 dark:bg-amber-900/30 rounded-full text-amber-600 dark:text-amber-500 mb-2">
          <Trophy className="w-8 h-8" />
        </div>
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-900 dark:text-white">
          Thử Thách Học Tập
        </h1>
        <p className="text-slate-600 dark:text-slate-400 text-lg">
          Tham gia các thử thách, cam kết mục tiêu học tập và nhận lại 100% phí cam kết cùng phần thưởng khi hoàn thành!
        </p>
      </section>

      {/* How it works */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6 py-6 border-y border-slate-200 dark:border-slate-800">
        <div className="flex flex-col items-center text-center space-y-3 p-4">
          <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-full text-blue-600 dark:text-blue-500">
            <Target className="w-6 h-6" />
          </div>
          <h3 className="font-semibold text-lg">1. Đăng ký tham gia</h3>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Chọn thử thách phù hợp và nộp một khoản phí cam kết nhỏ.
          </p>
        </div>
        <div className="flex flex-col items-center text-center space-y-3 p-4">
          <div className="bg-green-100 dark:bg-green-900/30 p-3 rounded-full text-green-600 dark:text-green-500">
            <Sparkles className="w-6 h-6" />
          </div>
          <h3 className="font-semibold text-lg">2. Duy trì mỗi ngày</h3>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Hoàn thành mục tiêu học tập hàng ngày trong suốt thời gian diễn ra.
          </p>
        </div>
        <div className="flex flex-col items-center text-center space-y-3 p-4">
          <div className="bg-amber-100 dark:bg-amber-900/30 p-3 rounded-full text-amber-600 dark:text-amber-500">
            <Award className="w-6 h-6" />
          </div>
          <h3 className="font-semibold text-lg">3. Nhận thưởng</h3>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Hoàn thành 100% để nhận lại phí cam kết và chia sẻ quỹ thưởng từ những người bỏ cuộc.
          </p>
        </div>
      </section>

      {/* Challenges List */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold tracking-tight">Thử thách nổi bật</h2>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-80 bg-slate-100 dark:bg-slate-900 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : challenges.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {challenges.map(challenge => (
              <ChallengeCard 
                key={challenge.id} 
                challenge={challenge} 
                participantCount={participantCounts[challenge.id] || 0}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
            <p className="text-slate-500 dark:text-slate-400">Hiện tại chưa có thử thách nào đang mở.</p>
          </div>
        )}
      </section>
    </div>
  )
}
