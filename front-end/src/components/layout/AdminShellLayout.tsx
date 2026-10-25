import React from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/stores/useAuthStore';

interface AdminNavItem {
  href: string;
  label: string;
  shortLabel: string;
  exact?: boolean;
}

const ADMIN_NAV_ITEMS: AdminNavItem[] = [
  { href: '/admin', label: '📊 Tổng quan', shortLabel: 'Tổng quan', exact: true },
  { href: '/admin/crm', label: '👥 CRM Học viên', shortLabel: 'CRM' },
  { href: '/admin/billing', label: '💳 Đơn hàng & Doanh thu', shortLabel: 'Đơn hàng' },
  { href: '/admin/challenges', label: '🏆 Thử thách', shortLabel: 'Thử thách' },
  { href: '/admin/pilot-leads', label: '🚀 Lead thử nghiệm', shortLabel: 'Pilot Leads' },
];

/**
 * Canonical Admin Portal Shell Layout ported from /src/app/admin/layout.tsx.
 * Preserves the exact top header with "LingoPro Quản Trị + Portal" badge,
 * center navigation tabs, mobile sub-tabs, and "Về Học viên" quick return button.
 */
export const AdminShellLayout: React.FC = () => {
  const { pathname } = useLocation();
  const user = useAuthStore((state) => state.user);
  const displayName = user?.fullName || user?.email?.split('@')[0] || 'Quản trị viên';

  const isActive = (item: AdminNavItem) => {
    if (item.exact) {
      return pathname === '/admin' || pathname === '/app/admin';
    }
    return pathname === item.href || pathname.startsWith(item.href + '/');
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#f9fafb',
        color: '#111827',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}
    >
      {/* Top Navbar */}
      <header
        style={{
          background: '#fff',
          borderBottom: '1px solid #f0f0f0',
          position: 'sticky',
          top: 0,
          zIndex: 50,
        }}
      >
        <div
          style={{
            maxWidth: '1280px',
            margin: '0 auto',
            padding: '0 24px',
            height: '64px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px',
          }}
        >
          {/* Brand */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: '#ecfdf5',
                border: '1px solid #a7f3d0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#059669',
                fontWeight: 800,
                fontSize: '15px',
                boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
              }}
            >
              L
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span
                style={{
                  fontWeight: 700,
                  fontSize: '18px',
                  color: '#111827',
                  letterSpacing: '-0.02em',
                }}
              >
                LingoPro <span style={{ color: '#059669' }}>Quản Trị</span>
              </span>
              <span
                style={{
                  fontSize: '10px',
                  textTransform: 'uppercase',
                  fontWeight: 800,
                  letterSpacing: '0.08em',
                  padding: '2px 8px',
                  borderRadius: '6px',
                  background: '#f3f4f6',
                  color: '#6b7280',
                  border: '1px solid #e5e7eb',
                }}
              >
                Portal
              </span>
            </div>
          </div>

          {/* Center Nav Links */}
          <nav
            className="lp-header-action-link"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            {ADMIN_NAV_ITEMS.map((item) => {
              const active = isActive(item);
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 14px',
                    borderRadius: '10px',
                    fontSize: '13.5px',
                    fontWeight: active ? 700 : 500,
                    color: active ? '#059669' : '#4b5563',
                    background: active ? '#ecfdf5' : 'transparent',
                    textDecoration: 'none',
                    transition: 'all 0.15s',
                  }}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Right User / Back to App */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <Link
              to="/student"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '12.5px',
                fontWeight: 600,
                color: '#4b5563',
                background: '#f9fafb',
                padding: '7px 12px',
                borderRadius: '8px',
                border: '1px solid #e5e7eb',
                textDecoration: 'none',
              }}
            >
              ← Về Học viên
            </Link>

            <div
              style={{
                height: '24px',
                width: '1px',
                background: '#e5e7eb',
              }}
            />

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: '#ecfdf5',
                  border: '1px solid #a7f3d0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#059669',
                  fontWeight: 700,
                  fontSize: '13px',
                }}
              >
                {displayName[0]?.toUpperCase() || 'A'}
              </div>
              <span
                style={{
                  fontSize: '13.5px',
                  fontWeight: 600,
                  color: '#374151',
                  maxWidth: '150px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {displayName}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main
        style={{
          maxWidth: '1280px',
          margin: '0 auto',
          padding: '32px 24px',
        }}
      >
        <Outlet />
      </main>
    </div>
  );
};
