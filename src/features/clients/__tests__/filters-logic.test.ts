import { describe, it, expect } from 'vitest';
import { getDefaultFilters, filtersToSearchParams } from '../utils/filters';

describe('Filters Logic', () => {
  describe('getDefaultFilters', () => {
    it('should parse new quick filters from URL', () => {
      const sp = new URLSearchParams('?withoutPlan=true&packageToRenew=true&lowActivity=true');
      const filters = getDefaultFilters(sp);
      expect(filters.withoutPlan).toBe(true);
      expect(filters.packageToRenew).toBe(true);
      expect(filters.lowActivity).toBe(true);
    });

    it('should NOT include status filter (obsolete)', () => {
      const sp = new URLSearchParams('?status=ATTIVO');
      const filters = getDefaultFilters(sp);
      expect(filters).not.toHaveProperty('status');
    });

    it('should parse advanced filters correctly', () => {
      const sp = new URLSearchParams('?planWeeksRange=4-8&packageStatus=active&packageStatus=low');
      const filters = getDefaultFilters(sp);
      expect(filters.planWeeksRange).toBe('4-8');
      expect(filters.packageStatuses).toEqual(['active', 'low']);
    });

    it('should parse appointment and activity filters', () => {
      const sp = new URLSearchParams('?appointmentStatus=unplanned&activityStatus=low&activityStatus=inactive');
      const filters = getDefaultFilters(sp);
      expect(filters.appointmentStatuses).toEqual(['unplanned']);
      expect(filters.activityStatuses).toEqual(['low', 'inactive']);
    });

    it('should parse includeArchived filter', () => {
      const sp = new URLSearchParams('?includeArchived=true');
      const filters = getDefaultFilters(sp);
      expect(filters.includeArchived).toBe(true);
    });

    it('should return undefined for empty filters', () => {
      const sp = new URLSearchParams('');
      const filters = getDefaultFilters(sp);
      expect(filters.withoutPlan).toBeUndefined();
      expect(filters.packageToRenew).toBeUndefined();
      expect(filters.includeArchived).toBeUndefined();
    });
  });

  describe('filtersToSearchParams', () => {
    it('should serialize new quick filters to URL', () => {
      const filters = {
        withoutPlan: true,
        packageToRenew: true,
        withoutAppointment: true,
        lowActivity: true
      };
      const sp = filtersToSearchParams(filters);
      expect(sp.get('withoutPlan')).toBe('true');
      expect(sp.get('packageToRenew')).toBe('true');
      expect(sp.get('withoutAppointment')).toBe('true');
      expect(sp.get('lowActivity')).toBe('true');
    });

    it('should serialize advanced filters to URL', () => {
      const filters = {
        planWeeksRange: '4-8' as const,
        packageStatuses: ['active', 'low'] as ('active' | 'low' | 'expired' | 'none')[],
        appointmentStatuses: ['unplanned'] as ('planned' | 'unplanned')[],
        activityStatuses: ['low', 'inactive'] as ('active' | 'low' | 'inactive')[]
      };
      const sp = filtersToSearchParams(filters);
      expect(sp.get('planWeeksRange')).toBe('4-8');
      expect(sp.getAll('packageStatus')).toEqual(['active', 'low']);
      expect(sp.getAll('appointmentStatus')).toEqual(['unplanned']);
      expect(sp.getAll('activityStatus')).toEqual(['low', 'inactive']);
    });

    it('should serialize includeArchived to URL', () => {
      const filters = {
        includeArchived: true
      };
      const sp = filtersToSearchParams(filters);
      expect(sp.get('includeArchived')).toBe('true');
    });

    it('should NOT serialize status filter (obsolete)', () => {
      const filters = {
        q: 'test'
      };
      const sp = filtersToSearchParams(filters);
      expect(sp.has('status')).toBe(false);
    });
  });
});
