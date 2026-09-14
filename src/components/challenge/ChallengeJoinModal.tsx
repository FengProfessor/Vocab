'use client'

import React, { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Challenge } from '@/lib/challenge'
import { authFetch } from '@/lib/auth-fetch'
import { toast } from 'sonner'
import { AlertCircle, QrCode } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

interface ChallengeJoinModalProps {
  challenge: Challenge
  open: boolean
  onOpenChange: (open: boolean) => void
  onJoined?: () => void
}

export function ChallengeJoinModal({ challenge, open, onOpenChange, onJoined }: ChallengeJoinModalProps) {
  const [agreed, setAgreed] = useState(false)
  const [loading, setLoading] = useState(false)

  const formatVND = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount)
  }

  const handleJoin = async () => {
    if (!agreed) {
      toast.error('Vui lòng đồng ý với các điều khoản')
      return
    }

    setLoading(true)
    try {
      const res = await authFetch(`/api/challenges/${challenge.id}/join`, {
        method: 'POST'
      })

      if (!res.ok) {
        throw new Error('Không thể tham gia thử thách. Vui lòng thử lại.')
      }

      toast.success('Đăng ký tham gia thử thách thành công!')
      onOpenChange(false)
      onJoined?.()
    } catch (error: any) {
      toast.error(error.message || 'Có lỗi xảy ra')
    } finally {
      setLoading(false)
    }
  }

  // Generate VietQR url (Mocked or real using vietqr.io)
  // Assuming a static bank info for LingoPro. In production, this might come from env vars or backend.
  const bankId = '970415' // Vietinbank as example
  const accountNo = '1111111111'
  const accountName = 'LINGOPRO'
  const amount = challenge.deposit_amount
  const description = `LINGOPRO ${challenge.slug}`.substring(0, 50).replace(/[^a-zA-Z0-9 ]/g, '')
  
  const qrUrl = `https://img.vietqr.io/image/${bankId}-${accountNo}-compact2.jpg?amount=${amount}&addInfo=${encodeURIComponent(description)}&accountName=${encodeURIComponent(accountName)}`

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md md:max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">Xác nhận tham gia thử thách</DialogTitle>
          <DialogDescription>
            {challenge.name}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-lg space-y-4 text-sm">
            <h3 className="font-semibold text-base">Quy định thử thách</h3>
            <ul className="list-disc pl-5 space-y-2 text-slate-700 dark:text-slate-300">
              <li>Hoàn thành nhiệm vụ học tập mỗi ngày trong thời gian diễn ra thử thách.</li>
              <li>Bạn phải nộp một khoản phí cam kết là <strong className="text-slate-900 dark:text-white">{formatVND(challenge.deposit_amount)}</strong>.</li>
              <li>Nếu hoàn thành 100% số ngày, bạn sẽ được <strong>hoàn lại toàn bộ</strong> số tiền cam kết.</li>
              <li>Nếu thất bại (bỏ lỡ bất kỳ ngày nào), số tiền này sẽ không được hoàn lại và được dùng để thưởng cho những người chiến thắng khác.</li>
            </ul>
          </div>

          <div className="flex flex-col items-center space-y-4 border rounded-lg p-6 bg-white dark:bg-slate-950">
            <div className="flex items-center gap-2 font-semibold text-lg">
              <QrCode className="w-5 h-5" />
              Quét mã để nộp phí cam kết
            </div>
            
            <div className="bg-white p-2 rounded-xl border-2 border-slate-100">
              <img 
                src={qrUrl} 
                alt="VietQR Payment" 
                className="w-48 h-48 object-contain"
                loading="lazy"
              />
            </div>
            
            <div className="text-center space-y-1 w-full">
              <p className="text-sm text-slate-500">Số tiền</p>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-500">{formatVND(challenge.deposit_amount)}</p>
            </div>
            
            <div className="w-full bg-slate-50 dark:bg-slate-900 p-3 rounded-md text-center">
              <p className="text-xs text-slate-500 mb-1">Nội dung chuyển khoản (Bắt buộc)</p>
              <p className="font-mono font-bold tracking-wider text-slate-900 dark:text-white">{description}</p>
            </div>
            
            <Alert className="bg-blue-50 text-blue-800 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-900">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Lưu ý</AlertTitle>
              <AlertDescription className="text-xs mt-1">
                Vui lòng nhập chính xác nội dung chuyển khoản. Hệ thống sẽ tự động xác nhận trong vòng 1-3 phút.
              </AlertDescription>
            </Alert>
          </div>

          <div className="flex items-start space-x-3 pt-2">
            <Checkbox 
              id="terms" 
              checked={agreed} 
              onCheckedChange={(c) => setAgreed(c as boolean)} 
              className="mt-1"
            />
            <label
              htmlFor="terms"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer text-slate-700 dark:text-slate-300"
            >
              Tôi đã đọc, hiểu rõ quy định hoàn tiền và đồng ý tham gia thử thách này.
            </label>
          </div>
        </div>

        <DialogFooter className="sm:justify-between items-center flex-col sm:flex-row gap-3">
          <Button variant="ghost" onClick={() => onOpenChange(false)} className="w-full sm:w-auto">
            Hủy bỏ
          </Button>
          <Button 
            onClick={handleJoin} 
            disabled={!agreed || loading}
            className="w-full sm:w-auto"
          >
            {loading ? 'Đang xử lý...' : 'Xác nhận đã chuyển khoản'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
