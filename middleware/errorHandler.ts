import { Request, Response, NextFunction } from 'express';
import { ResponseHelper } from '../utils/response.js';
import { StatusCodes } from 'http-status-codes';

/**
 * Global Error Handler Middleware
 */
export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error('Error:', err.message);
  console.error('Stack:', err.stack);

  // Nếu response đã được gửi, delegate cho default Express error handler
  if (res.headersSent) {
    return next(err);
  }

  return ResponseHelper.error(
    res,
    err.message || 'Có lỗi xảy ra',
    err.message,
    StatusCodes.BAD_REQUEST
  );
};

/**
 * 404 Not Found Handler
 */
export const notFoundHandler = (req: Request, res: Response) => {
  return ResponseHelper.error(
    res,
    `Route ${req.originalUrl} không được tìm thấy`,
    undefined,
    StatusCodes.NOT_FOUND
  );
};
