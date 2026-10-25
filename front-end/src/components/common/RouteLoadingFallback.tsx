import React from 'react';

/**
 * Centered spinner rendered while lazily loaded route chunks are downloading.
 */
export const RouteLoadingFallback: React.FC = () => {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3 p-6 text-slate-500 dark:text-slate-400">
      <div className="h-8 w-8 rounded-full border-2 border-teal-500 border-t-transparent animate-spin" />
      <span className="text-sm font-medium">Đang tải dữ liệu...</span>
    </div>
  );
};
