import React from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AppShellLayout } from '@/components/layout/AppShellLayout';
import { AdminSystemView } from '@/features/admin/AdminSystemView';
import { AiCoachView } from '@/features/ai-coach/AiCoachView';
import { AuthCompleteView } from '@/features/auth/AuthCompleteView';
import { ProtectedRoute } from '@/features/auth/ProtectedRoute';
import { TeacherRouteGuard } from '@/features/auth/TeacherRouteGuard';
import { BillingPlansView } from '@/features/billing/BillingPlansView';
import { ChallengeCommitmentView } from '@/features/challenges/ChallengeCommitmentView';
import { DictionaryLookupView } from '@/features/dictionary/DictionaryLookupView';
import { VstepSimulatorView } from '@/features/exam-vstep/VstepSimulatorView';
import { GrammarHubView } from '@/features/grammar/GrammarHubView';
import { ReadingRoomView } from '@/features/reading/ReadingRoomView';
import { RoadmapDashboard } from '@/features/roadmap/RoadmapDashboard';
import { SocialLeaderboardView } from '@/features/social/SocialLeaderboardView';
import { SpeakingFoundationView } from '@/features/speaking-foundation/SpeakingFoundationView';
import { TeacherWorkspaceView } from '@/features/teacher/TeacherWorkspaceView';
import { ToeicArenaView } from '@/features/toeic/ToeicArenaView';
import { VocabStudyView } from '@/features/vocab/VocabStudyView';

/**
 * Declarative React Router v7 tree mapping all authenticated LingoPro SPA modules.
 * Enforces server-first authentication via ProtectedRoute (redirects unauthenticated users to /auth/login on the .NET 10 server).
 */
export const AppRouter: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<ProtectedRoute />}>
          <Route path="/app/complete" element={<AuthCompleteView />} />
          <Route element={<AppShellLayout />}>
            <Route path="/" element={<Navigate to="/app" replace />} />
            <Route path="/app" element={<RoadmapDashboard />} />
            <Route path="/student" element={<RoadmapDashboard />} />
            <Route path="/app/vocab" element={<VocabStudyView />} />
            <Route path="/app/grammar" element={<GrammarHubView />} />
            <Route path="/app/reading" element={<ReadingRoomView />} />
            <Route path="/app/dictionary" element={<DictionaryLookupView />} />
            <Route path="/app/toeic" element={<ToeicArenaView />} />
            <Route path="/app/vstep" element={<VstepSimulatorView />} />
            <Route path="/app/ai-coach" element={<AiCoachView />} />
            <Route path="/app/speaking-foundation" element={<SpeakingFoundationView />} />
            <Route path="/app/challenges" element={<ChallengeCommitmentView />} />
            <Route path="/app/social" element={<SocialLeaderboardView />} />
            <Route path="/app/billing" element={<BillingPlansView />} />
            <Route element={<TeacherRouteGuard />}>
              <Route path="/teacher" element={<TeacherWorkspaceView />} />
              <Route path="/for-teacher" element={<TeacherWorkspaceView />} />
              <Route path="/for-teachers" element={<TeacherWorkspaceView />} />
            </Route>
            <Route path="/admin" element={<AdminSystemView />} />
            <Route path="*" element={<Navigate to="/app" replace />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
};
