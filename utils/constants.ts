import { CollectionName, CommonMessage } from '../types/common/enums.js';

/**
 * Application Constants
 * Using enums for better type safety and maintainability
 */

// Re-export enums for backward compatibility
export const MESSAGES = {
  ...CommonMessage,
};

// Additional constants
export const DEFAULT_PAGINATION = {
  PAGE: 1,
  LIMIT: 10,
  MAX_LIMIT: 100
} as const;

export const VALIDATION_LIMITS = {
  TITLE_MIN_LENGTH: 1,
  TITLE_MAX_LENGTH: 200,
  DESCRIPTION_MAX_LENGTH: 1000
} as const;

export const SORT_OPTIONS = {
  CREATED_AT: 'createdAt',
  UPDATED_AT: 'updatedAt',
  TITLE: 'title'
} as const;
