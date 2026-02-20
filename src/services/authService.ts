import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import speakeasy from "speakeasy";
import QRCode from "qrcode";
import { getSupabaseClient } from "../config/database";

// JWT secret key
const JWT_SECRET = `${process.env.JWT_SECRET}`;

/**
 * Register a new user
 */
export const registerUser = async (
  username: string,
  email: string,
  password: string,
) => {
  const supabase = getSupabaseClient();

  // Check if user already exists
  const { data: existingUser, error: existingError } = await supabase
    .from("chat_users")
    .select("*")
    .or(`username.eq.${username},email.eq.${email}`)
    .single();

  if (existingError && existingError.code !== "PGRST116") {
    throw new Error(`Error checking existing user: ${existingError.message}`);
  }

  if (existingUser) {
    if (existingUser.username === username) {
      throw new Error("Username already exists");
    } else {
      throw new Error("Email already exists");
    }
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 10);

  // Insert new user
  const { data: user, error } = await supabase
    .from("chat_users")
    .insert([
      {
        username,
        email,
        password: hashedPassword,
        role: "user",
        created_at: new Date(),
      },
    ])
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to register user: ${error.message}`);
  }

  return user;
};

/**
 * Login user
 */
export const loginUser = async (
  usernameOrEmail: string,
  password: string,
): Promise<{ user: any; token: string; requiresTwoFactor: boolean }> => {
  const supabase = getSupabaseClient();

  const { data: user, error } = await supabase
    .from("chat_users")
    .select("*")
    .or(`username.eq.${usernameOrEmail},email.eq.${usernameOrEmail}`)
    .single();

  if (error || !user) {
    throw new Error("Invalid credentials");
  }

  // Check password
  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    throw new Error("Invalid credentials");
  }

  // Check if 2FA is enabled
  if (user.two_factor_enabled) {
    return { user, token: "", requiresTwoFactor: true };
  }

  const payload = {
    user_id: user.id,
    username: user.username,
    role: user.role,
  };
  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "1h" });

  // Update last login
  await supabase
    .from("chat_users")
    .update({ last_login_at: new Date() })
    .eq("id", user.id);

  return { user, token, requiresTwoFactor: false };
};

/**
 * Setup two-factor authentication
 */
export const setupTwoFactor = async (user_id: string) => {
  const supabase = getSupabaseClient();

  const { data: user, error } = await supabase
    .from("chat_users")
    .select("*")
    .eq("id", user_id)
    .single();

  if (error || !user) {
    throw new Error("User not found");
  }

  const secret = speakeasy.generateSecret({ name: `AIChat:${user.username}` });

  await supabase
    .from("chat_users")
    .update({ two_factor_secret: secret.base32 })
    .eq("id", user_id);

  const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url || "");

  return {
    secret: secret.base32,
    otpAuthUrl: secret.otpauth_url || "",
    qrCodeUrl,
  };
};

/**
 * Verify two-factor authentication token
 */
export const verifyTwoFactor = async (user_id: string, token: string) => {
  const supabase = getSupabaseClient();

  const { data: user, error } = await supabase
    .from("chat_users")
    .select("*")
    .eq("id", user_id)
    .single();

  if (error || !user || !user.two_factor_secret) {
    throw new Error("User not found or 2FA not set up");
  }

  const isValid = speakeasy.totp.verify({
    secret: user.two_factor_secret,
    encoding: "base32",
    token,
  });

  if (!isValid) {
    throw new Error("Invalid 2FA token");
  }

  if (!user.two_factor_enabled) {
    await supabase
      .from("chat_users")
      .update({ two_factor_enabled: true })
      .eq("id", user_id);
  }

  const payload = {
    user_id: user.id,
    username: user.username,
    role: user.role,
  };
  const jwtToken = jwt.sign(payload, JWT_SECRET, { expiresIn: "1h" });

  await supabase
    .from("chat_users")
    .update({ last_login_at: new Date() })
    .eq("id", user_id);

  return { user, token: jwtToken };
};

/**
 * Verify JWT token
 */
export const verifyToken = (
  token: string,
): { user_id: string; username: string; role: string } => {
  try {
    return jwt.verify(token, JWT_SECRET) as {
      user_id: string;
      username: string;
      role: string;
    };
  } catch {
    throw new Error("Invalid token");
  }
};

/**
 * Get user by ID
 */
export const getUserById = async (user_id: string) => {
  const supabase = getSupabaseClient();

  const { data: user, error } = await supabase
    .from("chat_users")
    .select("*")
    .eq("id", user_id)
    .single();

  if (error || !user) {
    throw new Error("User not found");
  }

  return user;
};
