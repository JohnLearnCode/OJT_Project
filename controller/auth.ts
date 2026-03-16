import { Request, Response, NextFunction } from 'express';
import * as authService from '../service/auth.js';
import { StatusCodes } from 'http-status-codes';
import { RegisterUserRequest, LoginAuthRequest } from '../types/auth/request.js';
import { AuthMessage } from '../types/auth/enum.js';
import { ResponseHelper } from '../utils/response.js';

export const registerAuth = async (
  req: Request<{}, {}, RegisterUserRequest>,
  res: Response,
  next: NextFunction
) => {
  try {
    const authResult = await authService.registerAuth(req.body);
    return ResponseHelper.success(
      res,
      AuthMessage.SUCCESS_CREATE,
      authResult,
      StatusCodes.CREATED
    );
  } catch (error) {
    next(error);
  }
};

export const loginAuth = async (
  req: Request<{}, {}, LoginAuthRequest>,
  res: Response,
  next: NextFunction
) => {
  try {
    const authResult = await authService.loginAuth(req.body);
    return ResponseHelper.success(
      res,
      AuthMessage.SUCCESS_LOGIN,
      authResult,
      StatusCodes.OK
    );
  } catch (error) {
    next(error);
  }
};

export const logoutAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    await authService.logoutAuth();
    return ResponseHelper.success(
      res,
      AuthMessage.SUCCESS_LOGOUT
    );
  } catch (error) {
    next(error);
  }
};
