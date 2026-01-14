/**
 * Utility functions for handling categories (stored as CSV strings in DB)
 */

/**
 * Parse a CSV string of categories into an array
 */
export const parseCategories = (csv: string | null | undefined): string[] => {
  if (!csv) return [];
  return csv
    .split(',')
    .map(c => c.trim())
    .filter(Boolean);
};

/**
 * Serialize an array of categories into a CSV string
 */
export const serializeCategories = (categories: string[]): string => {
  return categories
    .map(c => c.trim())
    .filter(Boolean)
    .join(', ');
};

/**
 * Default suggested categories for templates and plans
 */
export const DEFAULT_SUGGESTED_CATEGORIES = [
  'Forza',
  'Ipertrofia',
  'Cardio',
  'Mobilità',
  'Funzionale',
  'Calisthenics',
  'Powerlifting',
  'Bodybuilding',
  'HIIT',
  'Recupero'
];

/**
 * Normalize a category for comparison (lowercase, trimmed)
 */
export const normalizeCategory = (category: string): string => {
  return category.trim().toLowerCase();
};

/**
 * Check if a category already exists in the list (case-insensitive)
 */
export const categoryExists = (categories: string[], newCategory: string): boolean => {
  const normalized = normalizeCategory(newCategory);
  return categories.some(cat => normalizeCategory(cat) === normalized);
};

/**
 * Add a category to the list if it doesn't already exist
 * Returns the new list or the same list if category was duplicate/empty
 */
export const addCategory = (categories: string[], newCategory: string): string[] => {
  const trimmed = newCategory.trim();
  if (!trimmed || categoryExists(categories, trimmed)) {
    return categories;
  }
  return [...categories, trimmed];
};

/**
 * Remove a category from the list
 */
export const removeCategory = (categories: string[], categoryToRemove: string): string[] => {
  const normalized = normalizeCategory(categoryToRemove);
  return categories.filter(cat => normalizeCategory(cat) !== normalized);
};

/**
 * Max length for a single category
 */
export const MAX_CATEGORY_LENGTH = 30;

/**
 * Validate and truncate a category if too long
 */
export const validateCategory = (category: string): string => {
  const trimmed = category.trim();
  if (trimmed.length > MAX_CATEGORY_LENGTH) {
    return trimmed.substring(0, MAX_CATEGORY_LENGTH);
  }
  return trimmed;
};
