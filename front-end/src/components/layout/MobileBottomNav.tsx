import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { MOBILE_BOTTOM_TABS, isNavItemActive } from '@/components/layout/studentNavConfig';

/**
 * Sticky 5-tab mobile bottom navigation bar ported from /src/components/student/MobileBottomNav.tsx.
 * Features an elevated emerald center CTA button for "Lộ trình".
 */
export const MobileBottomNav: React.FC = () => {
  const { pathname } = useLocation();

  return (
    <nav className="lp-mobile-bottom-nav" aria-label="Điều hướng chính trên di động">
      <div className="lp-mobile-bottom-nav-inner">
        {MOBILE_BOTTOM_TABS.map((tab) => {
          const active = isNavItemActive(pathname, tab.matchPrefixes);

          if (tab.isCenterCta) {
            return (
              <Link
                key={tab.href}
                to={tab.href}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  textDecoration: 'none',
                  position: 'relative',
                  top: '-10px',
                }}
              >
                <div
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '50%',
                    background: active
                      ? 'linear-gradient(135deg, #059669, #10b981)'
                      : 'linear-gradient(135deg, #10b981, #34d399)',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '20px',
                    boxShadow: '0 6px 16px rgba(16,185,129,0.35)',
                    border: '3px solid #fff',
                    transition: 'transform 0.15s',
                  }}
                >
                  {tab.icon}
                </div>
                <span
                  style={{
                    fontSize: '10px',
                    fontWeight: 700,
                    color: active ? '#059669' : '#374151',
                    marginTop: '2px',
                  }}
                >
                  {tab.label}
                </span>
              </Link>
            );
          }

          return (
            <Link
              key={tab.href}
              to={tab.href}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '2px',
                textDecoration: 'none',
                color: active ? '#059669' : '#6b7280',
                fontWeight: active ? 700 : 500,
                fontSize: '11px',
                position: 'relative',
                transition: 'color 0.15s',
              }}
            >
              {active && (
                <span
                  style={{
                    position: 'absolute',
                    top: '0',
                    width: '24px',
                    height: '3px',
                    borderRadius: '0 0 4px 4px',
                    background: '#10b981',
                  }}
                />
              )}
              <span style={{ fontSize: '18px', lineHeight: 1 }}>{tab.icon}</span>
              <span>{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};
