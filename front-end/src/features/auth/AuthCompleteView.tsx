import React, { useEffect, useRef } from 'react';
import { Spin, Typography } from 'antd';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { apiClient } from '@/lib/apiClient';
import { ReferralTracker } from '@/lib/auth/ReferralTracker';
import { safeInternalRedirect } from '@/lib/auth/safeInternalRedirect';
import { useAuthStore } from '@/stores/useAuthStore';
import { UserRole } from '@/types/enums/UserRole';

/** Maximum time the landing is delayed waiting for the best-effort referral claim (matches the original 1200ms). */
const REFERRAL_CLAIM_BUDGET_MS = 1200;

/**
 * Post-login completion step — port of the original /auth/complete page.
 * The server has already issued the HttpOnly session cookies and redirected here with a sanitized `next`
 * path and the requested `role`. This view claims a pending referral attribution (best effort), then
 * lands the user on `next` or their role's home. It runs inside ProtectedRoute, so the cookie session
 * is verified before anything happens.
 */
export const AuthCompleteView: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const user = useAuthStore((state) => state.user);
  const hasRun = useRef(false);

  useEffect(() => {
    if (hasRun.current || !user) {
      return;
    }
    hasRun.current = true;

    const claimReferral = async (): Promise<void> => {
      const referralCode = ReferralTracker.getStoredCode();
      if (!referralCode) {
        return;
      }

      try {
        await Promise.race([
          apiClient
            .post('/social/referrals/claim', { referralCode })
            .then(() => ReferralTracker.clear())
            .catch((error: { response?: { status?: number } }) => {
              // A 4xx (unknown code, self-referral) is permanent; a network error keeps the code for later.
              const status = error.response?.status;
              if (status && status >= 400 && status < 500) {
                ReferralTracker.clear();
              }
            }),
          new Promise<void>((resolve) => setTimeout(resolve, REFERRAL_CLAIM_BUDGET_MS)),
        ]);
      } catch {
        // Attribution is best effort and must never block the learner.
      }
    };

    void claimReferral().then(() => {
      const isTeacher = searchParams.get('role') === 'teacher' || user.role === UserRole.Teacher;
      const fallback = isTeacher ? '/teacher' : '/app';
      navigate(safeInternalRedirect(searchParams.get('next'), fallback), { replace: true });
    });
  }, [navigate, searchParams, user]);

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        background: '#f6efe6',
      }}
    >
      <Spin size="large" />
      <Typography.Text strong style={{ color: '#5e4b40' }}>
        Đang vào học…
      </Typography.Text>
    </div>
  );
};
