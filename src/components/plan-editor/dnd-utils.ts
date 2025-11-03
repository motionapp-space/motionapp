// Drag & Drop utilities for Plan Editor

export interface DragData {
  itemType: "exercise" | "group";
  itemId: string;
  source: {
    level: "block" | "group";
    containerId: string;
  };
}

/**
 * Move an item within the same array
 */
export function moveWithin<T>(list: T[], fromIndex: number, toIndex: number): T[] {
  if (fromIndex === toIndex) return list;
  
  const result = [...list];
  const [removed] = result.splice(fromIndex, 1);
  result.splice(toIndex, 0, removed);
  
  return result;
}

/**
 * Move an item from one array to another
 */
export function moveAcross<T>(
  source: T[],
  destination: T[],
  fromIndex: number,
  toIndex: number
): { src: T[]; dest: T[] } {
  const newSrc = [...source];
  const newDest = [...destination];
  
  const [removed] = newSrc.splice(fromIndex, 1);
  newDest.splice(toIndex, 0, removed);
  
  return { src: newSrc, dest: newDest };
}

/**
 * Generate a unique drag ID for sorting
 */
export function getDragId(itemType: "exercise" | "group", itemId: string): string {
  return `${itemType}-${itemId}`;
}

/**
 * Parse a drag ID back to its components
 */
export function parseDragId(dragId: string): { itemType: "exercise" | "group"; itemId: string } | null {
  const parts = dragId.split("-");
  if (parts.length < 2) return null;
  
  const itemType = parts[0] as "exercise" | "group";
  const itemId = parts.slice(1).join("-");
  
  return { itemType, itemId };
}
