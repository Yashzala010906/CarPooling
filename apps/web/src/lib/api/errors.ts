import { isAxiosError } from 'axios';
import type { ApiError } from '@carpool/types';

/**
 * Normalizes any thrown value from an apiClient call into user-facing messages,
 * unwrapping the ApiError envelope produced by the NestJS HttpExceptionFilter.
 */
export function extractApiErrors(error: unknown): string[] {
  if (isAxiosError(error)) {
    const data = error.response?.data as ApiError | undefined;
    if (data?.message) {
      return Array.isArray(data.message) ? data.message : [data.message];
    }
    if (error.response?.status === 401) {
      return ['Your session has expired. Please log in again.'];
    }
    if (!error.response) {
      return ['Cannot reach the server. Please check that the API is running.'];
    }
  }
  return ['Something went wrong. Please try again.'];
}
