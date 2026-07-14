export default function Loading() {
  return (
    <div className="relative min-h-dvh flex items-center justify-center bg-[#f6efe6]">
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        <div className="absolute left-[-8%] top-[-10%] h-[20rem] w-[20rem] rounded-full bg-[#e57b52]/15 blur-3xl" />
        <div className="absolute right-[-8%] top-[15%] h-[18rem] w-[18rem] rounded-full bg-[#d2c09e]/28 blur-3xl" />
      </div>
      <div className="relative flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#b5502f] border-t-transparent" />
        <p className="text-sm font-bold text-[#7b6558]">Đang tải...</p>
      </div>
    </div>
  );
}
