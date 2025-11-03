// Drag & Drop utilities for Plan Editor

export type DnDItemType = "exercise" | "group:superset" | "group:circuit";
export type ContainerScope = "block-top" | "group-body";

export interface DragData {
  itemType: DnDItemType;
  itemId: string;
  source: {
    container: ContainerScope;
    blockId: string;
    groupId?: string; // only when container === "group-body"
    index: number;
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
export function getDragId(itemType: DnDItemType, itemId: string): string {
  return `${itemType}-${itemId}`;
}

/**
 * Parse a drag ID back to its components
 */
export function parseDragId(dragId: string): { itemType: DnDItemType; itemId: string } | null {
  const parts = dragId.split("-");
  if (parts.length < 2) return null;
  
  // Reconstruct itemType (might be "group:superset" or "group:circuit")
  const itemType = parts[0] === "group" && parts.length > 2 && (parts[1] === "superset" || parts[1] === "circuit")
    ? `${parts[0]}:${parts[1]}` as DnDItemType
    : parts[0] as DnDItemType;
  
  // ItemId is everything after the itemType
  const itemId = itemType.includes(":")
    ? parts.slice(2).join("-")
    : parts.slice(1).join("-");
  
  return { itemType, itemId };
}
