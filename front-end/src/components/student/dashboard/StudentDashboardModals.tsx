import dynamic from '@/shared/ui/dynamic';
import { Loader2, UserPlus, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { Word } from '@/lib/supabase';
import { parseIpa } from '@/lib/study';
import type { MilestonePopupPayload } from '@/components/gamification/MilestonePopup';
import { ActionSelectionModal, type ActionSelectionType } from '@/components/student/ActionSelectionModal';

const WordDetailModal = dynamic(
  () => import('@/components/student/WordDetailModal').then((m) => m.WordDetailModal),
  { ssr: false },
);
const MilestonePopup = dynamic(
  () => import('@/components/gamification/MilestonePopup').then((m) => m.MilestonePopup),
  { ssr: false },
);

export interface StudentDashboardModalsProps {
  milestonePopup: MilestonePopupPayload | null;
  onCloseMilestonePopup: () => void;
  selectedWordId: string | null;
  onCloseWordDetail: () => void;
  onWordDeleted: (deletedId: string) => void;
  selectedWord: Word | null;
  onCloseMeaningSelector: () => void;
  onUpdateMeaning: (wordId: string, translation: string, pos: string, ipa?: string) => void;
  isJoinModalOpen: boolean;
  isJoining: boolean;
  joinCode: string;
  joinError: string | null;
  onCloseJoinModal: () => void;
  onJoinCodeChange: (code: string) => void;
  onJoinClassroom: () => void;
  actionModalType: ActionSelectionType | null;
  onCloseActionModal: () => void;
  reviewDueCount: number;
  newCount: number;
  currentClassScope: string;
}

export function StudentDashboardModals({
  milestonePopup,
  onCloseMilestonePopup,
  selectedWordId,
  onCloseWordDetail,
  onWordDeleted,
  selectedWord,
  onCloseMeaningSelector,
  onUpdateMeaning,
  isJoinModalOpen,
  isJoining,
  joinCode,
  joinError,
  onCloseJoinModal,
  onJoinCodeChange,
  onJoinClassroom,
  actionModalType,
  onCloseActionModal,
  reviewDueCount,
  newCount,
  currentClassScope,
}: StudentDashboardModalsProps) {
  return (
    <>
      <MilestonePopup
        open={!!milestonePopup}
        payload={milestonePopup}
        onClose={onCloseMilestonePopup}
      />

      <WordDetailModal
        wordId={selectedWordId}
        onClose={onCloseWordDetail}
        onDeleted={onWordDeleted}
      />

      {selectedWord && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={onCloseMeaningSelector} />
          <div className="relative w-full max-w-xl bg-background rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b flex items-center justify-between bg-primary/5">
              <div>
                <h3 className="text-2xl font-black text-primary uppercase tracking-tight">{selectedWord.word}</h3>
                <p className="text-xs font-bold text-muted-foreground">Select the correct meaning to study</p>
              </div>
              <button
                onClick={onCloseMeaningSelector}
                className="p-2 hover:bg-black/5 rounded-full transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="p-6 max-h-[60vh] overflow-y-auto space-y-4">
              {(selectedWord.dictionary_data as unknown as Array<{
                pos?: string;
                pronunciations?: { ipa?: string }[];
                definitions: Array<{ definition: string; pos?: string; example?: string }>;
              }> | null | undefined)?.map((entry, eIdx) => (
                <div key={eIdx} className="space-y-3">
                  {entry.definitions.map((def, dIdx) => (
                    <button
                      key={`${eIdx}-${dIdx}`}
                      onClick={() =>
                        onUpdateMeaning(selectedWord.id, def.definition, def.pos || '', entry.pronunciations?.[0]?.ipa)
                      }
                      className="w-full text-left p-4 rounded-2xl border-2 border-transparent hover:border-primary hover:bg-primary/5 transition-all group"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="text-[10px] font-black uppercase text-primary border-primary/20">
                          {def.pos || entry.pos || 'Word'}
                        </Badge>
                        {entry.pronunciations?.[0]?.ipa && (
                          <span className="text-xs font-bold text-muted-foreground font-mono">
                            {parseIpa(entry.pronunciations[0].ipa)}
                          </span>
                        )}
                      </div>
                      <p className="font-bold text-slate-800 mb-2 leading-relaxed">
                        {def.definition}
                      </p>
                      {def.example && (
                        <p className="text-xs font-medium text-slate-500 italic">
                          &quot;{def.example}&quot;
                        </p>
                      )}
                    </button>
                  ))}
                </div>
              ))}
            </div>

            <div className="p-6 bg-slate-50 border-t flex justify-end">
              <button
                onClick={onCloseMeaningSelector}
                className="px-6 py-2 font-black text-slate-500 hover:text-slate-700"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {isJoinModalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div
            className="absolute inset-0"
            onClick={() => {
              if (!isJoining) onCloseJoinModal();
            }}
          />
          <div className="relative bg-slate-900 border border-white/10 rounded-2xl p-6 w-80 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-black text-white flex items-center gap-2">
                <UserPlus className="h-5 w-5 text-primary" /> Tham gia lớp học
              </h3>
              <button
                onClick={() => {
                  if (!isJoining) onCloseJoinModal();
                }}
                className="p-1 hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="h-5 w-5 text-white/60" />
              </button>
            </div>
            <p className="text-sm text-white/50 mb-4">Nhập mã lớp do giáo viên cung cấp (VD: ABC123)</p>
            <input
              type="text"
              value={joinCode}
              onChange={(e) => onJoinCodeChange(e.target.value.toUpperCase())}
              onKeyDown={(e) => {
                if (e.key === 'Enter') onJoinClassroom();
              }}
              placeholder="Mã lớp..."
              maxLength={12}
              autoFocus
              className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder:text-white/30 font-mono text-lg tracking-widest uppercase focus:outline-none focus:ring-2 focus:ring-primary/50 mb-3"
            />
            {joinError && <p className="text-rose-400 text-sm font-semibold mb-3">{joinError}</p>}
            <button
              onClick={onJoinClassroom}
              disabled={!joinCode.trim() || isJoining}
              className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-black text-sm hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
