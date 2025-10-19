// Layout algorithm for positioning overlapping events side-by-side
export type EventLike = { 
  id: string; 
  start_at: string; 
  end_at: string; 
  client_id: string;
};

export type PositionedEvent = EventLike & { 
  column: number; 
  columns: number;
};

/**
 * Assigns column positions to overlapping events for side-by-side rendering
 * Similar to Google Calendar's layout algorithm
 */
export function layoutOverlaps(events: EventLike[]): PositionedEvent[] {
  if (events.length === 0) return [];

  const items = events
    .map((e) => ({
      ...e,
      start: new Date(e.start_at).getTime(),
      end: new Date(e.end_at).getTime(),
    }))
    .sort((a, b) => a.start - b.start);

  type Active = { start: number; end: number; column: number; id: string };
  let active: Active[] = [];
  const out: PositionedEvent[] = [];

  const flushColumns = () => {
    if (active.length === 0) return;
    const maxCols = Math.max(...active.map((a) => a.column + 1));
    for (const a of active) {
      const e = items.find((i) => i.id === a.id)!;
      out.push({ 
        id: e.id, 
        start_at: e.start_at, 
        end_at: e.end_at, 
        client_id: e.client_id, 
        column: a.column, 
        columns: maxCols 
      });
    }
    active = [];
  };

  for (const e of items) {
    // Remove non-overlapping events from active
    active = active.filter((a) => a.end > e.start);
    
    // Find first free column
    const used = new Set(active.map((a) => a.column));
    let col = 0;
    while (used.has(col)) col++;
    
    active.push({ id: e.id, start: e.start, end: e.end, column: col });

    // Look-ahead: if next event starts after all active end, flush cluster
    const next = items.find((x) => x.start >= e.start && x !== e);
    const allEnd = Math.max(...active.map((a) => a.end));
    if (!next || next.start >= allEnd) {
      flushColumns();
    }
  }
  
  flushColumns();
  return out;
}
