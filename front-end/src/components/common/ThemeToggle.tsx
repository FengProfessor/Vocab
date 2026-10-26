
import React, { useEffect, useState } from "react";
import { useTheme } from '@/shared/ui/theme';
import { useLocation } from "react-router-dom";
import { Sun, Moon, Monitor, Check, Sparkles } from "lucide-react";

export type ThemeMode = "light" | "dark" | "system";

export interface ThemeToggleProps {
  /**
   * - "compact": Segmented 3-button pill for top headers / navbars
   * - "cards": Full 3-card visual selector for Profile / Settings pages
   * - "sidebar": Full-width segmented control for sidebar / mobile drawer
   */
  variant?: "compact" | "cards" | "sidebar";
  className?: string;
  showLabels?: boolean;
}

const THEME_OPTIONS: Array<{
  value: ThemeMode;
  label: string;
  shortLabel: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  {
    value: "light",
    label: "Giao diện Sáng",
    shortLabel: "Sáng",
    description: "Nền sáng trong trẻo, tối ưu học tập ban ngày",
    icon: Sun,
  },
  {
    value: "dark",
    label: "Giao diện Tối",
    shortLabel: "Tối",
    description: "Nền tối dịu mắt, giảm mỏi mắt khi học ban đêm",
    icon: Moon,
  },
  {
    value: "system",
    label: "Theo hệ thống",
    shortLabel: "Hệ thống",
    description: "Tự động đồng bộ sáng/tối theo thiết bị của bạn",
    icon: Monitor,
  },
];

export function ThemeToggle({
  variant = "compact",
  className = "",
  showLabels = false,
}: ThemeToggleProps) {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const currentTheme: ThemeMode = mounted
    ? ((theme as ThemeMode) || "system")
    : "system";

  if (variant === "cards") {
    return (
      <div
        role="radiogroup"
        aria-label="Chế độ giao diện Sáng, Tối hoặc Theo hệ thống"
        className={`grid grid-cols-1 sm:grid-cols-3 gap-3 ${className}`}
        data-testid="theme-selector-cards"
      >
        {THEME_OPTIONS.map((opt) => {
          const Icon = opt.icon;
          const active = currentTheme === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => setTheme(opt.value)}
              data-testid={`theme-option-${opt.value}`}
              className={`group relative flex flex-col items-start p-4 rounded-2xl border-2 text-left transition-all duration-200 cursor-pointer min-h-[44px] ${
                active
                  ? "border-indigo-600 bg-indigo-50/70 dark:border-indigo-400 dark:bg-indigo-950/50 shadow-sm"
                  : "border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/90 hover:border-indigo-300 dark:hover:border-slate-700"
              }`}
            >
              <div className="flex items-center justify-between w-full mb-2.5">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                    active
                      ? "bg-indigo-600 text-white shadow-sm shadow-indigo-500/30"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 group-hover:bg-indigo-50 dark:group-hover:bg-slate-700"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                </div>
                {active && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-indigo-600 text-white">
                    <Check className="w-3 h-3" /> Đang dùng
                  </span>
                )}
              </div>
              <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
                {opt.label}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                {opt.description}
              </p>
              {opt.value === "system" && mounted && (
                <span className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600 dark:text-indigo-400">
                  <Sparkles className="w-3 h-3" />
                  Thiết bị hiện tại:{" "}
                  {resolvedTheme === "dark" ? "Tối" : "Sáng"}
                </span>
              )}
            </button>
          );
        })}
      </div>
    );
  }

  if (variant === "sidebar") {
    return (
      <div
        role="radiogroup"
        aria-label="Chọn chế độ giao diện"
        data-testid="theme-toggle-sidebar"
        className={`flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-800/90 border border-slate-200/70 dark:border-slate-700/80 ${className}`}
      >
        {THEME_OPTIONS.map((opt) => {
          const Icon = opt.icon;
          const active = currentTheme === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => setTheme(opt.value)}
              data-testid={`theme-btn-${opt.value}`}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-xs font-bold transition-all duration-150 cursor-pointer min-h-[36px] ${
                active
                  ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
              }`}
              title={opt.label}
            >
              <Icon className="w-3.5 h-3.5 shrink-0" />
              <span>{opt.shortLabel}</span>
            </button>
          );
        })}
      </div>
    );
  }

  // Default "compact" segmented pill for header / topbar
  return (
    <div
      role="radiogroup"
      aria-label="Chế độ giao diện Sáng / Tối / Hệ thống"
      data-testid="theme-toggle-compact"
      className={`inline-flex items-center gap-0.5 p-1 rounded-full bg-slate-100/90 dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 backdrop-blur-md ${className}`}
    >
      {THEME_OPTIONS.map((opt) => {
        const Icon = opt.icon;
        const active = currentTheme === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={opt.label}
            title={`${opt.label} (${opt.description})`}
            onClick={() => setTheme(opt.value)}
            data-testid={`theme-pill-${opt.value}`}
            className={`inline-flex items-center justify-center gap-1.5 rounded-full px-2.5 py-1.5 text-xs font-bold transition-all duration-150 cursor-pointer ${
              active
                ? "bg-white dark:bg-slate-950 text-indigo-600 dark:text-indigo-400 shadow-xs ring-1 ring-slate-200/70 dark:ring-slate-700"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
          >
            <Icon className="w-3.5 h-3.5 shrink-0" />
            {showLabels && (
              <span className="hidden xl:inline">{opt.shortLabel}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}

/**
 * Floating universal theme dock for standalone pages that do not render StudentShell
 * (e.g., /landing, /auth, /placement, /onboarding, /admin, etc.), ensuring 100% of routes
 * allow instant switching between Light, Dark, and System themes.
 */
export function GlobalThemeDock() {
  const location = useLocation();
  const [hasShellToggle, setHasShellToggle] = useState(false);

  useEffect(() => {
    const checkShell = () => {
      const shellEl = document.querySelector('[data-shell-theme-toggle="true"]');
      setHasShellToggle(Boolean(shellEl));
    };
    checkShell();
    const timer = window.setTimeout(checkShell, 150);
    return () => window.clearTimeout(timer);
  }, [location.pathname]);

  if (hasShellToggle) return null;

  return (
    <div
      className="fixed bottom-4 left-4 z-50 print:hidden"
      data-testid="global-theme-dock"
    >
      <ThemeToggle
        variant="compact"
        showLabels={false}
        className="shadow-lg shadow-slate-900/10 dark:shadow-black/40"
      />
    </div>
  );
}
