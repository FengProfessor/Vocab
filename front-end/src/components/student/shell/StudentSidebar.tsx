import type { RefObject } from 'react';
import Link from '@/shared/router/navigation';
import { Crown, GraduationCap, LogOut, UserPlus, Users } from 'lucide-react';
import { ThemeToggle } from '@/components/common/ThemeToggle';
import type { StudentNavSection } from '@/lib/student-nav';
import type { UserGamification } from '@/lib/supabase';
import type { ShellProfile } from '@/components/student/StudentProvider';
import { StudentNavLink } from './StudentNavLink';
import { cn } from '@/lib/utils';

export interface StudentSidebarProps {
  desktopNavRef: RefObject<HTMLElement | null>;
  navSections: StudentNavSection[];
  pathname: string;
  isPracticeSubOpen: boolean;
  onTogglePracticeSub: () => void;
  onJoinClass?: () => void;
  effectiveProfile: ShellProfile | null;
  profileEmail: string;
  initials: string;
  currentLevel: number;
  effectiveGamification: UserGamification;
  effectiveIsTeacher: boolean;
  isUpgradeActive: boolean;
  onSignOut: () => void;
}

export function StudentSidebar({
  desktopNavRef,
  navSections,
  pathname,
  isPracticeSubOpen,
  onTogglePracticeSub,
  onJoinClass,
  effectiveProfile,
  profileEmail,
  initials,
  currentLevel,
  effectiveGamification,
  effectiveIsTeacher,
  isUpgradeActive,
  onSignOut,
}: StudentSidebarProps) {
  return (
    <aside className="fixed inset-y-0 left-0 z-20 hidden w-[248px] border-r border-[#ececf1] bg-white px-3 py-3.5 md:flex md:flex-col dark:border-[#272C47] dark:bg-[#161A2E]">
      <Link
        href="/student"
        className="flex items-center gap-2.5 px-2 pb-3 pt-1 border-b border-slate-100 dark:border-[#272C47] mb-2"
      >
        <span className="flex h-7 w-7 items-center justify-center rounded-md bg-indigo-600 dark:bg-[#7B67FF] text-white font-black text-sm shadow-xs shrink-0">
          L
        </span>
        <div className="min-w-0">
          <div className="font-extrabold text-[14px] text-slate-900 dark:text-[#F2F3FB] leading-none tracking-tight">
            LingoPro
          </div>
          <div className="text-[10px] font-medium text-slate-400 dark:text-[#A5AAC6] mt-0.5">
            Học tiếng Anh thông minh
          </div>
        </div>
      </Link>

      <nav
        ref={desktopNavRef}
        onScroll={(e) => {
          try {
            sessionStorage.setItem('lingopro_sidebar_scroll', String(e.currentTarget.scrollTop));
          } catch {
            // ignore
          }
        }}
        className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto scrollbar-none pr-0.5"
      >
        {navSections.map((section, sIdx) => (
          <div key={section.id} className={sIdx === 0 ? 'space-y-0.5' : 'mt-2.5 space-y-0.5'}>
            <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              {section.title}
            </div>
            {section.items.map((item) => (
              <StudentNavLink
                key={item.href}
                item={item}
                active={item.match(pathname)}
                pathname={pathname}
                isPracticeSubOpen={isPracticeSubOpen}
                onTogglePracticeSub={onTogglePracticeSub}
              />
            ))}
          </div>
        ))}
        {onJoinClass ? (
          <button
            type="button"
            onClick={onJoinClass}
            className="group mt-1 flex min-h-[34px] w-full items-center gap-2.5 rounded-md px-2.5 py-1.5 text-left text-[13px] font-medium text-slate-600 transition-colors hover:bg-slate-100/70 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/60 dark:hover:text-slate-200"
          >
            <UserPlus
              className="h-4 w-4 shrink-0 text-slate-500 transition-colors group-hover:text-slate-700 dark:text-slate-400 dark:group-hover:text-slate-300"
              strokeWidth={1.75}
            />
            <span className="min-w-0 truncate">Tham gia lớp</span>
          </button>
        ) : (
          <Link
            href="/student?joinClass=1"
            className="group mt-1 flex min-h-[34px] items-center gap-2.5 rounded-md px-2.5 py-1.5 text-[13px] font-medium text-slate-600 transition-colors hover:bg-slate-100/70 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/60 dark:hover:text-slate-200"
          >
            <UserPlus
              className="h-4 w-4 shrink-0 text-slate-500 transition-colors group-hover:text-slate-700 dark:text-slate-400 dark:group-hover:text-slate-300"
              strokeWidth={1.75}
            />
            <span className="min-w-0 truncate">Tham gia lớp</span>
          </Link>
        )}
      </nav>

      <div className="mt-auto shrink-0 space-y-2 border-t border-slate-100 pt-2.5 dark:border-slate-800">
        <ThemeToggle variant="sidebar" />

        {(!effectiveProfile?.plan || effectiveProfile.plan === 'free') && (
          <Link
            href="/upgrade"
            aria-current={isUpgradeActive ? 'page' : undefined}
            className={cn(
              'group flex min-h-[36px] items-center justify-between rounded-lg px-2.5 py-1.5 text-[13px] font-bold transition-all',
              isUpgradeActive
                ? 'bg-amber-500/15 text-amber-900 border border-amber-300 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800 font-black'
                : 'bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/10 text-amber-900 hover:from-amber-500/20 hover:to-orange-500/20 border border-amber-200/80 shadow-[0_1px_2px_rgba(245,158,11,0.08)] dark:border-amber-900/50 dark:text-amber-300 dark:from-amber-950/30 dark:to-orange-950/20',
            )}
          >
            <div className="flex items-center gap-2 min-w-0">
              <Crown className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400 group-hover:scale-110 transition-transform" />
              <span className="truncate">Nâng cấp Pro</span>
            </div>
            <span className="shrink-0 rounded bg-gradient-to-r from-amber-500 to-orange-500 px-1.5 py-0.5 text-[9px] font-black uppercase text-white shadow-xs">
              ƯU ĐÃI
            </span>
          </Link>
        )}

        <Link
          href="/student/profile"
          className="flex items-center justify-between p-1.5 rounded-md hover:bg-slate-100/80 dark:hover:bg-slate-800/70 transition-colors group"
        >
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 font-bold flex items-center justify-center text-[11px] shrink-0">
              {initials}
            </div>
            <div className="min-w-0 truncate text-left">
              <div className="font-semibold text-slate-800 dark:text-slate-200 leading-tight truncate text-xs group-hover:text-slate-900 dark:group-hover:text-white">
                {effectiveProfile?.full_name || profileEmail || 'Học viên'}
              </div>
              <div className="text-[10px] text-slate-400 dark:text-slate-500 truncate">
                Lv.{currentLevel} · {effectiveGamification.total_xp} XP
              </div>
            </div>
          </div>
          {effectiveProfile?.plan && effectiveProfile.plan !== 'free' ? (
            <span className="px-1.5 py-0.5 rounded bg-indigo-600 text-[9px] font-bold text-white uppercase shrink-0">
              {effectiveProfile.plan}
            </span>
          ) : (
            <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 border border-slate-200/80 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700 text-[9px] font-bold uppercase shrink-0">
              {effectiveProfile ? 'Free' : '…'}
            </span>
          )}
        </Link>

        <div className="flex items-center justify-between px-1 text-[11px] text-slate-500 dark:text-slate-400 pt-0.5">
          {effectiveIsTeacher && (
            <Link
              href="/teacher"
              className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors flex items-center gap-1"
            >
              <GraduationCap className="w-3.5 h-3.5" />
              Giáo viên
            </Link>
          )}
          <Link
            href="/group"
            className="hover:text-slate-800 dark:hover:text-slate-200 transition-colors flex items-center gap-1"
          >
            <Users className="w-3.5 h-3.5" />
            Nhóm
          </Link>
          <button
            type="button"
            onClick={onSignOut}
            className="hover:text-rose-600 dark:hover:text-rose-400 transition-colors flex items-center gap-1 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            Đăng xuất
          </button>
        </div>
      </div>
    </aside>
  );
}
