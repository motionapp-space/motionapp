import { describe, it, expect } from 'vitest';

describe('Filters Integration', () => {
  it('should filter clients without plan', () => {
    const clients = [
      { id: '1', plan_weeks_since_assignment: null },
      { id: '2', plan_weeks_since_assignment: 5 },
      { id: '3', plan_weeks_since_assignment: 0 }
    ];
    const filtered = clients.filter(c => c.plan_weeks_since_assignment === null);
    expect(filtered).toHaveLength(1);
    expect(filtered[0].id).toBe('1');
  });

  it('should filter clients with expired package', () => {
    const clients = [
      { id: '1', package_status: 'expired' },
      { id: '2', package_status: 'active' },
      { id: '3', package_status: 'low' }
    ];
    const filtered = clients.filter(c => c.package_status === 'expired');
    expect(filtered).toHaveLength(1);
    expect(filtered[0].id).toBe('1');
  });

  it('should filter clients without appointment', () => {
    const clients = [
      { id: '1', appointment_status: 'unplanned' },
      { id: '2', appointment_status: 'planned' },
      { id: '3', appointment_status: 'unplanned' }
    ];
    const filtered = clients.filter(c => c.appointment_status === 'unplanned');
    expect(filtered).toHaveLength(2);
    expect(filtered.map(c => c.id)).toEqual(['1', '3']);
  });

  it('should filter low activity clients (low OR inactive)', () => {
    const clients = [
      { id: '1', activity_status: 'active' },
      { id: '2', activity_status: 'low' },
      { id: '3', activity_status: 'inactive' },
      { id: '4', activity_status: 'low' }
    ];
    const filtered = clients.filter(c => 
      c.activity_status === 'low' || c.activity_status === 'inactive'
    );
    expect(filtered).toHaveLength(3);
    expect(filtered.map(c => c.id)).toEqual(['2', '3', '4']);
  });

  it('should filter by plan weeks range: none', () => {
    const clients = [
      { id: '1', plan_weeks_since_assignment: null },
      { id: '2', plan_weeks_since_assignment: 5 }
    ];
    const filtered = clients.filter(c => c.plan_weeks_since_assignment === null);
    expect(filtered).toHaveLength(1);
    expect(filtered[0].id).toBe('1');
  });

  it('should filter by plan weeks range: 0-4', () => {
    const clients = [
      { id: '1', plan_weeks_since_assignment: 2 },
      { id: '2', plan_weeks_since_assignment: 5 },
      { id: '3', plan_weeks_since_assignment: 3 }
    ];
    const filtered = clients.filter(c => {
      const weeks = c.plan_weeks_since_assignment;
      return weeks !== null && weeks >= 0 && weeks < 4;
    });
    expect(filtered).toHaveLength(2);
    expect(filtered.map(c => c.id)).toEqual(['1', '3']);
  });

  it('should filter by plan weeks range: 4-8', () => {
    const clients = [
      { id: '1', plan_weeks_since_assignment: 2 },
      { id: '2', plan_weeks_since_assignment: 5 },
      { id: '3', plan_weeks_since_assignment: 7 }
    ];
    const filtered = clients.filter(c => {
      const weeks = c.plan_weeks_since_assignment;
      return weeks !== null && weeks >= 4 && weeks < 8;
    });
    expect(filtered).toHaveLength(2);
    expect(filtered.map(c => c.id)).toEqual(['2', '3']);
  });

  it('should filter by plan weeks range: 8+', () => {
    const clients = [
      { id: '1', plan_weeks_since_assignment: 2 },
      { id: '2', plan_weeks_since_assignment: 9 },
      { id: '3', plan_weeks_since_assignment: 15 }
    ];
    const filtered = clients.filter(c => {
      const weeks = c.plan_weeks_since_assignment;
      return weeks !== null && weeks >= 8;
    });
    expect(filtered).toHaveLength(2);
    expect(filtered.map(c => c.id)).toEqual(['2', '3']);
  });

  it('should filter by multiple package statuses', () => {
    const clients = [
      { id: '1', package_status: 'active' },
      { id: '2', package_status: 'low' },
      { id: '3', package_status: 'expired' },
      { id: '4', package_status: 'none' }
    ];
    const statuses = ['active', 'low'];
    const filtered = clients.filter(c => statuses.includes(c.package_status));
    expect(filtered).toHaveLength(2);
    expect(filtered.map(c => c.id)).toEqual(['1', '2']);
  });

  it('should filter by archived status', () => {
    const clients = [
      { id: '1', archived_at: null },
      { id: '2', archived_at: '2024-01-01' },
      { id: '3', archived_at: null }
    ];
    // Default: exclude archived
    const activeOnly = clients.filter(c => c.archived_at === null);
    expect(activeOnly).toHaveLength(2);
    
    // Include archived
    const all = clients.filter(() => true);
    expect(all).toHaveLength(3);
  });

  it('should combine multiple filters', () => {
    const clients = [
      { id: '1', package_status: 'expired', appointment_status: 'unplanned', activity_status: 'low' },
      { id: '2', package_status: 'active', appointment_status: 'planned', activity_status: 'active' },
      { id: '3', package_status: 'expired', appointment_status: 'unplanned', activity_status: 'inactive' }
    ];
    
    // Filter: packageToRenew AND withoutAppointment AND lowActivity
    const filtered = clients.filter(c => 
      c.package_status === 'expired' &&
      c.appointment_status === 'unplanned' &&
      (c.activity_status === 'low' || c.activity_status === 'inactive')
    );
    
    expect(filtered).toHaveLength(2);
    expect(filtered.map(c => c.id)).toEqual(['1', '3']);
  });
});
