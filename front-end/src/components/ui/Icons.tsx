import React from 'react';

export interface IconProps extends React.SVGProps<SVGSVGElement> {
  spin?: boolean;
}

const BaseSvg: React.FC<IconProps & { children: React.ReactNode }> = ({
  spin,
  className,
  style,
  children,
  ...rest
}) => (
  <svg
    width="1em"
    height="1em"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    className={`${spin ? 'lp-animate-spin ' : ''}${className ?? ''}`.trim()}
    style={{ display: 'inline-block', verticalAlign: '-0.125em', flexShrink: 0, ...style }}
    {...rest}
  >
    {children}
  </svg>
);

export const ApartmentOutlined: React.FC<IconProps> = (p) => (
  <BaseSvg {...p}>
    <rect x="9" y="2" width="6" height="6" rx="1" />
    <rect x="2" y="16" width="6" height="6" rx="1" />
    <rect x="16" y="16" width="6" height="6" rx="1" />
    <path d="M5 16v-3a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v3M12 12V8" />
  </BaseSvg>
);

export const ApiOutlined: React.FC<IconProps> = (p) => (
  <BaseSvg {...p}>
    <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4" />
    <circle cx="12" cy="12" r="4" />
  </BaseSvg>
);

export const ArrowRightOutlined: React.FC<IconProps> = (p) => (
  <BaseSvg {...p}>
    <path d="M5 12h14M13 5l7 7-7 7" />
  </BaseSvg>
);

export const AudioMutedOutlined: React.FC<IconProps> = (p) => (
  <BaseSvg {...p}>
    <line x1="2" y1="2" x2="22" y2="22" />
    <path d="M18.89 13.23A7.12 7.12 0 0 0 19 12v-2M5 10v2a7 7 0 0 0 12 5M15 9.34V5a3 3 0 0 0-5.68-1.33M9 9v3a3 3 0 0 0 5.12 2.12M12 19v3" />
  </BaseSvg>
);

export const AudioOutlined: React.FC<IconProps> = (p) => (
  <BaseSvg {...p}>
    <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
    <path d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v3" />
  </BaseSvg>
);

export const BankOutlined: React.FC<IconProps> = (p) => (
  <BaseSvg {...p}>
    <polygon points="12 2 2 7 22 7 12 2" />
    <line x1="6" y1="10" x2="6" y2="17" />
    <line x1="10" y1="10" x2="10" y2="17" />
    <line x1="14" y1="10" x2="14" y2="17" />
    <line x1="18" y1="10" x2="18" y2="17" />
    <rect x="2" y="18" width="20" height="3" rx="1" />
  </BaseSvg>
);

export const BellOutlined: React.FC<IconProps> = (p) => (
  <BaseSvg {...p}>
    <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
    <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
  </BaseSvg>
);

export const BookOutlined: React.FC<IconProps> = (p) => (
  <BaseSvg {...p}>
    <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
  </BaseSvg>
);

export const CameraOutlined: React.FC<IconProps> = (p) => (
  <BaseSvg {...p}>
    <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
    <circle cx="12" cy="13" r="3" />
  </BaseSvg>
);

export const CheckCircleFilled: React.FC<IconProps> = (p) => (
  <BaseSvg {...p}>
    <circle cx="12" cy="12" r="10" />
    <path d="m9 12 2 2 4-4" />
  </BaseSvg>
);

export const CheckCircleOutlined = CheckCircleFilled;

export const CheckOutlined: React.FC<IconProps> = (p) => (
  <BaseSvg {...p}>
    <path d="M20 6 9 17l-5-5" />
  </BaseSvg>
);

export const ClockCircleOutlined: React.FC<IconProps> = (p) => (
  <BaseSvg {...p}>
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </BaseSvg>
);

export const CloseCircleFilled: React.FC<IconProps> = (p) => (
  <BaseSvg {...p}>
    <circle cx="12" cy="12" r="10" />
    <path d="m15 9-6 6M9 9l6 6" />
  </BaseSvg>
);

export const CloudUploadOutlined: React.FC<IconProps> = (p) => (
  <BaseSvg {...p}>
    <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242" />
    <path d="M12 12v9M16 16l-4-4-4 4" />
  </BaseSvg>
);

export const CompassOutlined: React.FC<IconProps> = (p) => (
  <BaseSvg {...p}>
    <circle cx="12" cy="12" r="10" />
    <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
  </BaseSvg>
);

