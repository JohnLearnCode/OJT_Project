import { Request } from 'express';
import { ObjectId } from 'mongodb';

/**
 * Common Interfaces - Shared across modules
 */

// Base Entity Interface
export interface BaseEntity {
  _id: ObjectId;
}
