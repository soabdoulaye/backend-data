import { createClient, SupabaseClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Supabase client instance
let supabase: SupabaseClient;

// Initialize Supabase client
export const initializeSupabase = (): SupabaseClient => {
  if (!supabase) {
    const supabaseUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}`;
    const supabaseKey =
      `${process.env.SUPABASE_SERVICE_ROLE_KEY}` ||
      `${process.env.SUPABASE_ANON_KEY}`;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error(
        "Missing Supabase configuration. Please check SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your .env file",
      );
    }

    supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
      },
    });

    console.log("Supabase client initialized successfully");
  }

  return supabase;
};

// Get Supabase client instance
export const getSupabaseClient = (): SupabaseClient => {
  if (!supabase) {
    return initializeSupabase();
  }
  return supabase;
};

// Initialize database connection (for compatibility with existing code)
export const initializeDatabase = async (): Promise<void> => {
  try {
    initializeSupabase();

    // Test the connection by making a simple query
    const { data, error } = await supabase
      .from("chat_users")
      .select("count")
      .limit(1);

    if (error && error.code !== "PGRST116") {
      // PGRST116 is "table not found" which is OK for initial setup
      console.warn("Supabase connection test warning:", error.message);
    }

    console.log("Database connection established successfully with Supabase");
  } catch (error) {
    console.error("Error connecting to Supabase:", error);
    throw error;
  }
};

// Legacy TypeORM configuration (commented out for reference)
/*
import { DataSource } from 'typeorm';
import path from 'path';

export const AppDataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    entities: [path.join(__dirname, '../entities/**\/*.{ts,js}')],
    migrations: [path.join(__dirname, '../migrations/**\/*.{ts,js}')],
    synchronize: process.env.NODE_ENV === 'production' ? true : false,
    logging: process.env.NODE_ENV !== 'production',
    ssl: process.env.DB_SSL === 'true',
});
*/
