'use client';

import { useState } from 'react';
import { requestForToken } from '@/lib/firebase';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

export default function FCMTestPage() {
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleGetToken = async () => {
    setLoading(true);
    try {
      const fcmToken = await requestForToken();
      if (fcmToken) {
        setToken(fcmToken);
        
        // Thử lưu vào DB ngay tại đây
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const res = await fetch('/api/push/fcm-register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: user.id, fcmToken }),
          });
          const result = await res.json();
          if (result.success) {
            toast.success('Token đã được lưu vào database!');
          } else {
            toast.error('Lỗi khi lưu token: ' + result.error);
          }
        } else {
          toast.warning('Bạn chưa đăng nhập!');
        }
      } else {
        toast.error('Không lấy được Token. Hãy kiểm tra quyền thông báo.');
      }
    } catch (err: any) {
      toast.error('Lỗi: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-2xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Firebase FCM Test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Bấm nút dưới đây để kiểm tra xem trình duyệt của bạn có lấy được FCM Token không.
          </p>
          <Button onClick={handleGetToken} disabled={loading} className="w-full">
            {loading ? 'Đang lấy token...' : 'Lấy & Lưu FCM Token'}
          </Button>
          
          {token && (
            <div className="mt-4 p-4 bg-muted rounded-md break-all text-xs font-mono">
              <strong>Token của bạn:</strong><br />
              {token}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// build kick 1778733081601