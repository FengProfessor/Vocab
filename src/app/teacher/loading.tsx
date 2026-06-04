export default function Loading() {
  return (
    <div className="min-h-dvh bg-slate-900 flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-slate-400 text-sm">Đang tải...</p>
      </div>
    </div>
  );
}
