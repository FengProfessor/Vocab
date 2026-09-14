'use client'

import React from 'react'
import Link from 'next/link'
import { Calendar, Users, Coins, Trophy } from 'lucide-react'
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
// Assuming Challenge type is defined in @/lib/challenge
import { Challenge } from '@/lib/challenge'

interface ChallengeCardProps {
  challenge: Challenge
  participantCount: number
  className?: string
}

export function ChallengeCard({ challenge, participantCount, className = '' }: ChallengeCardProps) {
  const formatVND = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount)
  }

  const getStatusBadge = () => {
    switch (challenge.status) {
      case 'open':
        return <Badge className="bg-green-500 hover:bg-green-600">Đang mở đăng ký</Badge>
      case 'active':
        return <Badge className="bg-blue-500 hover:bg-blue-600">Đang diễn ra</Badge>
      case 'completed':
        return <Badge variant="secondary">Đã kết thúc</Badge>
      default:
        return null
    }
  }

  // Calculate duration in days
  const startDate = new Date(challenge.starts_at)
  const endDate = new Date(challenge.ends_at)
  const durationDays = Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))

  return (
    <Card className={`flex flex-col overflow-hidden ${className}`}>
      <CardHeader className="bg-slate-50 dark:bg-slate-900/50 pb-4">
        <div className="flex justify-between items-start mb-2">
          {getStatusBadge()}
          <Badge variant="outline" className="flex items-center gap-1">
            <Trophy className="w-3 h-3 text-amber-500" />
            <span>Thử thách</span>
          </Badge>
        </div>
        <CardTitle className="text-xl font-bold line-clamp-2">{challenge.name}</CardTitle>
        <CardDescription className="line-clamp-2 mt-2 text-slate-600 dark:text-slate-400">
          {challenge.description}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="flex-1 pt-4 pb-2">
        <div className="grid grid-cols-2 gap-y-4 gap-x-2 text-sm">
          <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
            <Calendar className="w-4 h-4" />
            <div className="flex flex-col">
              <span className="text-xs text-slate-500">Thời gian</span>
              <span className="font-medium text-slate-900 dark:text-slate-100">{durationDays} ngày</span>
            </div>
          </div>
          
          <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
            <Coins className="w-4 h-4 text-amber-500" />
            <div className="flex flex-col">
              <span className="text-xs text-slate-500">Phí cam kết</span>
              <span className="font-medium text-slate-900 dark:text-slate-100">{formatVND(challenge.deposit_amount)}</span>
            </div>
          </div>
          
          <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400 col-span-2">
            <Users className="w-4 h-4" />
            <div className="flex flex-col w-full">
              <div className="flex justify-between w-full">
                <span className="text-xs text-slate-500">Người tham gia</span>
                <span className="text-xs font-medium text-slate-900 dark:text-slate-100">
                  {participantCount} {challenge.max_participants ? `/ ${challenge.max_participants}` : ''}
                </span>
              </div>
              {/* Optional tiny progress bar for capacity */}
              {challenge.max_participants && (
                <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full mt-1">
                  <div 
                    className="h-full bg-blue-500 rounded-full" 
                    style={{ width: `${Math.min(100, (participantCount / challenge.max_participants) * 100)}%` }} 
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="pt-2 pb-4">
        <div className="flex gap-2 w-full">
          <Link href={`/challenge/${challenge.slug}`} className="w-full">
            <Button variant={challenge.status === 'open' ? 'default' : 'outline'} className="w-full">
              {challenge.status === 'open' ? 'Tham gia ngay' : 'Xem chi tiết'}
            </Button>
          </Link>
        </div>
      </CardFooter>
    </Card>
  )
}
