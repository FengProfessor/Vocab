import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { UserRole } from '@/types/enums/UserRole';
import { RouteLoadingFallback } from '@/components/common/RouteLoadingFallback';
import { AppShellLayout } from '@/components/layout/AppShellLayout';
import { ProtectedRoute } from '@/features/auth/ProtectedRoute';
import { RoleRouteGuard } from '@/features/auth/components/RoleRouteGuard';

// Lazy-loaded route views for optimized code splitting and low initial bundle size
const AuthPage = lazy(() =>
  import('@/features/auth/AuthPage').then((m) => ({ default: m.AuthPage })),
);
const GoogleCallbackView = lazy(() =>
  import('@/features/auth/GoogleCallbackView').then((m) => ({ default: m.GoogleCallbackView })),
);
const AuthCompleteView = lazy(() =>
  import('@/features/auth/AuthCompleteView').then((m) => ({ default: m.AuthCompleteView })),
);
const RoadmapDashboard = lazy(() =>
  import('@/features/roadmap/RoadmapDashboard').then((m) => ({ default: m.RoadmapDashboard })),
);
const VocabStudyView = lazy(() =>
  import('@/features/vocab/VocabStudyView').then((m) => ({ default: m.VocabStudyView })),
);
const GrammarHubView = lazy(() =>
  import('@/features/grammar/GrammarHubView').then((m) => ({ default: m.GrammarHubView })),
);
const ReadingRoomView = lazy(() =>
  import('@/features/reading/ReadingRoomView').then((m) => ({ default: m.ReadingRoomView })),
);
const DictionaryLookupView = lazy(() =>
  import('@/features/dictionary/DictionaryLookupView').then((m) => ({
    default: m.DictionaryLookupView,
  })),
);
const ToeicArenaView = lazy(() =>
  import('@/features/toeic/ToeicArenaView').then((m) => ({ default: m.ToeicArenaView })),
);
const VstepSimulatorView = lazy(() =>
  import('@/features/exam-vstep/VstepSimulatorView').then((m) => ({
    default: m.VstepSimulatorView,
  })),
);
const AiCoachView = lazy(() =>
  import('@/features/ai-coach/AiCoachView').then((m) => ({ default: m.AiCoachView })),
);
const SpeakingFoundationView = lazy(() =>
  import('@/features/speaking-foundation/SpeakingFoundationView').then((m) => ({
    default: m.SpeakingFoundationView,
  })),
);
const ChallengeCommitmentView = lazy(() =>
  import('@/features/challenges/ChallengeCommitmentView').then((m) => ({
    default: m.ChallengeCommitmentView,
  })),
);
const SocialLeaderboardView = lazy(() =>
  import('@/features/social/SocialLeaderboardView').then((m) => ({
    default: m.SocialLeaderboardView,
  })),
);
const BillingPlansView = lazy(() =>
  import('@/features/billing/BillingPlansView').then((m) => ({ default: m.BillingPlansView })),
);
const TeacherWorkspaceView = lazy(() =>
  import('@/features/teacher/TeacherWorkspaceView').then((m) => ({
    default: m.TeacherWorkspaceView,
  })),
);
const AdminSystemView = lazy(() =>
  import('@/features/admin/AdminSystemView').then((m) => ({ default: m.AdminSystemView })),
);

/** Roles allowed into the teacher portal. */
const TEACHER_ROLES: readonly UserRole[] = [UserRole.Teacher, UserRole.Admin];

/** Roles allowed into the admin console. */
const ADMIN_ROLES: readonly UserRole[] = [UserRole.Admin];

/**
 * Declarative React Router v7 tree mapping all authenticated LingoPro SPA modules.
 * Incorporates React.lazy and Suspense for optimized chunk splitting.
 */
export const AppRouter: React.FC = () => {
  return (
    <BrowserRouter>
      <Suspense fallback={<RouteLoadingFallback />}>
        <Routes>
          <Route path="/auth" element={<Navigate to="/auth/login" replace />} />
          <Route path="/auth/login" element={<AuthPage />} />
          <Route path="/auth/register" element={<AuthPage />} />
          <Route path="/auth/callback" element={<GoogleCallbackView />} />
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
              <Route element={<RoleRouteGuard allowedRoles={TEACHER_ROLES} />}>
                <Route path="/teacher" element={<TeacherWorkspaceView />} />
                <Route path="/for-teacher" element={<TeacherWorkspaceView />} />
                <Route path="/for-teachers" element={<TeacherWorkspaceView />} />
              </Route>
              <Route element={<RoleRouteGuard allowedRoles={ADMIN_ROLES} />}>
                <Route path="/admin" element={<AdminSystemView />} />
              </Route>
              <Route path="*" element={<Navigate to="/app" replace />} />
            </Route>
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
};
