import { Request, Response, NextFunction } from 'express';
import { ResponseHelper } from '../utils/response';
import { StatusCodes } from 'http-status-codes';

/**
 * Middleware to require teacher or admin role
 * Must be used AFTER requireAuth middleware
 * Allows both teacher and admin to access the endpoint
 */
export const requireTeacher = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // req.user should already be set by requireAuth middleware
  if (!req.user) {
    return ResponseHelper.error(
      res,
      'Authentication required',
      undefined,
      StatusCodes.UNAUTHORIZED
    );
  }

  // Check if user has teacher or admin role
  const role = req.user.role;
  if (role !== 'teacher' && role !== 'admin') {
    return ResponseHelper.error(
      res,
      'Teacher or Admin access required',
      undefined,
      StatusCodes.FORBIDDEN
    );
  }

  next();
};
