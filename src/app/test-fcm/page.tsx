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

  const [logs, setLogs] = useState<string[]>([]);
  
  const addLog = (msg: string) => setLogs(prev => [...prev, msg]);

  const handleGetToken = async () => {
    setLoading(true);
    setLogs([]);
    addLog('Bắt đầu lấy token (Bản Cuối Cùng)...');
    try {
      addLog('Đang gọi requestForToken()...');
      const fcmToken = await requestForToken();
      addLog(`Kết quả từ requestForToken: ${fcmToken ? 'CÓ TOKEN' : 'NULL'}`);
      
      if (fcmToken) {
        setToken(fcmToken);
        addLog('Đang lưu vào Supabase...');
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const res = await fetch('/api/push/fcm-register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: user.id, fcmToken }),
          });
          const result = await res.json();
          addLog(`Kết quả lưu DB: ${JSON.stringify(result)}`);
          if (result.success) {
            toast.success('Token đã được lưu vào database!');
          } else {
            toast.error('Lỗi khi lưu token: ' + result.error);
          }
        } else {
          addLog('Lỗi: Bạn chưa đăng nhập');
          toast.warning('Bạn chưa đăng nhập!');
        }
      } else {
        addLog('Lỗi logic: Firebase trả về rỗng nhưng không báo lỗi!');
        toast.error('Không lấy được Token. Hãy kiểm tra quyền thông báo.');
      }
    } catch (err: any) {
      addLog(`EXCEPTION CAUGHT: ${err.message}`);
      addLog(`STACK: ${err.stack}`);
      toast.error('Lỗi: ' + err.message);
    } finally {
      setLoading(false);
      addLog('Hoàn tất quá trình.');
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
          
          {logs.length > 0 && (
            <div className="mt-6 p-4 bg-black text-green-400 rounded-md break-all text-xs font-mono max-h-64 overflow-y-auto space-y-1">
              <strong className="text-white mb-2 block">System Logs:</strong>
              {logs.map((log, i) => (
                <div key={i}>&gt; {log}</div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// build kick 1778733081601