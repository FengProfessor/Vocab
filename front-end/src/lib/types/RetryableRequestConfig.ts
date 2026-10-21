import { InternalAxiosRequestConfig } from 'axios';

/**
 * Extended Axios request config tracking whether a 401 refresh retry has already been attempted.
 */
export interface RetryableRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}
