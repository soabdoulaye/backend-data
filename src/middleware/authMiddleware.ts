import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../services/authService';

// Extend Express Request interface to include user property
declare global {
    namespace Express {
        interface Request {
            user?: {
                user_id: string;
                username: string;
                role: string;
            };
        }
    }
}

/**
 * Authentication middleware
 * Verifies JWT token and adds user data to request object
 */
export const authenticate = (req: Request, res: Response, next: NextFunction): void => {
    try {
        // Get token from Authorization header
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            res.status(401).json({
                success: false,
                error: 'Authentication required'
            });
            return;
        }

        // Extract token
        const token = authHeader.split(' ')[1];

        // Verify token
        const decoded = verifyToken(token);

        // Add user data to request
        req.user = decoded;

        // Continue to next middleware
        next();
    } catch (error) {
        res.status(401).json({
            success: false,
            error: 'Invalid or expired token'
        });
    }
};

/**
 * Role-based authorization middleware
 * Checks if user has required role
 */
export const authorize = (roles: string[]) => {
    return (req: Request, res: Response, next: NextFunction): void => {
        if (!req.user) {
            res.status(401).json({
                success: false,
                error: 'Authentication required'
            });
            return;
        }

        if (!roles.includes(req.user.role)) {
            res.status(403).json({
                success: false,
                error: 'Insufficient permissions'
            });
            return;
        }

        next();
    };
};
