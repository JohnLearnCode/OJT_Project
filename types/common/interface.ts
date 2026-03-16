import { Request } from 'express';
import { ObjectId } from 'mongodb';

/**
 * Common Interfaces - Shared across modules
 */

// Base Entity Interface
export interface BaseEntity {
  _id: ObjectId;
}

export interface AuthenticateRequest extends Request {
  user: {
    _id: string;
    role: string;
    name: string;
    email: string;
  }
}
