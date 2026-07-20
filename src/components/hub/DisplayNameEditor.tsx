'use client';

import { useEffect, useState } from 'react';
import { authFetch } from '@/lib/auth-fetch';
import {
  DISPLAY_NAME_MAX,
  DISPLAY_NAME_MIN,
  validateDisplayName,
} from '@/lib/display-name';

interface Props {
  initialName: string | null;
  onSaved: (name: string) => void;
}

export function DisplayNameEditor({ initialName, onSaved }: Props) {
  const [value, setValue] = useState(initialName ?? '');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [okMsg, setOkMsg] = useState<string | null>(null);

  useEffect(() => {
    setValue(initialName ?? '');
  }, [initialName]);

  const len = value.trim().length;
  const preview = validateDisplayName(value);

  const save = async () => {
    setOkMsg(null);
    const checked = validateDisplayName(value);
    if (!checked.ok) {
      setError(checked.error);
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await authFetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ full_name: checked.name }),
      });
      const json = await res.json();
      if (!json.success) {
        setError(json.error || 'Lưu thất bại');
        return;
      }
      onSaved(checked.name);
      setOkMsg('Đã lưu tên hiển thị');
      setValue(checked.name);
    } catch {
      setError('Không kết nối được server');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-xl border border-stone-200 bg-white p-3 space-y-2 shadow-sm">
      <div>
        <h2 className="text-sm font-semibold text-stone-900">Tên trên đầu nhân vật</h2>
        <p className="text-[11px] text-stone-500 mt-0.5">
          {DISPLAY_NAME_MIN}–{DISPLAY_NAME_MAX} ký tự
        </p>
      </div>
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <input
            className="w-full rounded-lg border bg-background px-3 py-2 text-sm pr-14"
            value={value}
            maxLength={DISPLAY_NAME_MAX + 4}
            placeholder="Vd: Mai Anh"
            onChange={(e) => {
              setValue(e.target.value);
              setError(null);
              setOkMsg(null);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') void save();
            }}
          />
          <span
            className={`absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-mono tabular-nums ${
              len > DISPLAY_NAME_MAX ? 'text-destructive' : 'text-muted-foreground'
            }`}
          >
            {len}/{DISPLAY_NAME_MAX}
          </span>
        </div>
        <button
          type="button"
          disabled={saving || !preview.ok}
          onClick={() => void save()}
          className="rounded-lg bg-primary text-primary-foreground px-3 py-2 text-sm font-semibold disabled:opacity-50 shrink-0"
        >
          {saving ? '…' : 'Lưu'}
        </button>
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
      {okMsg && <p className="text-xs text-emerald-600 dark:text-emerald-400">{okMsg}</p>}
      {!error && !preview.ok && value.trim().length > 0 && (
        <p className="text-xs text-amber-600 dark:text-amber-400">{preview.error}</p>
      )}
    </div>
  );
}
