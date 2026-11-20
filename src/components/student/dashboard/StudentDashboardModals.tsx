'use client';

import dynamic from 'next/dynamic';
import { Loader2, UserPlus, X } from 'lucide-react';
import type { MilestonePopupPayload } from '@/components/gamification/MilestonePopup';
import {
  ActionSelectionModal,
  type ActionSelectionType,
} from '@/components/student/ActionSelectionModal';

const MilestonePopup = dynamic(
  () => import('@/components/gamification/MilestonePopup').then((m) => m.MilestonePopup),
  { ssr: false },
);

interface StudentDashboardModalsProps {
  milestonePopup: MilestonePopupPayload | null;
  onCloseMilestone: () => void;
  isJoinModalOpen: boolean;
  joinCode: string;
  isJoining: boolean;
  joinError: string | null;
  onChangeJoinCode: (code: string) => void;
  onCloseJoinModal: () => void;
  onSubmitJoinClassroom: () => void;
  actionModalType: ActionSelectionType | null;
  onCloseActionModal: () => void;
  reviewDueCount: number;
  newCount: number;
  currentClassScope: string;
}

export function StudentDashboardModals({
  milestonePopup,
  onCloseMilestone,
  isJoinModalOpen,
  joinCode,
  isJoining,
  joinError,
  onChangeJoinCode,
  onCloseJoinModal,
  onSubmitJoinClassroom,
  actionModalType,
  onCloseActionModal,
  reviewDueCount,
  newCount,
  currentClassScope,
}: StudentDashboardModalsProps) {
  return (
    <>
      <MilestonePopup
        open={Boolean(milestonePopup)}
        payload={milestonePopup}
        onClose={onCloseMilestone}
      />

      {isJoinModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div
            className="absolute inset-0"
            onClick={() => {
              if (!isJoining) onCloseJoinModal();
            }}
          />
          <div className="relative w-80 rounded-2xl border border-white/10 bg-slate-900 p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="mb-5 flex items-center justify-between">
              <h3 className="flex items-center gap-2 text-lg font-black text-white">
                <UserPlus className="h-5 w-5 text-primary" /> Tham gia lớp học
              </h3>
              <button
                type="button"
                onClick={() => {
                  if (!isJoining) onCloseJoinModal();
                }}
                className="rounded-lg p-1 transition-colors hover:bg-white/10"
                aria-label="Đóng"
              >
                <X className="h-5 w-5 text-white/60" />
              </button>
            </div>
            <p className="mb-4 text-sm text-white/50">
              Nhập mã lớp do giáo viên cung cấp (VD: ABC123)
            </p>
            <input
              type="text"
              value={joinCode}
              onChange={(e) => onChangeJoinCode(e.target.value.toUpperCase())}
              onKeyDown={(e) => {
                if (e.key === 'Enter') onSubmitJoinClassroom();
              }}
              placeholder="Mã lớp..."
              maxLength={12}
              autoFocus
              className="mb-3 w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 font-mono text-lg uppercase tracking-widest text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
            {joinError && (
              <p className="mb-3 text-sm font-semibold text-rose-400">{joinError}</p>
            )}
            <button
              type="button"
              onClick={onSubmitJoinClassroom}
              disabled={!joinCode.trim() || isJoining}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-black text-primary-foreground transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isJoining ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Đang tham gia...
                </>
              ) : (
                'Tham gia'
              )}
            </button>
          </div>
        </div>
      )}

      <ActionSelectionModal
        type={actionModalType}
        onClose={onCloseActionModal}
        reviewDueCount={reviewDueCount}
        newCount={newCount}
        currentClassScope={currentClassScope}
      />
    </>
  );
}
