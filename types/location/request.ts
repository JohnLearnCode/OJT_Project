import { BaseEntity } from '../common/interface.js';
import { ObjectId } from 'mongodb';

/**
 * Location Request Types - For Location CRUD (Room Management)
 */

// Location Entity Interface
export interface Location extends BaseEntity {
  room_name: string;
  location: string;
  createdAt: Date;
  updatedAt: Date;
}

// Request to create a location
export interface CreateLocationRequest {
  room_name: string;
  location: string;
}

// Request to update a location (all fields optional)
export interface UpdateLocationRequest {
  room_name?: string;
  location?: string;
}

// Response for location (omits internal fields if needed, but we can just use the entity without password etc.)
export interface LocationResponse extends Omit<Location, never> { } // alias