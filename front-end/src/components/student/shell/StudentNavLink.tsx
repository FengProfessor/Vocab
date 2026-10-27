import Link from '@/shared/router/navigation';
import { ChevronDown } from 'lucide-react';
import type { StudentNavItem } from '@/lib/student-nav';
import { cn } from '@/lib/utils';

export function onboardingIdFor(href: string): string | undefined {
  if (href.startsWith('/grammar')) return 'grammar';
  if (href.startsWith('/library')) return 'library';
  if (href.startsWith('/journey')) return 'journey';
  if (href.startsWith('/dictionary')) return 'dictionary';
  if (href.startsWith('/review')) return 'nav-review';
  if (href.startsWith('/import')) return 'import';
  if (href.startsWith('/practice')) return 'practice-hub';
  if (href.startsWith('/toeic')) return 'toeic';
  return undefined;
}

export interface StudentNavLinkProps {
  item: StudentNavItem;
  active: boolean;
  pathname: string;
  isPracticeSubOpen: boolean;
  onTogglePracticeSub: () => void;
  onClick?: () => void;
}

export function StudentNavLink({
  item,
  active,
  pathname,
  isPracticeSubOpen,
  onTogglePracticeSub,
  onClick,
}: StudentNavLinkProps) {
  const Icon = item.icon;
  const hasSubItems = Boolean(item.children && item.children.length > 0);

  if (hasSubItems && item.children) {
    return (
      <div className="space-y-1">
        <button
          type="button"
          data-onboarding={item.onboardingId || onboardingIdFor(item.href)}
          onClick={onTogglePracticeSub}
          aria-expanded={isPracticeSubOpen}
          className={cn(
            'group flex min-h-[34px] w-full items-center justify-between rounded-md px-2.5 py-1.5 text-left text-[13px] transition-all cursor-pointer',
            active
              ? 'bg-indigo-50/60 font-semibold text-indigo-700 dark:bg-[#20253F]/70 dark:text-[#B3A8FF]'
              : 'font-medium text-slate-600 hover:bg-slate-100/70 hover:text-slate-900 dark:text-[#A5AAC6] dark:hover:bg-[#20253F] dark:hover:text-[#F2F3FB]',
          )}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <Icon
              className={cn(
                'h-4 w-4 shrink-0 transition-colors',
                active
                  ? 'text-indigo-600 dark:text-[#B3A8FF]'
                  : 'text-slate-500 group-hover:text-slate-700 dark:text-[#A5AAC6] dark:group-hover:text-[#F2F3FB]',
              )}
              strokeWidth={active ? 2 : 1.75}
            />
            <span className="truncate">{item.label}</span>
          </div>

          <ChevronDown
            className={cn(
              'h-3.5 w-3.5 shrink-0 text-slate-400 transition-transform duration-200 dark:text-[#A5AAC6]',
              isPracticeSubOpen && 'rotate-180',
            )}
          />
        </button>

        {isPracticeSubOpen && (
          <div
            role="group"
            aria-label="Danh mục con Trung tâm Luyện tập"
            className="ml-3.5 flex flex-col gap-0.5 border-l border-slate-200 pl-2 py-0.5 dark:border-[#272C47]"
          >
            {item.children.map((sub) => {
              const subActive = sub.match(pathname);
              const SubIcon = sub.icon;
              return (
                <Link
                  key={sub.href}
                  href={sub.href}
                  onClick={onClick}
                  title={sub.desc}
                  aria-current={subActive ? 'page' : undefined}
                  className={cn(
                    'group flex min-h-[32px] items-center justify-between gap-2 rounded-md px-2 py-1 text-[12.5px] transition-all',
                    subActive
                      ? 'bg-indigo-50/80 font-semibold text-indigo-700 dark:bg-[#20253F] dark:text-[#B3A8FF]'
                      : 'font-medium text-slate-600 hover:bg-slate-100/70 hover:text-slate-900 dark:text-[#A5AAC6] dark:hover:bg-[#20253F] dark:hover:text-[#F2F3FB]',
                  )}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <SubIcon
                      className={cn(
                        'h-3.5 w-3.5 shrink-0 transition-colors',
                        subActive
                          ? 'text-indigo-600 dark:text-[#B3A8FF]'
                          : 'text-slate-500 group-hover:text-slate-700 dark:text-[#A5AAC6] dark:group-hover:text-[#F2F3FB]',
                      )}
                      strokeWidth={subActive ? 2 : 1.75}
                    />
                    <span className="truncate">{sub.label}</span>
                  </div>
                  {subActive && (
                    <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-600 dark:bg-[#7B67FF]" />
                  )}
                </Link>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  return (
    <Link
      href={item.href}
      data-onboarding={item.onboardingId || onboardingIdFor(item.href)}
      onClick={onClick}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'group flex min-h-[34px] items-center justify-between rounded-md px-2.5 py-1.5 text-[13px] transition-all',
        active
          ? 'bg-indigo-50/80 font-semibold text-indigo-700 dark:bg-[#20253F] dark:text-[#B3A8FF]'
          : 'font-medium text-slate-600 hover:bg-slate-100/70 hover:text-slate-900 dark:text-[#A5AAC6] dark:hover:bg-[#20253F] dark:hover:text-[#F2F3FB]',
      )}
    >
      <div className="flex items-center gap-2.5 min-w-0">
        <Icon
          className={cn(
            'h-4 w-4 shrink-0 transition-colors',
            active
              ? 'text-indigo-600 dark:text-[#B3A8FF]'
              : 'text-slate-500 group-hover:text-slate-700 dark:text-[#A5AAC6] dark:group-hover:text-[#F2F3FB]',
          )}
          strokeWidth={active ? 2 : 1.75}
        />
        <span className="truncate">{item.label}</span>
      </div>

      {item.badge !== undefined && item.badge !== null ? (
        <span
          className={cn(
            'ml-auto shrink-0 rounded px-1.5 py-0.2 text-[10px] font-bold',
            item.href === '/toeic'
              ? 'bg-amber-50 text-amber-700 border border-amber-200/80 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800'
              : item.href === '/vstep'
                ? 'bg-blue-50 text-blue-700 border border-blue-200/80 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800'
                : 'bg-indigo-50 text-indigo-600 border border-indigo-100 dark:bg-[#20253F] dark:text-[#B3A8FF] dark:border-[#272C47]',
          )}
        >
          {item.badge}
        </span>
      ) : active ? (
        <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 dark:bg-[#7B67FF] shrink-0 ml-1.5" />
      ) : null}
    </Link>
  );
}
