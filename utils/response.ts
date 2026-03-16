import { Response } from 'express';
import { ApiResponse } from '../types/common/response.js';

/**
 * Standardized API Response Helper
 */
export class ResponseHelper {
  /**
   * Success Response
   */
  static success<T>(
    res: Response,
    message: string,
    data?: T,
    statusCode: number = 200
  ): Response {
    const response: ApiResponse<T> = {
      success: true,
      message,
      data,
      timestamp: new Date().toISOString()
    };

    return res.status(statusCode).json(response);
  }

  /**
   * Error Response
   */
  static error(
    res: Response,
    message: string,
    error?: string,
    statusCode: number = 400
  ): Response {
    const response: ApiResponse = {
      success: false,
      message,
      error,
      timestamp: new Date().toISOString()
    };

    return res.status(statusCode).json(response);
  }
}
