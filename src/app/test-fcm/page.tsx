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
  const [pushLoading, setPushLoading] = useState(false);

  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (msg: string) => setLogs(prev => [...prev, msg]);

  const handleGetToken = async () => {
    setLoading(true);
    setLogs([]);
    addLog('Bắt đầu lấy token (Bản Cuối Cùng)...');
    try {
      addLog('Đang gọi requestForToken()...');
      const fcmToken = await requestForToken(addLog);
      addLog(`Kết quả từ requestForToken: ${fcmToken ? 'CÓ TOKEN' : 'NULL'}`);
      
      if (fcmToken) {
        setToken(fcmToken);
        addLog('Đang lưu vào Supabase...');
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          const res = await fetch('/api/push/fcm-register', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${session.access_token}`,
            },
            body: JSON.stringify({ fcmToken }),
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
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      const stack = err instanceof Error ? err.stack : '';
      addLog(`EXCEPTION CAUGHT: ${msg}`);
      addLog(`STACK: ${stack}`);
      toast.error('Lỗi: ' + msg);
    } finally {
      setLoading(false);
      addLog('Hoàn tất quá trình.');
    }
  };

  const handleTestPush = async () => {
    setPushLoading(true);
    addLog('--- BẮT ĐẦU TEST PUSH NOTIFICATION ---');
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        addLog('Lỗi: Chưa đăng nhập');
        toast.error('Bạn chưa đăng nhập!');
        return;
      }

      addLog('Đang gọi /api/test/push-due...');
      const res = await fetch('/api/test/push-due', {
        method: 'POST',
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const result = await res.json();
      addLog(`Response: ${JSON.stringify(result, null, 2)}`);

      if (result.success) {
        toast.success(`Đã gửi! ${result.wordsMarkedDue?.length} từ được đặt thành due.`);
      } else {
        toast.error('Lỗi: ' + (result.error || 'Unknown'));
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      addLog(`EXCEPTION: ${msg}`);
      toast.error(msg);
    } finally {
      setPushLoading(false);
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
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Test Push Notification
            <span className="text-xs font-normal text-muted-foreground border rounded px-1.5 py-0.5">End-to-end</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Đặt 5 từ thành &quot;due ngay&quot; rồi gửi push notification đến thiết bị hiện tại.
            <br />
            <span className="font-medium text-orange-600">Lưu ý:</span> Mỗi lần test sẽ overwrite srs_progress của 5 từ đầu.
          </p>
          <ol className="text-xs text-muted-foreground list-decimal list-inside space-y-1">
            <li>Trên mỗi thiết bị (Chrome / iPhone): bấm &quot;Lấy &amp; Lưu FCM Token&quot; trước</li>
            <li>Sau đó bấm nút bên dưới để test push trên thiết bị đó</li>
          </ol>
          <Button
            onClick={handleTestPush}
            disabled={pushLoading}
            variant="chunky"
            className="w-full bg-orange-500 hover:bg-orange-600 text-white"
          >
            {pushLoading ? 'Đang gửi...' : '🔔 Gửi Test Push Notification'}
          </Button>
        </CardContent>
      </Card>

      {logs.length > 0 && (
        <Card>
          <CardContent className="pt-4">
            <div className="p-4 bg-black text-green-400 rounded-md break-all text-xs font-mono max-h-64 overflow-y-auto space-y-1">
              <strong className="text-white mb-2 block">System Logs:</strong>
              {logs.map((log, i) => (
                <div key={i}>&gt; {log}</div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
