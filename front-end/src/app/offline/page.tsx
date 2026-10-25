'use client';

export default function OfflinePage() {
  return (
    <div className="min-h-dvh flex items-center justify-center bg-slate-900 px-4">
      <div className="max-w-sm w-full text-center">
        {/* Icon */}
        <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg
            className="w-10 h-10 text-indigo-400"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96-.46 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.98-3A2.5 2.5 0 0 1 9.5 2Z" />
            <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96-.46 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.98-3A2.5 2.5 0 0 0 14.5 2Z" />
          </svg>
        </div>

        <p className="text-xs font-bold tracking-widest uppercase text-indigo-400 mb-3">
          LingoPro
        </p>

        <h1 className="text-2xl font-extrabold text-white mb-3">
          Bạn đang offline
        </h1>

        <p className="text-slate-400 text-sm leading-relaxed mb-8">
          Vui lòng kết nối internet để tiếp tục học.
          <br />
          Tiến độ của bạn đã được lưu.
        </p>

        <button
          onClick={() => window.location.reload()}
          className="w-full bg-indigo-600 hover:bg-indigo-500 active:translate-y-0.5 text-white font-bold py-3 px-6 rounded-xl transition-all border-b-4 border-indigo-800 active:border-b-0"
        >
          Thử lại
        </button>
      </div>
    </div>
  );
}
