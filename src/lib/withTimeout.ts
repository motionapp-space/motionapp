/**
 * Wraps a promise with a timeout.
 * If the promise doesn't resolve within the specified time, it rejects with a TimeoutError.
 * The original promise continues to run in the background.
 */
export class TimeoutError extends Error {
  constructor(message = 'Operation timed out') {
    super(message);
    this.name = 'TimeoutError';
  }
}

/**
 * Wraps a promise with a timeout
 * @param promise The promise to wrap
 * @param ms Timeout in milliseconds
 * @param timeoutMessage Optional custom message for timeout error
 * @returns Promise that resolves with the original result or rejects on timeout
 */
export function withTimeout<T>(
  promise: Promise<T>,
  ms: number,
  timeoutMessage?: string
): Promise<T> {
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      reject(new TimeoutError(timeoutMessage || `Operation timed out after ${ms}ms`));
    }, ms);

    promise
      .then((result) => {
        clearTimeout(timeoutId);
        resolve(result);
      })
      .catch((error) => {
        clearTimeout(timeoutId);
        reject(error);
      });
  });
}

/**
 * Creates a fetch function with built-in timeout using AbortController
 * @param timeoutMs Timeout in milliseconds
 * @returns A fetch function with timeout
 */
export function createFetchWithTimeout(timeoutMs: number) {
  return async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(input, {
        ...init,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === 'AbortError') {
        throw new TimeoutError(`Request timed out after ${timeoutMs}ms`);
      }
      throw error;
    }
  };
}
