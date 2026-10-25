'use client'

import React, { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Calendar, Coins, Users, AlertCircle, Share2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { authFetch } from '@/lib/auth-fetch'
import { ChallengeDailyProgress } from '@/components/challenge/ChallengeDailyProgress'
import { ChallengeCalendar } from '@/components/challenge/ChallengeCalendar'
import { ChallengeJoinModal } from '@/components/challenge/ChallengeJoinModal'

export default function ChallengeDetailPage() {
  const params = useParams()
  const router = useRouter()
  const slug = params.slug as string

  const [challengeData, setChallengeData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false)

  useEffect(() => {
    async function fetchChallengeDetail() {
      try {
        const res = await authFetch(`/api/challenges/${slug}`)
        if (res.ok) {
          const data = await res.json()
          setChallengeData(data)
        } else if (res.status === 404) {
          router.replace('/challenge')
        }
      } catch (error) {
        console.error('Failed to fetch challenge:', error)
      } finally {
        setLoading(false)
      }
    }

    if (slug) {
      fetchChallengeDetail()
    }
  }, [slug, router])

  const formatVND = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(dateString))
  }

  if (loading) {
    return (
      <div className="container max-w-4xl mx-auto py-8 px-4 space-y-6">
        <div className="w-24 h-8 bg-slate-100 dark:bg-slate-800 rounded animate-pulse" />
        <div className="h-64 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 h-96 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse" />
          <div className="h-96 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse" />
        </div>
      </div>
    )
  }

  if (!challengeData) return null

  const { challenge, participantCount, participation, todayMetrics, dailyLogs } = challengeData
  
  const isParticipating = !!participation
  const isCompleted = challenge.status === 'completed'
  const isOpen = challenge.status === 'open'

  // Determine duration
  const startDate = new Date(challenge.start_date)
  const endDate = new Date(challenge.end_date)
  const durationDays = Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))

  const handleJoined = () => {
    // Refresh page data
    window.location.reload()
  }

  return (
    <div className="container max-w-5xl mx-auto py-8 px-4 space-y-6">
      {/* Back button */}
      <Link href="/challenge" className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 transition-colors">
        <ArrowLeft className="w-4 h-4 mr-1" />
        Tất cả thử thách
      </Link>

      {/* Header Section */}
      <div className="bg-white dark:bg-slate-950 rounded-2xl p-6 md:p-8 border shadow-sm">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div className="space-y-4 flex-1">
            <div className="flex items-center gap-2">
              {isOpen && <Badge className="bg-green-500 hover:bg-green-600">Đang mở đăng ký</Badge>}
              {challenge.status === 'active' && <Badge className="bg-blue-500 hover:bg-blue-600">Đang diễn ra</Badge>}
              {isCompleted && <Badge variant="secondary">Đã kết thúc</Badge>}
            </div>
            
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              {challenge.name}
            </h1>
            
            <p className="text-slate-600 dark:text-slate-400 text-lg max-w-2xl">
              {challenge.description}
            </p>

            <div className="flex flex-wrap gap-4 pt-2">
              <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-900 px-3 py-2 rounded-lg text-sm">
                <Calendar className="w-4 h-4 text-slate-500" />
                <span className="font-medium">{formatDate(challenge.start_date)} - {formatDate(challenge.end_date)} ({durationDays} ngày)</span>
              </div>
              <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-900 px-3 py-2 rounded-lg text-sm">
                <Users className="w-4 h-4 text-slate-500" />
                <span className="font-medium">{participantCount} {challenge.max_participants ? `/ ${challenge.max_participants}` : ''} người tham gia</span>
              </div>
              <div className="flex items-center gap-2 bg-amber-50 dark:bg-amber-950/30 px-3 py-2 rounded-lg text-sm text-amber-700 dark:text-amber-400 border border-amber-100 dark:border-amber-900">
                <Coins className="w-4 h-4" />
                <span className="font-medium">Phí cam kết: {formatVND(challenge.deposit_amount)}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3 min-w-[200px]">
            {!isParticipating && isOpen && (
              <Button size="lg" className="w-full text-base" onClick={() => setIsJoinModalOpen(true)}>
                Tham gia ngay
              </Button>
            )}
            {!isParticipating && !isOpen && (
              <Button size="lg" disabled className="w-full text-base">
                {isCompleted ? 'Đã kết thúc' : 'Đã đóng đăng ký'}
              </Button>
            )}
            {isParticipating && (
              <Button size="lg" variant="outline" className="w-full text-base border-green-500 text-green-600 hover:bg-green-50 dark:hover:bg-green-950 cursor-default">
                Bạn đang tham gia
              </Button>
            )}
            <Button variant="ghost" className="w-full text-slate-500">
              <Share2 className="w-4 h-4 mr-2" />
              Chia sẻ
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (Main Content) */}
        <div className="lg:col-span-2 space-y-6">
          {isParticipating && !isCompleted && (
            <ChallengeCalendar 
              dailyLogs={dailyLogs} 
              startDate={challenge.start_date} 
              endDate={challenge.end_date} 
            />
          )}

          <div className="bg-white dark:bg-slate-950 rounded-2xl p-6 border shadow-sm space-y-4">
            <h2 className="text-xl font-bold">Quy định thử thách</h2>
            <div className="prose dark:prose-invert max-w-none text-slate-600 dark:text-slate-300 text-sm md:text-base">
              <ul>
                <li><strong>Mục tiêu:</strong> Bạn cần hoàn thành đủ các chỉ tiêu học tập hàng ngày được đề ra.</li>
                <li><strong>Thời gian:</strong> Liên tục trong {durationDays} ngày từ {formatDate(challenge.start_date)} đến {formatDate(challenge.end_date)}. Cập nhật trước 23:59 mỗi ngày.</li>
                <li><strong>Phí cam kết:</strong> {formatVND(challenge.deposit_amount)}.</li>
                <li><strong>Hoàn tiền:</strong> Nếu bạn hoàn thành 100% số ngày, bạn sẽ được hoàn lại 100% phí cam kết. Nếu bỏ lỡ dù chỉ 1 ngày, bạn sẽ mất khoản phí này.</li>
                <li><strong>Phần thưởng thêm:</strong> Tổng số tiền từ những người bỏ cuộc sẽ được chia đều cho những người hoàn thành xuất sắc thử thách.</li>
              </ul>
            </div>
            {!isParticipating && (
              <Alert className="bg-blue-50 text-blue-800 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-900 mt-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-sm ml-2">
                  Bạn cần cân nhắc kỹ trước khi tham gia vì phí cam kết sẽ <strong>không được hoàn lại</strong> nếu bạn bỏ cuộc hoặc quên làm nhiệm vụ trong bất kỳ ngày nào.
                </AlertDescription>
              </Alert>
            )}
          </div>
        </div>

        {/* Right Column (Sidebar) */}
        <div className="space-y-6">
          {isParticipating && challenge.daily_criteria && (
            <ChallengeDailyProgress 
              criteria={challenge.daily_criteria} 
              metrics={todayMetrics} 
            />
          )}
          
          <div className="bg-slate-50 dark:bg-slate-900/50 rounded-2xl p-6 border border-slate-100 dark:border-slate-800">
            <h3 className="font-bold mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-slate-500" />
              Thống kê tham gia
            </h3>
            <div className="space-y-4 text-sm">
              <div className="flex justify-between items-center pb-3 border-b border-slate-200 dark:border-slate-800">
                <span className="text-slate-500">Tổng người tham gia</span>
                <span className="font-medium">{participantCount}</span>
              </div>
              <div className="flex justify-between items-center pb-3 border-b border-slate-200 dark:border-slate-800">
                <span className="text-slate-500">Đang duy trì chuỗi</span>
                <span className="font-medium text-green-600 dark:text-green-500">Đang cập nhật...</span>
              </div>
              <div className="flex justify-between items-center pb-3">
                <span className="text-slate-500">Tổng quỹ giải thưởng</span>
                <span className="font-medium text-amber-600 dark:text-amber-500">Đang cập nhật...</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {challenge && (
        <ChallengeJoinModal 
          challenge={challenge} 
          open={isJoinModalOpen} 
          onOpenChange={setIsJoinModalOpen}
          onJoined={handleJoined}
        />
      )}
    </div>
  )
}
