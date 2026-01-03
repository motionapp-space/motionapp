import { describe, it, expect } from 'vitest';
import { deriveEventBadge } from '../deriveEventBadge';

describe('deriveEventBadge', () => {
  const futureDate = new Date('2099-12-31T23:59:59Z').toISOString();
  const pastDate = new Date('2020-01-01T10:00:00Z').toISOString();
  const now = new Date('2025-01-03T12:00:00Z');

  describe('CANCELED - priorità massima', () => {
    it('ritorna CANCELED per session_status=canceled', () => {
      expect(deriveEventBadge({
        session_status: 'canceled',
        end_at: futureDate
      }, now)).toBe('CANCELED');
    });

    it('CANCELED batte COMPLETED (evento passato ma annullato)', () => {
      expect(deriveEventBadge({
        session_status: 'canceled',
        end_at: pastDate
      }, now)).toBe('CANCELED');
    });

    it('CANCELED batte PROPOSAL_PENDING', () => {
      expect(deriveEventBadge({
        session_status: 'canceled',
        proposal_status: 'pending',
        end_at: futureDate
      }, now)).toBe('CANCELED');
    });
  });

  describe('PROPOSAL_PENDING', () => {
    it('ritorna PROPOSAL_PENDING per proposal_status=pending', () => {
      expect(deriveEventBadge({
        session_status: 'scheduled',
        proposal_status: 'pending',
        end_at: futureDate
      }, now)).toBe('PROPOSAL_PENDING');
    });

    it('PROPOSAL_PENDING ha priorità su CONFIRMED', () => {
      expect(deriveEventBadge({
        session_status: 'scheduled',
        proposal_status: 'pending',
        end_at: futureDate
      }, now)).toBe('PROPOSAL_PENDING');
    });
  });

  describe('COMPLETED', () => {
    it('ritorna COMPLETED per evento nel passato', () => {
      expect(deriveEventBadge({
        session_status: 'scheduled',
        end_at: pastDate
      }, now)).toBe('COMPLETED');
    });

    it('ritorna COMPLETED per evento passato con session_status=done', () => {
      expect(deriveEventBadge({
        session_status: 'done',
        end_at: pastDate
      }, now)).toBe('COMPLETED');
    });
  });

  describe('CONFIRMED - default', () => {
    it('ritorna CONFIRMED per session_status=scheduled futuro', () => {
      expect(deriveEventBadge({
        session_status: 'scheduled',
        end_at: futureDate
      }, now)).toBe('CONFIRMED');
    });

    it('ANTI-REGRESSIONE: source=client con scheduled → CONFIRMED (non Da confermare)', () => {
      // Anche se source non è usato nella funzione, questo test
      // serve a documentare il comportamento atteso e prevenire regressioni
      expect(deriveEventBadge({
        session_status: 'scheduled',
        proposal_status: null,
        end_at: futureDate
      }, now)).toBe('CONFIRMED');
    });

    it('ritorna CONFIRMED per session_status=no_show futuro', () => {
      expect(deriveEventBadge({
        session_status: 'no_show',
        end_at: futureDate
      }, now)).toBe('CONFIRMED');
    });

    it('ritorna CONFIRMED per session_status nullo', () => {
      expect(deriveEventBadge({
        session_status: null,
        end_at: futureDate
      }, now)).toBe('CONFIRMED');
    });
  });
});
