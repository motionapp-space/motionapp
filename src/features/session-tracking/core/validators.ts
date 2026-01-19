/**
 * Validation utilities for session tracking inputs
 * 
 * Uses assertive style (throws on invalid) for cleaner service layer code
 */

export interface ActualInput {
  reps: string;
  load?: string;
  rest?: string;
}

/**
 * Custom error class for validation failures
 */
export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

/**
 * Assert that actual input is valid
 * 
 * @throws ValidationError if input is invalid
 * 
 * Validation rules:
 * - reps: required, integer > 0
 * - load: optional, if provided must be number >= 0
 * - rest: optional, if provided must be integer >= 0
 */
export function assertValidActualInput(input: ActualInput): void {
  // Validate reps (required)
  const reps = parseInt(input.reps, 10);
  if (isNaN(reps) || reps <= 0) {
    throw new ValidationError('Ripetizioni deve essere un numero maggiore di 0');
  }

  // Validate load (optional)
  if (input.load !== undefined && input.load !== '') {
    const load = parseFloat(input.load);
    if (isNaN(load) || load < 0) {
      throw new ValidationError('Carico deve essere un numero >= 0');
    }
  }

  // Validate rest (optional)
  if (input.rest !== undefined && input.rest !== '') {
    const rest = parseInt(input.rest, 10);
    if (isNaN(rest) || rest < 0) {
      throw new ValidationError('Recupero deve essere un numero >= 0');
    }
  }
}

/**
 * Parse and normalize actual input values
 * Call after assertValidActualInput
 */
export function parseActualInput(input: ActualInput): {
  reps: number;
  load?: number;
  rest?: number;
} {
  return {
    reps: parseInt(input.reps, 10),
    load: input.load ? parseFloat(input.load) : undefined,
    rest: input.rest ? parseInt(input.rest, 10) : undefined,
  };
}
