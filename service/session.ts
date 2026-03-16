import { CreateSessionRequest, UpdateSessionRequest, SessionResponse, Session } from "../types/session/request";
import * as sessionModel from '../model/session.js';
import { AuthMessage } from '../types/auth/enum.js';
import { ResponseHelper } from '../utils/response.js';
import { StatusCodes } from 'http-status-codes';

/**
 * Create a new session
 */
export const createSession = async (sessionData: CreateSessionRequest): Promise<SessionResponse> => {
  const session = await sessionModel.createSession(sessionData);
  return session as SessionResponse;
};

/**
 * Get all sessions
 */
export const getAllSessions = async (): Promise<SessionResponse[]> => {
  const sessions = await sessionModel.getAllSessions();
  return sessions as SessionResponse[];
};

/**
 * Get session by ID
 */
export const getSessionById = async (id: string): Promise<SessionResponse | null> => {
  const session = await sessionModel.getSessionById(id);
  if (!session) {
    return null;
  }
  return session as SessionResponse;
};

/**
 * Update session by ID
 */
export const updateSession = async (id: string, updateData: UpdateSessionRequest): Promise<SessionResponse> => {
  const session = await sessionModel.updateSession(id, updateData);
  if (!session) {
    throw new Error('Session not found or update failed');
  }
  return session as SessionResponse;
};

/**
 * Delete session by ID
 */
export const deleteSession = async (id: string): Promise<boolean> => {
  const result = await sessionModel.deleteSession(id);
  if (!result) {
    throw new Error('Session not found or deletion failed');
  }
  return result;
};