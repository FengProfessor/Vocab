'use client';

import { useState, useRef, useEffect } from 'react';
import { Bell, BookOpen, Flame, Target, X } from 'lucide-react';
import Link from 'next/link';

interface Notification {
  id: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  href?: string;
  color: string;
}

interface NotificationBellProps {
  dueCount: number;
  grammarDueCount: number;
  streak: number;
  dailyGoalXp: number;
  dailyGoal: number;
  classroomId: string | null;
}

export function NotificationBell({
  dueCount,
  grammarDueCount,
  streak,
  dailyGoalXp,
  dailyGoal,
  classroomId,
}: NotificationBellProps) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Đóng dropdown khi click ngoài
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Tính toán notifications từ business logic — không cần bảng DB riêng
  const notifications: Notification[] = [];

  if (dueCount > 0) {
    notifications.push({
      id: 'due-words',
      icon: <BookOpen className="h-4 w-4" />,
      title: `${dueCount} từ cần ôn hôm nay`,
      description: 'Đừng để streak bị gãy!',
      href: classroomId ? `/flashcard?class=${classroomId}` : '/flashcard',
      color: 'text-amber-500 bg-amber-500/10',
    });
  }

  if (grammarDueCount > 0) {
    notifications.push({
      id: 'grammar-due',
      icon: <Target className="h-4 w-4" />,
      title: `${grammarDueCount} bài ngữ pháp cần ôn`,
      description: 'Ôn tập để củng cố kiến thức',
      href: '/grammar/learn',
      color: 'text-indigo-500 bg-indigo-500/10',
    });
  }

  if (streak >= 3 && dailyGoalXp < dailyGoal) {
    notifications.push({
      id: 'streak-protect',
      icon: <Flame className="h-4 w-4" />,
      title: `Streak ${streak} ngày — bảo vệ ngay!`,
      description: `Còn ${dailyGoal - dailyGoalXp} XP nữa để đạt mục tiêu hôm nay`,
      href: classroomId ? `/flashcard?class=${classroomId}` : '/flashcard',
      color: 'text-orange-500 bg-orange-500/10',
    });
  }

  if (notifications.length === 0) {
    notifications.push({
      id: 'all-done',
      icon: <BookOpen className="h-4 w-4" />,
      title: 'Tất cả đã hoàn thành!',
      description: 'Không có việc gì cần làm hôm nay 🎉',
      color: 'text-emerald-500 bg-emerald-500/10',
    });
  }

  const unreadCount = [dueCount > 0, grammarDueCount > 0, streak >= 3 && dailyGoalXp < dailyGoal].filter(Boolean).length;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setIsOpen((v) => !v)}
        className="relative p-2 hover:bg-muted rounded-full transition-colors shrink-0"
        aria-label="Thông báo"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 min-w-[16px] h-4 bg-rose-500 text-white text-[10px] font-black rounded-full flex items-center justify-center px-0.5 leading-none">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-background border rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/40">
            <span className="font-black text-sm">Thông báo</span>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 hover:bg-muted rounded-lg transition-colors"
            >
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>

          <div className="divide-y max-h-80 overflow-y-auto">
            {notifications.map((n) => {
              const inner = (
                <div className="flex items-start gap-3 px-4 py-3 hover:bg-muted/40 transition-colors cursor-pointer">
                  <span className={`mt-0.5 p-1.5 rounded-lg shrink-0 ${n.color}`}>{n.icon}</span>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-foreground leading-snug">{n.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{n.description}</p>
                  </div>
                </div>
              );

              return n.href ? (
                <Link key={n.id} href={n.href} onClick={() => setIsOpen(false)}>
                  {inner}
                </Link>
              ) : (
                <div key={n.id}>{inner}</div>
              );
            })}
          </div>

          <div className="px-4 py-2 border-t bg-muted/20">
            <p className="text-[10px] text-muted-foreground text-center">
              Thông báo dựa trên tiến độ học của bạn
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
