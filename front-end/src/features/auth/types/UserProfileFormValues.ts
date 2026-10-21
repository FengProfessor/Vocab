/**
 * Form values of the profile dialog.
 */
export interface UserProfileFormValues {
  /** Display name (max 100 characters). */
  fullName: string;
  /** Learning goal. */
  learningGoal: string;
  /** Daily study target in minutes (5..180). */
  dailyTargetMins: number;
}
