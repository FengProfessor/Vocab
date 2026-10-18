/**
 * Standardized API response envelope returned by all LingoPro .NET 10 endpoints.
 */
export interface ApiResponse<T = unknown> {
  statusCode: number;
  success: boolean;
  message: string;
  data: T | null;
  errors: Record<string, string[]> | null;
  errorCode: string | null;
  timestamp: string;
}