export const CopyOutlined: React.FC<IconProps> = (p) => (
  <BaseSvg {...p}>
    <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
    <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
  </BaseSvg>
);

export const CrownFilled: React.FC<IconProps> = (p) => (
  <BaseSvg {...p}>
    <path d="m2 4 3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14" />
  </BaseSvg>
);

export const CrownOutlined = CrownFilled;

export const CustomerServiceOutlined: React.FC<IconProps> = (p) => (
  <BaseSvg {...p}>
    <path d="M3 14h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a9 9 0 0 1 18 0v7a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3" />
  </BaseSvg>
);

export const DashboardOutlined: React.FC<IconProps> = (p) => (
  <BaseSvg {...p}>
    <rect width="7" height="9" x="3" y="3" rx="1" />
    <rect width="7" height="5" x="14" y="3" rx="1" />
    <rect width="7" height="9" x="14" y="12" rx="1" />
    <rect width="7" height="5" x="3" y="16" rx="1" />
  </BaseSvg>
);

export const DesktopOutlined: React.FC<IconProps> = (p) => (
  <BaseSvg {...p}>
    <rect width="20" height="14" x="2" y="3" rx="2" />
    <line x1="8" x2="16" y1="21" y2="21" />
    <line x1="12" x2="12" y1="17" y2="21" />
  </BaseSvg>
);

export const DollarOutlined: React.FC<IconProps> = (p) => (
  <BaseSvg {...p}>
    <line x1="12" x2="12" y1="2" y2="22" />
    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
  </BaseSvg>
);

export const DownOutlined: React.FC<IconProps> = (p) => (
  <BaseSvg {...p}>
    <path d="m6 9 6 6 6-6" />
  </BaseSvg>
);

export const ExclamationCircleFilled: React.FC<IconProps> = (p) => (
  <BaseSvg {...p}>
    <circle cx="12" cy="12" r="10" />
    <line x1="12" x2="12" y1="8" y2="12" />
    <line x1="12" x2="12.01" y1="16" y2="16" />
  </BaseSvg>
);

export const ExperimentOutlined: React.FC<IconProps> = (p) => (
  <BaseSvg {...p}>
    <path d="M10 2v7.31l-4.89 8.15A2 2 0 0 0 6.83 20h10.34a2 2 0 0 0 1.72-2.54L14 9.31V2" />
    <path d="M8.5 2h7M7 16h10" />
  </BaseSvg>
);

export const EyeOutlined: React.FC<IconProps> = (p) => (
  <BaseSvg {...p}>
    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
    <circle cx="12" cy="12" r="3" />
  </BaseSvg>
);

export const FileProtectOutlined: React.FC<IconProps> = (p) => (
  <BaseSvg {...p}>
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <path d="m9 15 2 2 4-4" />
  </BaseSvg>
);

export const FileTextOutlined: React.FC<IconProps> = (p) => (
  <BaseSvg {...p}>
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" x2="8" y1="13" y2="13" />
    <line x1="16" x2="8" y1="17" y2="17" />
  </BaseSvg>
);

export const FireFilled: React.FC<IconProps> = (p) => (
  <BaseSvg {...p}>
    <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
  </BaseSvg>
);

export const FireOutlined = FireFilled;

export const FlagFilled: React.FC<IconProps> = (p) => (
  <BaseSvg {...p}>
    <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
    <line x1="4" x2="4" y1="22" y2="15" />
  </BaseSvg>
);

export const FlagOutlined = FlagFilled;

export const FontColorsOutlined: React.FC<IconProps> = (p) => (
  <BaseSvg {...p}>
    <polyline points="4 7 4 4 20 4 20 7" />
    <line x1="9" x2="15" y1="20" y2="20" />
    <line x1="12" x2="12" y1="4" y2="20" />
  </BaseSvg>
);

export const FormOutlined: React.FC<IconProps> = (p) => (
  <BaseSvg {...p}>
    <path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
  </BaseSvg>
);

export const LockOutlined: React.FC<IconProps> = (p) => (
  <BaseSvg {...p}>
    <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </BaseSvg>
);

export const LogoutOutlined: React.FC<IconProps> = (p) => (
  <BaseSvg {...p}>
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" x2="9" y1="12" y2="12" />
  </BaseSvg>
);

