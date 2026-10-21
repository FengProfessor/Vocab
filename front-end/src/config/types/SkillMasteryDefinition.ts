/**
 * Display definition of a skill tracked in the mastery overview (the percentage is computed separately).
 */
export interface SkillMasteryDefinition {
  key: 'vocab' | 'grammar' | 'reading' | 'listening';
  name: string;
  icon: React.ReactNode;
}
