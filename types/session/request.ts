import { BaseEntity } from '../common/interface.js';
import { ObjectId } from 'mongodb';

/**
 * Session Request Types - For Session CRUD
 */

// Session Entity Interface
export interface Session extends BaseEntity {
  session_date: Date; // Date of the session (without time, we'll store as Date but only date part matters)
  time: string; // One of the allowed time slots: '07:00-09:00', '09:00-11:00', '13:00-15:00', '15:00-17:00'
  roomid: ObjectId;  // Reference to Location
  courseid: ObjectId; // Reference to Course
  userid: ObjectId;   // Reference to User (teacher or admin? but likely teacher)
  createdAt: Date;
  updatedAt: Date;
}

// Request to create a session
export interface CreateSessionRequest {
  session_date: Date; // ISO string or Date object
  time: string;
  roomid: string; // We'll accept string and convert to ObjectId in model
  courseid: string;
  userid: string;
}

// Request to update a session (all fields optional except we must validate time slots if provided)
export interface UpdateSessionRequest {
  session_date?: Date;
  time?: string;
  roomid?: string;
  courseid?: string;
  userid?: string;
}

// Response for session (we can omit internal fields, but for simplicity we'll return the entity without any sensitive data? There's none.)
export interface SessionResponse extends Omit<Session, never> { } // alias

// Session with joined details from location, course, and user
export interface SessionWithDetails extends Session {
  location?: {
    room_name: string;
    location: string;
  };
  course?: {
    courseName: string;
    description: string;
  };
  user?: {
    name: string;
  };
}