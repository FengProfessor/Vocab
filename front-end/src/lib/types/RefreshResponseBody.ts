export interface RefreshResponseBody {
  data?: { accessToken?: string; refreshToken?: string; expiresIn?: number };
}
