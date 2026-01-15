import { type Request, type Response, type NextFunction } from 'express'
import { AppError } from '../utils/errors'

/**
 * Middleware to restrict access based on user roles
 * @param allowedRoles - Array of roles permitted to access the route
 */
export const authorize = (allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // req.user is populated by the authenticateToken middleware
    const user = (req as any).user

    if (!user) {
      return next(new AppError('Authentication required to access this resource', 401))
    }

    if (!allowedRoles.includes(user.role)) {
      return next(new AppError('You do not have permission to perform this action', 403))
    }

    next()
  }
}
