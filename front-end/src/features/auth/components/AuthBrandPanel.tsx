import React from 'react';
import { AuthBrandPanelProps } from '@/features/auth/types/AuthBrandPanelProps';

/**
 * Editorial brand column of the login/register page (desktop only): logo, headline, lead copy and benefit list.
 * Mirrors the aside of the server-rendered Login.cshtml.
 */
export const AuthBrandPanel: React.FC<AuthBrandPanelProps> = ({ homeHref }) => {
  return (
    <aside className="lp-auth-aside">
      <a href={homeHref} className="lp-auth-brand-link">
        <div className="lp-auth-brand-icon">
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z" />
            <path d="M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z" />
            <path d="M15 13a4.5 4.5 0 0 1-3-4 4.5 4.5 0 0 1-3 4" />
            <path d="M17.599 6.5a3 3 0 0 0 .399-1.375" />
            <path d="M6.003 5.125A3 3 0 0 0 6.401 6.5" />
            <path d="M3.477 10.896a4 4 0 0 1 .585-.396" />
            <path d="M19.938 10.5a4 4 0 0 1 .585.396" />
            <path d="M6 18a4 4 0 0 1-1.967-.516" />
            <path d="M19.967 17.484A4 4 0 0 1 18 18" />
          </svg>
        </div>
        <span className="lp-auth-brand-name">LingoPro</span>
      </a>

      <div className="lp-auth-hero-stack">
        <div className="lp-auth-badge">
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z" />
            <path d="M20 3v4" />
            <path d="M22 5h-4" />
            <path d="M4 17v2" />
            <path d="M5 18H3" />
          </svg>
          App học từ vựng · FSRS
        </div>

        <h1 className="lp-auth-headline">
          Học từ vựng — <span className="lp-auth-headline-accent">tra 1 chạm, nhớ lâu hơn</span>
        </h1>

        <p className="lp-auth-lead">
          Tra từ trên web → lưu kho riêng → ôn đúng lúc bằng FSRS. Chặng ngắn 5–8 phút, lộ trình sẵn cho người
          Việt.
        </p>

        <ul className="lp-auth-benefits">
          <li className="lp-auth-benefit-item">
            <div className="lp-auth-benefit-icon">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <circle cx="12" cy="12" r="10" />
                <circle cx="12" cy="12" r="4" />
                <line x1="21.17" x2="12" y1="8" y2="8" />
                <line x1="3.95" x2="8.54" y1="6.06" y2="14" />
                <line x1="10.88" x2="15.46" y1="21.94" y2="14" />
              </svg>
            </div>
            <span className="lp-auth-benefit-text">Tra từ 1 chạm trên web</span>
          </li>
          <li className="lp-auth-benefit-item">
            <div className="lp-auth-benefit-icon">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z" />
                <path d="M20 3v4" />
                <path d="M22 5h-4" />
                <path d="M4 17v2" />
                <path d="M5 18H3" />
              </svg>
            </div>
            <span className="lp-auth-benefit-text">Lưu kho riêng · ảnh + ví dụ</span>
          </li>
          <li className="lp-auth-benefit-item">
            <div className="lp-auth-benefit-icon">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="m2 9 3-3 3 3" />
                <path d="M13 18H7a2 2 0 0 1-2-2V6" />
                <path d="m22 15-3 3-3-3" />
                <path d="M11 6h6a2 2 0 0 1 2 2v10" />
              </svg>
            </div>
            <span className="lp-auth-benefit-text">Ôn FSRS đúng lúc quên</span>
          </li>
        </ul>

        <div className="lp-auth-Perks">
          {['Miễn phí bắt đầu', '5–8 phút/chặng', 'Lộ trình sẵn'].map((perk) => (
            <span key={perk} className="lp-auth-perk-item">
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#2d7f5e"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M20 6 9 17l-5-5" />
              </svg>
              {perk}
            </span>
          ))}
        </div>
      </div>

      <p className="lp-auth-aside-footer">9.000+ từ · 660+ chặng · 30+ lộ trình</p>
    </aside>
  );
};
