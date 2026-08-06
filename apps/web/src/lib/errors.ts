import { AxiosError } from 'axios';

/**
 * The message to show a user when a request fails.
 *
 * Fifteen catch blocks wrote `catch (err: any)` and then reached for
 * `err.response?.data?.message`. Both parts are unchecked: `any` disables the
 * compiler exactly where the shape is least certain, and a thrown value in
 * JavaScript need not be an Error at all. When the server sends an array of
 * validation messages — which the global ValidationPipe does — the old code
 * rendered "[object Object]" or the literal string of a comma-joined array,
 * depending on the call site.
 */
export function errorMessage(error: unknown, fallback: string): string {
  if (error instanceof AxiosError) {
    const data = error.response?.data as
      | { message?: string | string[] }
      | undefined;
    const message = data?.message;
    // class-validator returns one message per failed constraint.
    if (Array.isArray(message)) return message.join('. ');
    if (typeof message === 'string' && message.length > 0) return message;
  }
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

/** The HTTP status of a failed request, when there was one. */
export function errorStatus(error: unknown): number | undefined {
  return error instanceof AxiosError ? error.response?.status : undefined;
}
