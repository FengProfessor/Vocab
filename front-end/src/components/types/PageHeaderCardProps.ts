/**
 * Props for the PageHeaderCard component.
 */
export interface PageHeaderCardProps {
  /** Module badge label (e.g., "MODULE 03 • VOCABULARY & FSRS v5"). */
  badgeText: string;

  /** Main Vietnamese page title. */
  title: string;

  /** Subtitle description explaining the module's learning purpose. */
  subtitle: string;

  /** Optional right-aligned action buttons or metric widgets. */
  extra?: React.ReactNode;
}
