// Supabase Database Types
// These interfaces represent the structure of your Supabase tables

export interface User {
    id: string;
    username: string;
    email: string;
    password: string; // Hashed password
    two_factor_secret?: string | null; // Secret for TOTP-based 2FA
    two_factor_enabled: boolean; // Whether 2FA is enabled for this user
    profile_picture?: string | null; // URL to profile picture
    role: string; // 'user' or 'admin'
    is_active: boolean;
    created_at: string; // ISO timestamp
    updated_at: string; // ISO timestamp
    last_login_at?: string | null; // ISO timestamp
}

export interface ChatMessage {
    id: string;
    content: string;
    sender: 'user' | 'ai';
    user_id: string;
    conversation_id?: string | null;
    created_at: string; // ISO timestamp
}

// Database table names
export const Tables = {
    USERS: 'users',
    CHAT_MESSAGES: 'chat_messages'
} as const;

// Insert types (without auto-generated fields)
export interface UserInsert {
    username: string;
    email: string;
    password: string;
    two_factor_secret?: string | null;
    two_factor_enabled?: boolean;
    profile_picture?: string | null;
    role?: string;
    is_active?: boolean;
    last_login_at?: string | null;
}

export interface ChatMessageInsert {
    content: string;
    sender: 'user' | 'ai';
    user_id: string;
    conversation_id?: string | null;
}

// Update types (all fields optional except id)
export interface UserUpdate {
    username?: string;
    email?: string;
    password?: string;
    two_factor_secret?: string | null;
    two_factor_enabled?: boolean;
    profile_picture?: string | null;
    role?: string;
    is_active?: boolean;
    last_login_at?: string | null;
}

export interface ChatMessageUpdate {
    content?: string;
    sender?: 'user' | 'ai';
    user_id?: string;
    conversation_id?: string | null;
}
