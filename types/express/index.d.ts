// Extend Express Request type để thêm property user
declare namespace Express {
  export interface Request {
    user?: {
      userId: string;
      email: string;
      role: 'teacher' | 'admin';
    };
  }
}
