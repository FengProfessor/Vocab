import React, { useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { App } from '@/components/ui/Primitives';
import { MobileBottomNav } from '@/components/layout/MobileBottomNav';
import {
  STUDENT_SIDEBAR_SECTIONS,
  getRouteHeaderMeta,
  isNavItemActive,
} from '@/components/layout/studentNavConfig';
import { useDueWordsQuery } from '@/hooks/vocab/useDueWordsQuery';
import { useJoinStudyGroup } from '@/hooks/social/useJoinStudyGroup';
import { useAuthStore } from '@/stores/useAuthStore';
import { SubscriptionPlanType } from '@/types/enums/SubscriptionPlanType';
import { UserRole } from '@/types/enums/UserRole';

/**
 * Canonical Student Shell Layout ported from /src/components/student/StudentShell.tsx.
 * Preserves the exact 248px fixed white desktop sidebar, 62px sticky blurred top header,
 * mobile slide-in drawer, 5-tab mobile bottom nav, and API-powered Join Classroom modal.
 */
export const AppShellLayout: React.FC = () => {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { message } = App.useApp();

  const user = useAuthStore((state) => state.user);
  const signOut = useAuthStore((state) => state.signOut);

  const dueWordsQuery = useDueWordsQuery();
  const joinGroupMutation = useJoinStudyGroup();

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [joinClassOpen, setJoinClassOpen] = useState(false);
  const [joinClassCode, setJoinClassCode] = useState('');
  const [joinClassError, setJoinClassError] = useState('');

  const userName = user?.fullName || user?.email?.split('@')[0] || 'Học viên';
  const streak = user?.streakDays ?? 0;
  const xp = user?.totalXp ?? 0;
  const level = Math.max(1, Math.floor(xp / 100) + 1);
  const xpProgress = xp % 100;
  const dueCount = dueWordsQuery.data?.length ?? 0;
  const isPro = Boolean(
    user?.subscriptionPlan && user.subscriptionPlan !== SubscriptionPlanType.Free,
  );
  const isAdmin = user?.role === UserRole.Admin;

  const headerMeta = getRouteHeaderMeta(pathname, userName);

  const handleSignOut = () => {
    signOut();
    navigate('/auth');
  };

  const handleJoinClassroom = async () => {
    const code = joinClassCode.trim().toUpperCase();
    if (!code) {
      setJoinClassError('Vui lòng nhập mã lớp (6 ký tự)');
      return;
    }
    setJoinClassError('');
    try {
      await joinGroupMutation.mutateAsync(code);
      setJoinClassOpen(false);
      setJoinClassCode('');
      void message.success('Tham gia lớp học thành công!');
    } catch (err: unknown) {
      const errorMsg =
        err instanceof Error ? err.message : 'Mã lớp không tồn tại hoặc đã hết hạn';
      setJoinClassError(errorMsg);
    }
  };

  return (
    <div className="lp-student-shell">
      {/* ─── DESKTOP SIDEBAR (248px fixed white) ─── */}
      <aside className="lp-student-sidebar">
        {/* Brand */}
        <div
          style={{
            padding: '20px 20px 16px',
            borderBottom: '1px solid #f5f5f5',
          }}
        >
          <Link
            to="/student"
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
                letterSpacing: '-0.02em',
              }}
            >
              LingoPro
            </span>
          </Link>
        </div>

        {/* Nav items grouped by section */}
        <nav
          style={{
            flex: 1,
            padding: '12px 12px',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
            overflowY: 'auto',
          }}
        >
          {STUDENT_SIDEBAR_SECTIONS.map((section) => (
            <div
              key={section.title}
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '2px',
              }}
            >
              <div
                style={{
                  fontSize: '10px',
                  fontWeight: 800,
                  color: '#9ca3af',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  padding: '0 12px 4px',
                }}
              >
                {section.title}
              </div>
              {section.items.map((item) => {
                const active = isNavItemActive(pathname, item.matchPrefixes);
                const badgeCount =
                  item.href === '/review' && dueCount > 0 ? dueCount : item.badge;

                return (
                  <Link
                    key={item.href}
                    to={item.href}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '9px 12px',
                      borderRadius: '10px',
                      textDecoration: 'none',
                      background: active ? '#ecfdf5' : 'transparent',
                      color: active ? '#059669' : '#4b5563',
                      fontWeight: active ? 600 : 500,
                      fontSize: '13.5px',
                      transition: 'all 0.15s',
                    }}
                  >
                    <span
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                      }}
                    >
                      <span
                        style={{
                          fontSize: '16px',
                          width: '20px',
                          textAlign: 'center',
                        }}
                      >
                        {item.icon}
                      </span>
                      {item.label}
                    </span>
                    {badgeCount && badgeCount > 0 ? (
                      <span
                        style={{
                          padding: '1px 7px',
                          borderRadius: '10px',
                          fontSize: '11px',
                          fontWeight: 700,
                          background: active ? '#059669' : '#fef2f2',
                          color: active ? '#fff' : '#dc2626',
                        }}
                      >
                        {badgeCount}
                      </span>
                    ) : null}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Join Class Quick Button */}
        <div style={{ padding: '4px 12px' }}>
          <button
            type="button"
            onClick={() => {
              setJoinClassOpen(true);
              setJoinClassError('');
            }}
            style={{
              width: '100%',
              padding: '8px 12px',
              borderRadius: '10px',
              border: '1px dashed #d1d5db',
              background: '#fafafa',
              color: '#374151',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
            }}
          >
            🏫 + Tham gia lớp
          </button>
        </div>

        {/* Upgrade CTA (only for free tier) */}
        {!isPro && (
          <div style={{ padding: '8px 12px' }}>
            <Link
              to="/upgrade"
              style={{
                display: 'block',
                padding: '12px 14px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)',
                border: '1px solid #fde68a',
                textDecoration: 'none',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '4px',
                }}
              >
                <span style={{ fontSize: '15px' }}>👑</span>
                <span
                  style={{
                    fontSize: '13px',
                    fontWeight: 700,
                    color: '#92400e',
                  }}
                >
                  Nâng cấp Pro
                </span>
              </div>
              <p
                style={{
                  fontSize: '11px',
                  color: '#a16207',
                  margin: 0,
                  lineHeight: 1.4,
                }}
              >
                Mở khóa không giới hạn từ & AI
              </p>
            </Link>
          </div>
        )}

        {/* User footer inside sidebar */}
        <div
          style={{
            padding: '12px 14px',
            borderTop: '1px solid #f5f5f5',
          }}
        >
          <div
            style={{
              padding: '10px 12px',
              borderRadius: '10px',
              background: '#f9fafb',
              marginBottom: '8px',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '6px',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  minWidth: 0,
                }}
              >
                <div
                  style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '8px',
                    background: '#ecfdf5',
                    border: '1px solid #a7f3d0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '12px',
                    fontWeight: 700,
                    color: '#059669',
                    flexShrink: 0,
                  }}
                >
                  {userName[0]?.toUpperCase() || 'U'}
                </div>
                <span
                  style={{
                    fontSize: '13px',
                    fontWeight: 600,
                    color: '#111827',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {userName}
                </span>
              </div>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  color: '#059669',
                  flexShrink: 0,
                }}
              >
                Lv.{level} · {xp} XP
              </span>
            </div>
            <div
              style={{
                height: '4px',
                borderRadius: '2px',
                background: '#e5e7eb',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  height: '100%',
                  width: `${xpProgress}%`,
                  borderRadius: '2px',
                  background: '#10b981',
                  transition: 'width 0.5s ease',
                }}
              />
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0 4px',
            }}
          >
            <div style={{ display: 'flex', gap: '10px' }}>
              <Link
                to="/teacher"
                style={{
                  fontSize: '12px',
                  color: '#6b7280',
                  textDecoration: 'none',
                  fontWeight: 500,
                }}
              >
                🧑‍🏫 Giáo viên
              </Link>
              <Link
                to="/group"
                style={{
                  fontSize: '12px',
                  color: '#6b7280',
                  textDecoration: 'none',
                  fontWeight: 500,
                }}
              >
                👥 Nhóm
              </Link>
            </div>
            <button
              type="button"
              onClick={handleSignOut}
              style={{
                fontSize: '12px',
                color: '#9ca3af',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontWeight: 500,
              }}
            >
              Đăng xuất
            </button>
          </div>
        </div>
      </aside>

      {/* ─── MAIN CONTENT AREA ─── */}
      <div className="lp-student-main-wrap">
        {/* Sticky Top Header (62px) */}
        <header className="lp-student-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
            <button
              type="button"
              className="lp-mobile-menu-btn"
              onClick={() => setDrawerOpen(true)}
              aria-label="Mở menu điều hướng"
              style={{
                padding: '6px 8px',
                borderRadius: '8px',
                border: '1px solid #e5e7eb',
                background: '#fff',
                cursor: 'pointer',
                fontSize: '16px',
                color: '#374151',
                lineHeight: 1,
              }}
            >
              ☰
            </button>

            <div style={{ minWidth: 0 }}>
              <h1
                style={{
                  fontSize: '17px',
                  fontWeight: 700,
                  color: '#111827',
                  margin: 0,
                  lineHeight: 1.2,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {headerMeta.title}
              </h1>
              {headerMeta.subtitle && (
                <p
                  style={{
                    fontSize: '12px',
                    color: '#6b7280',
                    margin: 0,
                    lineHeight: 1.3,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {headerMeta.subtitle}
                </p>
              )}
            </div>
          </div>

          {/* Right actions: Teacher Portal + Dictionary + Streak + XP + Notifications + Avatar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
            <Link
              to="/teacher"
              className="lp-header-action-link"
              style={{
                padding: '6px 12px',
                borderRadius: '8px',
                background: '#eff6ff',
                border: '1px solid #bfdbfe',
                color: '#2563eb',
                textDecoration: 'none',
                fontSize: '12px',
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
              }}
            >
              🧑‍🏫 Cổng Giáo viên
            </Link>

            <Link
              to="/dictionary"
              className="lp-header-action-link"
              style={{
                padding: '6px 12px',
                borderRadius: '8px',
                background: '#f3f4f6',
                color: '#374151',
                textDecoration: 'none',
                fontSize: '12px',
                fontWeight: 600,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
              }}
            >
              📖 Từ điển
            </Link>

            {/* Streak badge */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '4px 10px',
                borderRadius: '8px',
                background: streak > 0 ? '#fff7ed' : '#f9fafb',
                border: `1px solid ${streak > 0 ? '#fed7aa' : '#e5e7eb'}`,
                fontSize: '12px',
                fontWeight: 600,
                color: streak > 0 ? '#ea580c' : '#9ca3af',
              }}
            >
              🔥 {streak}
            </div>

            {/* XP + Level badge */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '4px 10px',
                borderRadius: '8px',
                background: '#eff6ff',
                border: '1px solid #bfdbfe',
                fontSize: '12px',
                fontWeight: 600,
                color: '#2563eb',
              }}
              title={`Cấp độ ${level} (${xp} XP)`}
            >
              ⭐ {xp} XP · Lv.{level}
            </div>

            {/* Notification Bell */}
            <Link
              to="/app/notifications"
              aria-label="Thông báo"
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '9px',
                background: '#f9fafb',
                border: '1px solid #e5e7eb',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                textDecoration: 'none',
                fontSize: '15px',
              }}
            >
              🔔
            </Link>

            {/* User Profile Dropdown */}
            <div style={{ position: 'relative' }}>
              <button
                type="button"
                onClick={() => setProfileMenuOpen((v) => !v)}
                aria-label="Mở menu tài khoản"
                style={{
                  width: '34px',
                  height: '34px',
                  borderRadius: '9px',
                  background: '#ecfdf5',
                  border: '1.5px solid #a7f3d0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '13px',
                  fontWeight: 700,
                  color: '#059669',
                  cursor: 'pointer',
                  padding: 0,
                }}
              >
                {userName[0]?.toUpperCase() || 'U'}
              </button>

              {profileMenuOpen && (
                <>
                  <div
                    onClick={() => setProfileMenuOpen(false)}
                    style={{ position: 'fixed', inset: 0, zIndex: 90 }}
                  />
                  <div
                    style={{
                      position: 'absolute',
                      right: 0,
                      top: '42px',
                      width: '230px',
                      background: '#fff',
                      borderRadius: '14px',
                      border: '1px solid #e5e7eb',
                      boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
                      padding: '8px',
                      zIndex: 100,
                    }}
                  >
                    <div
                      style={{
                        padding: '8px 10px',
                        borderBottom: '1px solid #f3f4f6',
                        marginBottom: '6px',
                      }}
                    >
                      <div
                        style={{
                          fontSize: '13px',
                          fontWeight: 700,
                          color: '#111827',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {userName}
                      </div>
                      <div
                        style={{
                          fontSize: '11px',
                          color: '#6b7280',
                          marginTop: '2px',
                        }}
                      >
                        Lv.{level} · {xp} XP · 🔥 {streak} ngày
                      </div>
                    </div>

                    <Link
                      to="/student/profile"
                      onClick={() => setProfileMenuOpen(false)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '8px 10px',
                        borderRadius: '8px',
                        textDecoration: 'none',
                        color: '#374151',
                        fontSize: '13px',
                        fontWeight: 500,
                      }}
                    >
                      👤 Hồ sơ & Thống kê
                    </Link>

                    <Link
                      to="/student/leaderboard"
                      onClick={() => setProfileMenuOpen(false)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '8px 10px',
                        borderRadius: '8px',
                        textDecoration: 'none',
                        color: '#374151',
                        fontSize: '13px',
                        fontWeight: 500,
                      }}
                    >
                      🏆 Bảng xếp hạng
                    </Link>

                    <Link
                      to="/upgrade"
                      onClick={() => setProfileMenuOpen(false)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '8px 10px',
                        borderRadius: '8px',
                        textDecoration: 'none',
                        color: '#92400e',
                        fontSize: '13px',
                        fontWeight: 600,
                      }}
                    >
                      👑 Gói dịch vụ & Nâng cấp
                    </Link>

                    <Link
                      to="/teacher"
                      onClick={() => setProfileMenuOpen(false)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '8px 10px',
                        borderRadius: '8px',
                        textDecoration: 'none',
                        color: '#374151',
                        fontSize: '13px',
                        fontWeight: 500,
                      }}
                    >
                      🧑‍🏫 Dành cho Giáo viên
                    </Link>

                    {isAdmin && (
                      <Link
                        to="/admin"
                        onClick={() => setProfileMenuOpen(false)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          padding: '8px 10px',
                          borderRadius: '8px',
                          textDecoration: 'none',
                          color: '#059669',
                          fontSize: '13px',
                          fontWeight: 700,
                        }}
                      >
                        ⚙️ Quản trị hệ thống (Admin)
                      </Link>
                    )}

                    <div
                      style={{
                        borderTop: '1px solid #f3f4f6',
                        marginTop: '6px',
                        paddingTop: '6px',
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => {
                          setProfileMenuOpen(false);
                          handleSignOut();
                        }}
                        style={{
                          width: '100%',
                          textAlign: 'left',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          padding: '8px 10px',
                          borderRadius: '8px',
                          border: 'none',
                          background: 'transparent',
                          color: '#dc2626',
                          fontSize: '13px',
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        🚪 Đăng xuất
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="lp-student-content">
          <Outlet />
        </main>
      </div>

      {/* ─── MOBILE SLIDE-IN DRAWER ─── */}
      {drawerOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 200 }}>
          <div
            onClick={() => setDrawerOpen(false)}
            style={{
              position: 'absolute',
              inset: 0,
              background: 'rgba(0,0,0,0.35)',
              backdropFilter: 'blur(2px)',
            }}
          />

          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              bottom: 0,
              width: '280px',
              background: '#fff',
              boxShadow: '4px 0 24px rgba(0,0,0,0.12)',
              display: 'flex',
              flexDirection: 'column',
              zIndex: 201,
            }}
          >
            {/* Drawer Header */}
            <div
              style={{
                padding: '18px 18px 14px',
                borderBottom: '1px solid #f5f5f5',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <Link
                to="/student"
                onClick={() => setDrawerOpen(false)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  textDecoration: 'none',
                }}
              >
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '9px',
                    background: '#ecfdf5',
                    border: '1px solid #a7f3d0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 800,
                    fontSize: '14px',
                    color: '#059669',
                  }}
                >
                  L
                </div>
                <span
                  style={{
                    fontWeight: 700,
                    fontSize: '16px',
                    color: '#111827',
                  }}
                >
                  LingoPro
                </span>
              </Link>
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                style={{
                  padding: '4px 8px',
                  borderRadius: '6px',
                  border: 'none',
                  background: '#f3f4f6',
                  cursor: 'pointer',
                  fontSize: '14px',
                  color: '#6b7280',
                }}
              >
                ✕
              </button>
            </div>

            {/* User card in drawer */}
            <div
              style={{
                padding: '12px 16px',
                background: '#f9fafb',
                borderBottom: '1px solid #f0f0f0',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  style={{
                    width: '34px',
                    height: '34px',
                    borderRadius: '9px',
                    background: '#ecfdf5',
                    border: '1px solid #a7f3d0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '14px',
                    fontWeight: 700,
                    color: '#059669',
                  }}
                >
                  {userName[0]?.toUpperCase() || 'U'}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: '14px',
                      fontWeight: 600,
                      color: '#111827',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {userName}
                  </div>
                  <div style={{ fontSize: '11px', color: '#6b7280' }}>
                    Lv.{level} · {xp} XP · 🔥 {streak} ngày
                  </div>
                </div>
              </div>
            </div>

            {/* Drawer Nav grouped by section */}
            <nav
              style={{
                flex: 1,
                padding: '12px 10px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                overflowY: 'auto',
              }}
            >
              {STUDENT_SIDEBAR_SECTIONS.map((section) => (
                <div
                  key={section.title}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '2px',
                  }}
                >
                  <div
                    style={{
                      fontSize: '10px',
                      fontWeight: 800,
                      color: '#9ca3af',
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                      padding: '0 14px 4px',
                    }}
                  >
                    {section.title}
                  </div>
                  {section.items.map((item) => {
                    const active = isNavItemActive(pathname, item.matchPrefixes);
                    const badgeCount =
                      item.href === '/review' && dueCount > 0 ? dueCount : item.badge;
                    return (
                      <Link
                        key={item.href}
                        to={item.href}
                        onClick={() => setDrawerOpen(false)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '10px 14px',
                          borderRadius: '10px',
                          textDecoration: 'none',
                          background: active ? '#ecfdf5' : 'transparent',
                          color: active ? '#059669' : '#374151',
                          fontWeight: active ? 600 : 500,
                          fontSize: '14px',
                        }}
                      >
                        <span
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                          }}
                        >
                          <span style={{ fontSize: '17px' }}>{item.icon}</span>
                          {item.label}
                        </span>
                        {badgeCount && badgeCount > 0 ? (
                          <span
                            style={{
                              padding: '2px 8px',
                              borderRadius: '10px',
                              fontSize: '11px',
                              fontWeight: 700,
                              background: '#fef2f2',
                              color: '#dc2626',
                            }}
                          >
                            {badgeCount}
                          </span>
                        ) : null}
                      </Link>
                    );
                  })}
                </div>
              ))}
            </nav>

            <div style={{ padding: '4px 14px' }}>
              <button
                type="button"
                onClick={() => {
                  setDrawerOpen(false);
                  setJoinClassOpen(true);
                  setJoinClassError('');
                }}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: '10px',
                  border: '1px dashed #d1d5db',
                  background: '#fafafa',
                  color: '#374151',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                }}
              >
                🏫 + Tham gia lớp bằng mã
              </button>
            </div>

            {/* Drawer Footer */}
            <div
              style={{
                padding: '12px 14px',
                borderTop: '1px solid #f0f0f0',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
              }}
            >
              {!isPro && (
                <Link
                  to="/upgrade"
                  onClick={() => setDrawerOpen(false)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    padding: '10px',
                    borderRadius: '10px',
                    background: '#fef3c7',
                    border: '1px solid #fde68a',
                    color: '#92400e',
                    textDecoration: 'none',
                    fontSize: '13px',
                    fontWeight: 700,
                  }}
                >
                  👑 Nâng cấp Pro
                </Link>
              )}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  paddingTop: '4px',
                }}
              >
                <div style={{ display: 'flex', gap: '12px' }}>
                  <Link
                    to="/teacher"
                    onClick={() => setDrawerOpen(false)}
                    style={{
                      fontSize: '13px',
                      color: '#6b7280',
                      textDecoration: 'none',
                    }}
                  >
                    🧑‍🏫 Giáo viên
                  </Link>
                  <Link
                    to="/group"
                    onClick={() => setDrawerOpen(false)}
                    style={{
                      fontSize: '13px',
                      color: '#6b7280',
                      textDecoration: 'none',
                    }}
                  >
                    👥 Nhóm
                  </Link>
                </div>
                <button
                  type="button"
                  onClick={handleSignOut}
                  style={{
                    fontSize: '13px',
                    color: '#dc2626',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    fontWeight: 500,
                  }}
                >
                  🚪 Đăng xuất
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── JOIN CLASSROOM MODAL (API-driven) ─── */}
      {joinClassOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.45)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 300,
            padding: '20px',
          }}
          onClick={() => setJoinClassOpen(false)}
        >
          <div
            style={{
              background: '#fff',
              borderRadius: '20px',
              padding: '24px',
              maxWidth: '400px',
              width: '100%',
              boxShadow: '0 20px 60px rgba(0,0,0,0.18)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3
              style={{
                fontSize: '18px',
                fontWeight: 700,
                color: '#111827',
                margin: '0 0 6px',
              }}
            >
              🏫 Tham gia lớp học
            </h3>
            <p
              style={{
                fontSize: '13px',
                color: '#6b7280',
                margin: '0 0 16px',
                lineHeight: 1.5,
              }}
            >
              Nhập mã lớp 6 ký tự do giáo viên cung cấp để nhận từ vựng và bài tập tự động.
            </p>
            <input
              type="text"
              maxLength={8}
              value={joinClassCode}
              onChange={(e) => {
                setJoinClassCode(e.target.value.toUpperCase());
                setJoinClassError('');
              }}
              placeholder="VD: ABC123"
              style={{
                width: '100%',
                padding: '12px 14px',
                borderRadius: '12px',
                border: '1.5px solid #d1d5db',
                fontSize: '18px',
                fontWeight: 800,
                letterSpacing: '0.2em',
                textAlign: 'center',
                color: '#111827',
                outline: 'none',
                boxSizing: 'border-box',
                marginBottom: '10px',
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') void handleJoinClassroom();
              }}
              autoFocus
            />
            {joinClassError && (
              <div
                style={{
                  fontSize: '12px',
                  color: '#dc2626',
                  fontWeight: 600,
                  marginBottom: '10px',
                  textAlign: 'center',
                }}
              >
                ⚠️ {joinClassError}
              </div>
            )}
            <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
              <button
                type="button"
                onClick={() => setJoinClassOpen(false)}
                style={{
                  flex: 1,
                  padding: '10px',
                  borderRadius: '10px',
                  border: '1px solid #e5e7eb',
                  background: '#fff',
                  color: '#6b7280',
                  fontWeight: 600,
                  fontSize: '13px',
                  cursor: 'pointer',
                }}
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={() => void handleJoinClassroom()}
                disabled={joinGroupMutation.isPending}
                style={{
                  flex: 2,
                  padding: '10px',
                  borderRadius: '10px',
                  border: 'none',
                  background: '#10b981',
                  color: '#fff',
                  fontWeight: 700,
                  fontSize: '13px',
                  cursor: 'pointer',
                }}
              >
                {joinGroupMutation.isPending ? '⏳ Đang kiểm tra...' : '✅ Tham gia ngay'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MOBILE BOTTOM NAV (5 tabs) ─── */}
      <MobileBottomNav />
    </div>
  );
};
