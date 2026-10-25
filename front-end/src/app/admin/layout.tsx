import type { ReactNode } from 'react';
import Link from 'next/link';
import { GraduationCap } from 'lucide-react';

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-100 flex flex-col">
      {/* Admin Shell Header */}
      <header className="sticky top-0 z-40 border-b border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex h-14 items-center justify-between gap-4">
          {/* Left Brand & Title */}
          <div className="flex items-center gap-3">
            <Link href="/admin" className="flex items-center gap-2 font-black text-slate-900 dark:text-white">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600 text-white font-black text-xs shadow-xs">
                A
              </span>
              <span className="text-sm font-extrabold tracking-tight">LingoPro Quản Trị</span>
            </Link>
            <span className="hidden sm:inline-block text-xs font-mono px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/60 font-semibold">
              Portal
            </span>
          </div>

          {/* Center Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 text-xs font-semibold">
            <Link
              href="/admin"
              className="px-3 py-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Tổng quan
            </Link>
            <Link
              href="/admin/crm"
              className="px-3 py-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              CRM Học viên
            </Link>
            <Link
              href="/admin/billing"
              className="px-3 py-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Đơn hàng & Doanh thu
            </Link>
            <Link
              href="/admin/challenges"
              className="px-3 py-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Thử thách
            </Link>
            <Link
              href="/admin/pilot-leads"
              className="px-3 py-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Lead thử nghiệm
            </Link>
          </nav>

          {/* Right Action */}
          <div className="flex items-center gap-2">
            <Link
              href="/student"
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors"
            >
              <GraduationCap className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
              <span>Về Học viên</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Sub-header on mobile: quick scrollable tabs */}
      <div className="md:hidden overflow-x-auto border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-1.5 flex gap-1 text-xs font-semibold whitespace-nowrap scrollbar-none">
        <Link href="/admin" className="px-2.5 py-1 rounded-md text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">
          Tổng quan
        </Link>
        <Link href="/admin/crm" className="px-2.5 py-1 rounded-md text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">
          CRM
        </Link>
        <Link href="/admin/billing" className="px-2.5 py-1 rounded-md text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">
          Billing
        </Link>
        <Link href="/admin/challenges" className="px-2.5 py-1 rounded-md text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">
          Thử thách
        </Link>
        <Link href="/admin/pilot-leads" className="px-2.5 py-1 rounded-md text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">
          Leads
        </Link>
      </div>

      <div className="flex-1">
        {children}
      </div>
    </div>
  );
}
