import express, { Request, Response } from 'express';
import { registerUser, loginUser, setupTwoFactor, verifyTwoFactor, getUserById } from '../services/authService';
import { authenticate } from '../middleware/authMiddleware';

const router = express.Router();

/**
 * POST /api/auth/register
 * Register a new user
 */
router.post('/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;

        // Validate input
        if (!username || !email || !password) {
            return res.status(400).json({
                success: false,
                error: 'Username, email, and password are required'
            });
        }

        // Register user
        const user = await registerUser(username, email, password);

        // Return success response
        return res.status(201).json({
            success: true,
            message: 'User registered successfully',
            data: {
                id: user.id,
                username: user.username,
                email: user.email
            }
        });
    } catch (error: any) {
        console.error('Error in register endpoint:', error);
        return res.status(400).json({
            success: false,
            error: error.message || 'An error occurred during registration'
        });
    }
});

/**
 * POST /api/auth/login
 * Login user
 */
router.post('/login', async (req, res) => {
    try {
        const { usernameOrEmail, password } = req.body;

        // Validate input
        if (!usernameOrEmail || !password) {
            return res.status(400).json({
                success: false,
                error: 'Username/email and password are required'
            });
        }

        // Login user
        const { user, token, requiresTwoFactor } = await loginUser(usernameOrEmail, password);

        // If 2FA is enabled, return user ID for 2FA verification
        if (requiresTwoFactor) {
            return res.status(200).json({
                success: true,
                message: 'Two-factor authentication required',
                data: {
                    user_id: user.id,
                    requiresTwoFactor: true
                }
            });
        }

        // Return success response with token
        return res.status(200).json({
            success: true,
            message: 'Login successful',
            data: {
                token,
                user: {
                    id: user.id,
                    username: user.username,
                    email: user.email,
                    role: user.role
                }
            }
        });
    } catch (error: any) {
        console.error('Error in login endpoint:', error);
        return res.status(401).json({
            success: false,
            error: error.message || 'Invalid credentials'
        });
    }
});

/**
 * POST /api/auth/2fa/setup
 * Setup two-factor authentication
 */
router.post('/2fa/setup', authenticate, async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                error: 'Authentication required'
            });
        }

        // Setup 2FA
        const { secret, otpAuthUrl, qrCodeUrl } = await setupTwoFactor(req.user.user_id);

        // Return success response
        return res.status(200).json({
            success: true,
            message: 'Two-factor authentication setup',
            data: {
                secret,
                otpAuthUrl,
                qrCodeUrl
            }
        });
    } catch (error: any) {
        console.error('Error in 2FA setup endpoint:', error);
        return res.status(400).json({
            success: false,
            error: error.message || 'An error occurred during 2FA setup'
        });
    }
});

/**
 * POST /api/auth/2fa/verify
 * Verify two-factor authentication token
 */
router.post('/2fa/verify', async (req, res) => {
    try {
        const { user_id, token } = req.body;

        // Validate input
        if (!user_id || !token) {
            return res.status(400).json({
                success: false,
                error: 'User ID and token are required'
            });
        }

        // Verify 2FA token
        const { user, token: jwtToken } = await verifyTwoFactor(user_id, token);

        // Return success response with token
        return res.status(200).json({
            success: true,
            message: 'Two-factor authentication verified',
            data: {
                token: jwtToken,
                user: {
                    id: user.id,
                    username: user.username,
                    email: user.email,
                    role: user.role
                }
            }
        });
    } catch (error: any) {
        console.error('Error in 2FA verify endpoint:', error);
        return res.status(401).json({
            success: false,
            error: error.message || 'Invalid 2FA token'
        });
    }
});

/**
 * GET /api/auth/me
 * Get current user
 */
router.get('/me', authenticate, async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                error: 'Authentication required'
            });
        }

        // Get user by ID
        const user = await getUserById(req.user.user_id);

        // Return success response
        return res.status(200).json({
            success: true,
            data: {
                id: user.id,
                username: user.username,
                email: user.email,
                role: user.role,
                two_factor_enabled: user.two_factor_enabled,
                profile_picture: user.profile_picture,
                created_at: user.created_at,
                lastLoginAt: user.last_login_at
            }
        });
    } catch (error: any) {
        console.error('Error in get user endpoint:', error);
        return res.status(400).json({
            success: false,
            error: error.message || 'An error occurred while fetching user data'
        });
    }
});

export const authRouter = router;
