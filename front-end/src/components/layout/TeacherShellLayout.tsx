import React from 'react';
import { Link, Outlet, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/useAuthStore';

/**
 * Canonical Teacher Portal Shell Layout ported from /src/app/teacher/page.tsx.
 * Preserves the exact top header with "LingoPro + GIÁO VIÊN" badge and "← Chế độ học sinh" link.
 */
export const TeacherShellLayout: React.FC = () => {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const signOut = useAuthStore((state) => state.signOut);
  const displayName = user?.fullName || user?.email?.split('@')[0] || 'Giáo viên';

  const handleSignOut = () => {
    signOut();
    navigate('/auth');
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#fafaf9',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}
    >
      {/* Top Bar */}
      <header
        style={{
          background: '#fff',
          borderBottom: '1px solid #f0f0f0',
          padding: '0 28px',
          height: '60px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'sticky',
          top: 0,
          zIndex: 50,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <Link
            to="/teacher"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              textDecoration: 'none',
            }}
          >
            <div
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '10px',
                background: '#ecfdf5',
                border: '1px solid #a7f3d0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
                fontSize: '15px',
                color: '#059669',
              }}
            >
              L
            </div>
            <span
              style={{
                fontWeight: 700,
                fontSize: '17px',
                color: '#111827',
              }}
            >
              LingoPro
            </span>
          </Link>
          <span
            style={{
              padding: '3px 10px',
              borderRadius: '8px',
              background: '#eff6ff',
              color: '#2563eb',
              fontSize: '11px',
              fontWeight: 700,
              border: '1px solid #bfdbfe',
            }}
          >
            GIÁO VIÊN
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Link
            to="/student"
            style={{
              fontSize: '13px',
              color: '#374151',
              textDecoration: 'none',
              fontWeight: 600,
              padding: '7px 14px',
              borderRadius: '9px',
              background: '#f9fafb',
              border: '1px solid #e5e7eb',
            }}
          >
            ← Chế độ học sinh
          </Link>
          <span
            style={{
              fontSize: '13px',
              fontWeight: 600,
              color: '#374151',
            }}
          >
            🧑‍🏫 {displayName}
          </span>
          <button
            type="button"
            onClick={handleSignOut}
            style={{
              padding: '6px 12px',
              borderRadius: '8px',
              border: '1px solid #e5e7eb',
              background: '#fff',
              cursor: 'pointer',
              fontSize: '12px',
              color: '#6b7280',
              fontWeight: 500,
            }}
          >
            Đăng xuất
          </button>
        </div>
      </header>

      <main
        style={{
          maxWidth: '1180px',
          margin: '0 auto',
          padding: '28px 24px',
        }}
      >
        <Outlet />
      </main>
    </div>
  );
};
