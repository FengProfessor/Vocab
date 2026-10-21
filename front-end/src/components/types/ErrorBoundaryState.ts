/**
 * Internal state of the ErrorBoundary component.
 */
export interface ErrorBoundaryState {
  /** Whether an unhandled rendering error was caught. */
  hasError: boolean;

  /** Error message string for diagnostic display. */
  errorMessage: string;
}
