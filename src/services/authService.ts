import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import { AppDataSource } from '../config/database';
import { User } from '../entities/User';

// Repository for User entity
const userRepository = AppDataSource.getRepository(User);

// JWT secret key
const JWT_SECRET = process.env.JWT_SECRET || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiYWRtaW4iOnRydWUsImlhdCI6MTUxNjIzOTAyMn0.KMUFsIDTnFmyG3nMiGM6H9FNFUROf3wh7SmqJp-QV30';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1d';

/**
 * Register a new user
 */
export const registerUser = async (
    username: string,
    email: string,
    password: string
): Promise<User> => {
    // Check if user already exists
    const existingUser = await userRepository.findOne({
        where: [{ username }, { email }]
    });

    if (existingUser) {
        if (existingUser.username === username) {
            throw new Error('Username already exists');
        } else {
            throw new Error('Email already exists');
        }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    const user = userRepository.create({
        username,
        email,
        password: hashedPassword
    });

    // Save user to database
    await userRepository.save(user);

    return user;
};

/**
 * Login user
 */
export const loginUser = async (
    usernameOrEmail: string,
    password: string
): Promise<{ user: User; token: string; requiresTwoFactor: boolean }> => {
    // Find user by username or email
    const user = await userRepository.findOne({
        where: [{ username: usernameOrEmail }, { email: usernameOrEmail }]
    });

    if (!user) {
        throw new Error('Invalid credentials');
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
        throw new Error('Invalid credentials');
    }

    // Check if 2FA is enabled
    if (user.two_factor_enabled) {
        return {
            user,
            token: '', // No token yet, requires 2FA verification
            requiresTwoFactor: true
        };
    }

    const payload = { user_id: user.id, username: user.username, role: user.role };
    // Generate JWT token
    const token = jwt.sign(
        payload,
        JWT_SECRET,
        { expiresIn: '1h' }
    );

    // Update last login time
    user.last_login_at = new Date();
    await userRepository.save(user);

    return {
        user,
        token,
        requiresTwoFactor: false
    };
};

/**
 * Setup two-factor authentication
 */
export const setupTwoFactor = async (user_id: string): Promise<{ secret: string; otpAuthUrl: string; qrCodeUrl: string }> => {
    // Find user
    const user = await userRepository.findOne({
        where: { id: user_id }
    });

    if (!user) {
        throw new Error('User not found');
    }

    // Generate new secret
    const secret = speakeasy.generateSecret({
        name: `AIChat:${user.username}`
    });

    // Save secret to user
    user.two_factor_secret = secret.base32;
    await userRepository.save(user);

    // Generate QR code
    const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url || '');

    return {
        secret: secret.base32,
        otpAuthUrl: secret.otpauth_url || '',
        qrCodeUrl
    };
};

/**
 * Verify two-factor authentication token
 */
export const verifyTwoFactor = async (
    user_id: string,
    token: string
): Promise<{ user: User; token: string }> => {
    // Find user
    const user = await userRepository.findOne({
        where: { id: user_id }
    });

    if (!user || !user.two_factor_secret) {
        throw new Error('User not found or 2FA not set up');
    }

    // Verify token
    const isValid = speakeasy.totp.verify({
        secret: user.two_factor_secret,
        encoding: 'base32',
        token
    });

    if (!isValid) {
        throw new Error('Invalid 2FA token');
    }

    // Enable 2FA if not already enabled
    if (!user.two_factor_enabled) {
        user.two_factor_enabled = true;
        await userRepository.save(user);
    }

    const playload_jwt = { user_id: user.id, username: user.username, role: user.role };
    // Generate JWT token
    const jwtToken = jwt.sign(
        playload_jwt,
        JWT_SECRET,
        { expiresIn: '1h' }
    );

    // Update last login time
    user.last_login_at = new Date();
    await userRepository.save(user);

    return {
        user,
        token: jwtToken
    };
};

/**
 * Verify JWT token
 */
export const verifyToken = (token: string): { user_id: string; username: string; role: string } => {
    try {
        const decoded = jwt.verify(token, JWT_SECRET) as { user_id: string; username: string; role: string };
        return decoded;
    } catch (error) {
        throw new Error('Invalid token');
    }
};

/**
 * Get user by ID
 */
export const getUserById = async (user_id: string): Promise<User> => {
    const user = await userRepository.findOne({
        where: { id: user_id }
    });

    if (!user) {
        throw new Error('User not found');
    }

    return user;
};