export const MoonOutlined: React.FC<IconProps> = (p) => (
  <BaseSvg {...p}>
    <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
  </BaseSvg>
);

export const PlusCircleOutlined: React.FC<IconProps> = (p) => (
  <BaseSvg {...p}>
    <circle cx="12" cy="12" r="10" />
    <path d="M8 12h8M12 8v8" />
  </BaseSvg>
);

export const PlusOutlined: React.FC<IconProps> = (p) => (
  <BaseSvg {...p}>
    <path d="M5 12h14M12 5v14" />
  </BaseSvg>
);

export const QrcodeOutlined: React.FC<IconProps> = (p) => (
  <BaseSvg {...p}>
    <rect width="5" height="5" x="3" y="3" rx="1" />
    <rect width="5" height="5" x="16" y="3" rx="1" />
    <rect width="5" height="5" x="3" y="16" rx="1" />
    <path d="M21 16h-3a2 2 0 0 0-2 2v3M21 21v.01M12 7v3a2 2 0 0 1-2 2H7" />
  </BaseSvg>
);

export const ReadOutlined: React.FC<IconProps> = (p) => (
  <BaseSvg {...p}>
    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
    <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
  </BaseSvg>
);

export const RedoOutlined: React.FC<IconProps> = (p) => (
  <BaseSvg {...p}>
    <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" />
    <path d="M21 3v5h-5" />
  </BaseSvg>
);

export const ReloadOutlined = RedoOutlined;
export const SyncOutlined = RedoOutlined;

export const RightOutlined: React.FC<IconProps> = (p) => (
  <BaseSvg {...p}>
    <path d="m9 18 6-6-6-6" />
  </BaseSvg>
);

export const RobotOutlined: React.FC<IconProps> = (p) => (
  <BaseSvg {...p}>
    <rect width="16" height="12" x="4" y="8" rx="2" />
    <path d="M12 8V4H8M2 14h2M20 14h2M15 13v2M9 13v2" />
  </BaseSvg>
);

export const SafetyCertificateOutlined: React.FC<IconProps> = (p) => (
  <BaseSvg {...p}>
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
    <path d="m9 12 2 2 4-4" />
  </BaseSvg>
);

export const SearchOutlined: React.FC<IconProps> = (p) => (
  <BaseSvg {...p}>
    <circle cx="11" cy="11" r="8" />
    <path d="m21 21-4.3-4.3" />
  </BaseSvg>
);

export const SendOutlined: React.FC<IconProps> = (p) => (
  <BaseSvg {...p}>
    <path d="m22 2-7 20-4-9-9-4Z" />
    <path d="M22 2 11 13" />
  </BaseSvg>
);

export const SoundOutlined: React.FC<IconProps> = (p) => (
  <BaseSvg {...p}>
    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
    <path d="M15.54 8.46a5 5 0 0 1 0 7.07M19.07 4.93a10 10 0 0 1 0 14.14" />
  </BaseSvg>
);

export const StopOutlined: React.FC<IconProps> = (p) => (
  <BaseSvg {...p}>
    <rect width="14" height="14" x="5" y="5" rx="2" />
  </BaseSvg>
);

export const SunOutlined: React.FC<IconProps> = (p) => (
  <BaseSvg {...p}>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
  </BaseSvg>
);

export const TagOutlined: React.FC<IconProps> = (p) => (
  <BaseSvg {...p}>
    <path d="M12 2H2v10l9.29 9.29c.94.94 2.48.94 3.42 0l6.58-6.58c.94-.94.94-2.48 0-3.42L12 2Z" />
    <path d="M7 7h.01" />
  </BaseSvg>
);

export const TeamOutlined: React.FC<IconProps> = (p) => (
  <BaseSvg {...p}>
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
  </BaseSvg>
);

export const ThunderboltFilled: React.FC<IconProps> = (p) => (
  <BaseSvg {...p}>
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
  </BaseSvg>
);

export const TrophyFilled: React.FC<IconProps> = (p) => (
  <BaseSvg {...p}>
    <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6M18 9h1.5a2.5 2.5 0 0 0 0-5H18M4 22h16M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22M18 2H6v7a6 6 0 0 0 12 0V2Z" />
  </BaseSvg>
);

export const TrophyOutlined = TrophyFilled;

export const UserOutlined: React.FC<IconProps> = (p) => (
  <BaseSvg {...p}>
    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </BaseSvg>
);
