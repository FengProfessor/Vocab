'use client';

import { useState } from 'react';

type Props = {
  example: string;
  exampleVi?: string | null;
  /** Học mới: true (sub luôn). Ôn: false (nút Dịch). */
  defaultShowVi?: boolean;
  className?: string;
  enClassName?: string;
  viClassName?: string;
};

/**
 * Câu ví dụ EN + sub VI.
 * defaultShowVi=true → hiện sub ngay (giới thiệu từ mới).
 * defaultShowVi=false → chỉ EN, bấm 「Dịch」 mới mở sub (SRS/ôn).
 */
export function ExampleWithSub({
  example,
  exampleVi,
  defaultShowVi = true,
  className = '',
  enClassName = 'text-xs font-medium italic leading-snug sm:text-sm',
  viClassName = 'mt-1 text-[11px] font-medium leading-snug text-slate-500 sm:text-xs not-italic',
}: Props) {
  const vi = (exampleVi || '').trim();
  const en = (example || '').trim();
  const [showVi, setShowVi] = useState(defaultShowVi && !!vi);

  if (!en) return null;

  return (
    <div className={className}>
      <p className={enClassName}>&ldquo;{en}&rdquo;</p>
      {vi && showVi && <p className={viClassName}>{vi}</p>}
      {vi && !defaultShowVi && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setShowVi((s) => !s);
          }}
          className="mt-1 text-[10px] font-bold uppercase tracking-wide text-indigo-500/90 hover:text-indigo-600"
        >
          {showVi ? 'Ẩn dịch' : 'Dịch'}
        </button>
      )}
    </div>
  );
}
