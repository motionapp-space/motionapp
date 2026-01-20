import { describe, it, expect } from 'vitest';
import { 
  formatRestTime, 
  getExerciseAbbrev, 
  formatExerciseActual,
  formatLoadDisplay
} from '../utils/formatters';

describe('formatRestTime', () => {
  it('formats zero correctly', () => {
    expect(formatRestTime(0)).toBe('00:00');
  });

  it('formats positive seconds correctly', () => {
    expect(formatRestTime(65)).toBe('01:05');
    expect(formatRestTime(90)).toBe('01:30');
    expect(formatRestTime(3600)).toBe('60:00');
  });

  it('clamps negative to 00:00', () => {
    expect(formatRestTime(-5)).toBe('00:00');
    expect(formatRestTime(-999)).toBe('00:00');
    expect(formatRestTime(-0.5)).toBe('00:00');
  });

  it('handles decimal seconds by flooring', () => {
    expect(formatRestTime(65.9)).toBe('01:05');
    expect(formatRestTime(59.9)).toBe('00:59');
  });
});

describe('getExerciseAbbrev', () => {
  it('returns "Ex" for undefined or empty names', () => {
    expect(getExerciseAbbrev(undefined)).toBe('Ex');
    expect(getExerciseAbbrev('')).toBe('Ex');
    expect(getExerciseAbbrev('   ')).toBe('Ex');
  });

  it('handles single word names', () => {
    expect(getExerciseAbbrev('Curl')).toBe('Curl');
    expect(getExerciseAbbrev('Squat')).toBe('Squat');
    expect(getExerciseAbbrev('Trazioni')).toBe('Trazio');
  });

  it('keeps just first word for generic Italian exercises', () => {
    expect(getExerciseAbbrev('Panca piana')).toBe('Panca');
    expect(getExerciseAbbrev('Panca inclinata')).toBe('Panca');
    expect(getExerciseAbbrev('Panca declinata')).toBe('Panca');
    expect(getExerciseAbbrev('Alzate laterale')).toBe('Alzate');
    expect(getExerciseAbbrev('Alzate frontale')).toBe('Alzate');
  });

  it('differentiates non-generic multi-word names', () => {
    expect(getExerciseAbbrev('Trazioni lat')).toBe('Trazi. L');
    expect(getExerciseAbbrev('Trazioni sup')).toBe('Trazi. S');
    expect(getExerciseAbbrev('Curl bilanciere')).toBe('Curl. B');
    expect(getExerciseAbbrev('Curl manubri')).toBe('Curl. M');
  });
});

describe('formatExerciseActual', () => {
  it('formats without load', () => {
    expect(formatExerciseActual('Curl', 12, null)).toBe('Curl 12');
    expect(formatExerciseActual('Curl', 12, undefined)).toBe('Curl 12');
    expect(formatExerciseActual('Curl', '12', '')).toBe('Curl 12');
  });

  it('formats normal load with × notation', () => {
    expect(formatExerciseActual('Panca', 10, 80)).toBe('Panca 10×80kg');
    expect(formatExerciseActual('Panca', '10', '80')).toBe('Panca 10×80kg');
    expect(formatExerciseActual('Squat', 8, 100)).toBe('Squat 8×100kg');
  });

  it('formats bodyweight addition with parentheses', () => {
    expect(formatExerciseActual('Trazi', 10, '+20')).toBe('Trazi 10 (+20kg)');
    expect(formatExerciseActual('Dip', 8, '+10')).toBe('Dip 8 (+10kg)');
  });

  it('removes duplicate kg suffix', () => {
    expect(formatExerciseActual('Squat', 8, '100kg')).toBe('Squat 8×100kg');
    expect(formatExerciseActual('Trazi', 10, '+20kg')).toBe('Trazi 10 (+20kg)');
  });
});

describe('formatLoadDisplay', () => {
  it('returns just reps when no load', () => {
    expect(formatLoadDisplay(10, null)).toBe('10');
    expect(formatLoadDisplay('10', undefined)).toBe('10');
  });

  it('formats normal load with ×', () => {
    expect(formatLoadDisplay(10, 80)).toBe('10×80kg');
    expect(formatLoadDisplay('8', '100')).toBe('8×100kg');
  });

  it('formats bodyweight addition with parentheses', () => {
    expect(formatLoadDisplay(10, '+20')).toBe('10 (+20kg)');
    expect(formatLoadDisplay('8', '+15')).toBe('8 (+15kg)');
  });
});
