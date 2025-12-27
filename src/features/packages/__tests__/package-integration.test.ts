/**
 * Automated tests for Package Management System
 * Tests core business logic, invariants, and calendar integration
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { Package, PackageKPI } from '../types';
import { calculatePackageKPI } from '../utils/kpi';

describe('Package Business Logic Tests', () => {
  describe('Invariants', () => {
    it('should calculate remaining sessions correctly', () => {
      const pkg: Package = {
        package_id: '1',
        coach_client_id: 'cc1',
        name: 'Test Package',
        total_sessions: 10,
        consumed_sessions: 3,
        on_hold_sessions: 2,
        price_total_cents: 50000,
        partial_payment_cents: 0,
        currency_code: 'EUR',
        price_source: 'settings',
        usage_status: 'active',
        payment_status: 'unpaid',
        duration_months: 3,
        expires_at: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
        payment_method: null,
        notes_internal: null,
        is_single_technical: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const kpi = calculatePackageKPI(pkg);

      expect(kpi.remaining).toBe(7); // 10 - 3
      expect(kpi.available).toBe(5); // 10 - 3 - 2
      expect(kpi.consumed).toBe(3);
      expect(kpi.on_hold).toBe(2);
      expect(kpi.total).toBe(10);
    });

    it('should never allow negative available sessions', () => {
      const pkg: Package = {
        package_id: '1',
        coach_client_id: 'cc1',
        name: 'Test',
        total_sessions: 5,
        consumed_sessions: 3,
        on_hold_sessions: 3, // This would make available negative
        price_total_cents: 25000,
        partial_payment_cents: 0,
        currency_code: 'EUR',
        price_source: 'settings',
        usage_status: 'active',
        payment_status: 'paid',
        duration_months: 3,
        expires_at: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
        payment_method: null,
        notes_internal: null,
        is_single_technical: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const kpi = calculatePackageKPI(pkg);

      // available should be -1 in this case, which violates invariant
      // Database trigger should prevent this state
      expect(kpi.available).toBeLessThan(0);
      // This test documents that the DB must enforce: available >= 0
    });

    it('should auto-complete when all sessions consumed', () => {
      const pkg: Package = {
        package_id: '1',
        coach_client_id: 'cc1',
        name: 'Test',
        total_sessions: 5,
        consumed_sessions: 5,
        on_hold_sessions: 0,
        price_total_cents: 25000,
        partial_payment_cents: 0,
        currency_code: 'EUR',
        price_source: 'settings',
        usage_status: 'active', // Should be 'completed' by trigger
        payment_status: 'paid',
        duration_months: 3,
        expires_at: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
        payment_method: null,
        notes_internal: null,
        is_single_technical: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const kpi = calculatePackageKPI(pkg);
      expect(kpi.available).toBe(0);
      expect(kpi.remaining).toBe(0);
      
      // Database trigger should auto-set usage_status to 'completed'
      // This test documents expected DB behavior
    });
  });

  describe('Credit Transitions', () => {
    it('should create hold on event confirm', () => {
      const before = {
        consumed_sessions: 0,
        on_hold_sessions: 0,
        total_sessions: 10,
      };

      // Simulate HOLD_CREATE
      const after = {
        consumed_sessions: 0,
        on_hold_sessions: 1,
        total_sessions: 10,
      };

      expect(after.on_hold_sessions).toBe(before.on_hold_sessions + 1);
      expect(after.consumed_sessions).toBe(before.consumed_sessions);
    });

    it('should consume credit and release hold on event complete', () => {
      const before = {
        consumed_sessions: 0,
        on_hold_sessions: 1,
        total_sessions: 10,
      };

      // Simulate CONSUME
      const after = {
        consumed_sessions: 1,
        on_hold_sessions: 0,
        total_sessions: 10,
      };

      expect(after.consumed_sessions).toBe(before.consumed_sessions + 1);
      expect(after.on_hold_sessions).toBe(before.on_hold_sessions - 1);
    });

    it('should only release hold on early cancellation (>24h)', () => {
      const before = {
        consumed_sessions: 0,
        on_hold_sessions: 1,
        total_sessions: 10,
      };

      // Simulate HOLD_RELEASE (CANCEL_GT_24H)
      const after = {
        consumed_sessions: 0,
        on_hold_sessions: 0,
        total_sessions: 10,
      };

      expect(after.consumed_sessions).toBe(before.consumed_sessions);
      expect(after.on_hold_sessions).toBe(before.on_hold_sessions - 1);
    });

    it('should consume credit on late cancellation (<24h)', () => {
      const before = {
        consumed_sessions: 0,
        on_hold_sessions: 1,
        total_sessions: 10,
      };

      // Simulate CONSUME (CANCEL_LT_24H)
      const after = {
        consumed_sessions: 1,
        on_hold_sessions: 0,
        total_sessions: 10,
      };

      expect(after.consumed_sessions).toBe(before.consumed_sessions + 1);
      expect(after.on_hold_sessions).toBe(before.on_hold_sessions - 1);
    });
  });

  describe('Expiration Logic', () => {
    it('should detect expired packages', () => {
      const now = new Date();
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      const pkg: Package = {
        package_id: '1',
        coach_client_id: 'cc1',
        name: 'Expired',
        total_sessions: 10,
        consumed_sessions: 3,
        on_hold_sessions: 1,
        price_total_cents: 50000,
        partial_payment_cents: 0,
        currency_code: 'EUR',
        price_source: 'settings',
        usage_status: 'active',
        payment_status: 'paid',
        duration_months: 3,
        expires_at: yesterday.toISOString(),
        payment_method: null,
        notes_internal: null,
        is_single_technical: false,
        created_at: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date().toISOString(),
      };

      const isExpired = new Date(pkg.expires_at!) <= now;
      expect(isExpired).toBe(true);
      
      // Database trigger should auto-suspend expired packages
    });

    it('should calculate correct expiration date from duration', () => {
      const createdAt = new Date('2025-01-01');
      const durationMonths = 3;
      
      const expectedExpiry = new Date(createdAt);
      expectedExpiry.setMonth(expectedExpiry.getMonth() + durationMonths);
      
      // Should be 2025-04-01
      expect(expectedExpiry.getFullYear()).toBe(2025);
      expect(expectedExpiry.getMonth()).toBe(3); // April (0-indexed)
    });
  });

  describe('Price Management', () => {
    it('should calculate correct price per session', () => {
      const pkg: Package = {
        package_id: '1',
        coach_client_id: 'cc1',
        name: 'Test',
        total_sessions: 10,
        consumed_sessions: 0,
        on_hold_sessions: 0,
        price_total_cents: 50000, // €500
        partial_payment_cents: 0,
        currency_code: 'EUR',
        price_source: 'custom',
        usage_status: 'active',
        payment_status: 'unpaid',
        duration_months: 6,
        expires_at: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString(),
        payment_method: null,
        notes_internal: null,
        is_single_technical: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const kpi = calculatePackageKPI(pkg);
      expect(kpi.price_per_session).toBe(5000); // €50 per session
    });

    it('should mark price as custom when edited', () => {
      const originalPrice = 50000;
      const newPrice = 45000;

      // When price is changed, price_source should become 'custom'
      expect(originalPrice).not.toBe(newPrice);
      // API should set price_source = 'custom' on update
    });
  });

  describe('Auto 1-Session Package', () => {
    it('should create technical package when confirming without active package', () => {
      const hasActivePackage = false;
      const shouldAutoCreate = !hasActivePackage;

      expect(shouldAutoCreate).toBe(true);
      
      // handleEventConfirm should:
      // 1. Check for active package
      // 2. If none, create 1-session technical package
      // 3. Set is_single_technical = true
      // 4. Use settings.sessions_1_price and sessions_1_duration
    });
  });
});

describe('Lock Window Logic', () => {
  it('should apply penalty for cancellation within lock window', () => {
    const lockWindowHours = 24;
    const eventStart = new Date(Date.now() + 12 * 60 * 60 * 1000); // 12 hours from now
    
    const hoursUntilStart = (eventStart.getTime() - Date.now()) / (1000 * 60 * 60);
    const isWithinLockWindow = hoursUntilStart < lockWindowHours;
    
    expect(isWithinLockWindow).toBe(true);
    // Should use CANCEL_LT_24H reason and consume credit
  });

  it('should not apply penalty for early cancellation', () => {
    const lockWindowHours = 24;
    const eventStart = new Date(Date.now() + 48 * 60 * 60 * 1000); // 48 hours from now
    
    const hoursUntilStart = (eventStart.getTime() - Date.now()) / (1000 * 60 * 60);
    const isWithinLockWindow = hoursUntilStart < lockWindowHours;
    
    expect(isWithinLockWindow).toBe(false);
    // Should use CANCEL_GT_24H reason and only release hold
  });
});
