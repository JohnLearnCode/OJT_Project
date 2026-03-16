import { Request, Response, NextFunction } from 'express';
import * as sessionService from '../service/session.js';
import { StatusCodes } from 'http-status-codes';
import { CreateSessionRequest, UpdateSessionRequest, SessionResponse } from '../types/session/request.js';
import { AuthMessage } from '../types/auth/enum.js';
import { ResponseHelper } from '../utils/response.js';

/**
 * Create a new session (Admin only)
 */
export const createSession = async (
  req: Request<{}, {}, CreateSessionRequest>,
  res: Response,
  next: NextFunction
) => {
  try {
    const session = await sessionService.createSession(req.body);
    return ResponseHelper.success(
      res,
      AuthMessage.SUCCESS_CREATE,
      session,
      StatusCodes.CREATED
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Get all sessions (Admin only)
 */
export const getAllSessions = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const sessions = await sessionService.getAllSessions();
    return ResponseHelper.success(
      res,
      'Sessions retrieved successfully',
      sessions,
      StatusCodes.OK
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Get session by ID (Admin only)
 */
export const getSessionById = async (
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction
) => {
  try {
    const session = await sessionService.getSessionById(req.params.id);
    if (!session) {
      return ResponseHelper.error(
        res,
        'Session not found',
        undefined,
        StatusCodes.NOT_FOUND
      );
    }
    return ResponseHelper.success(
      res,
      'Session retrieved successfully',
      session,
      StatusCodes.OK
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Update session by ID (Admin only)
 */
export const updateSession = async (
  req: Request<{ id: string }, {}, UpdateSessionRequest>,
  res: Response,
  next: NextFunction
) => {
  try {
    const session = await sessionService.updateSession(req.params.id, req.body);
    if (!session) {
      return ResponseHelper.error(
        res,
        'Session not found or update failed',
        undefined,
        StatusCodes.NOT_FOUND
      );
    }
    return ResponseHelper.success(
      res,
      'Session updated successfully',
      session,
      StatusCodes.OK
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Delete session by ID (Admin only)
 */
export const deleteSession = async (
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction
) => {
  try {
    const deleted = await sessionService.deleteSession(req.params.id);
    if (!deleted) {
      return ResponseHelper.error(
        res,
        'Session not found or deletion failed',
        undefined,
        StatusCodes.NOT_FOUND
      );
    }
    return ResponseHelper.success(
      res,
      'Session deleted successfully',
      undefined,
      StatusCodes.OK
    );
  } catch (error) {
    next(error);
  }
};