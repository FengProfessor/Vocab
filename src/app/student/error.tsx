'use client';
import { useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error(error); }, [error]);
  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <AlertTriangle className="h-12 w-12 text-rose-500 mx-auto mb-4" />
        <h2 className="text-white text-xl font-bold mb-2">Đã xảy ra lỗi</h2>
        <p className="text-slate-400 text-sm mb-6">{error.message || 'Vui lòng thử lại.'}</p>
        <button onClick={reset} className="bg-primary text-white px-6 py-2 rounded-xl font-semibold hover:bg-primary/90">
          Thử lại
        </button>
      </div>
    </div>
  );
}
