import React from 'react';

/**
 * One skill row of the mastery overview.
 */
export interface SkillMasteryItem {
  /** Stable skill key. */
  key: string;
  /** Vietnamese skill name. */
  name: string;
  /** Icon displayed before the name. */
  icon: React.ReactNode;
  /** Mastery percentage (0..100), or null when the backend does not provide it yet. */
  percent: number | null;
}
