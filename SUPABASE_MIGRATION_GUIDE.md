# Supabase Migration Guide

This guide will help you complete the migration from TypeORM/PostgreSQL to Supabase.

## ✅ Completed Steps

1. **Supabase Client Installation**: Added `@supabase/supabase-js` to dependencies
2. **Database Configuration**: Updated `src/config/database.ts` to use Supabase
3. **Type Definitions**: Created `src/types/database.ts` with Supabase-compatible interfaces
4. **Environment Setup**: Created `.env` file with Supabase configuration
5. **Database Schema**: Created `supabase-setup.sql` with table definitions
6. **Connection Test**: Created `test-connection.ts` for testing the setup

## 🔧 Next Steps to Complete Migration

### 1. Set up your Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Once created, go to Settings > API to get your credentials:
   - Project URL
   - Anon public key
   - Service role key (secret)

### 2. Update Environment Variables

Edit your `.env` file and replace the placeholder values:

```env
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

### 3. Create Database Tables

1. Open your Supabase dashboard
2. Go to the SQL Editor
3. Copy and paste the contents of `supabase-setup.sql`
4. Run the script to create tables and set up security policies

### 4. Test the Connection

Run the connection test:

```bash
npx ts-node test-connection.ts
```

### 5. Update Service Files

You'll need to update your service files to use Supabase instead of TypeORM. Here are the key changes needed:

#### Example: Update AuthService

Replace TypeORM repository calls with Supabase queries:

```typescript
// Old TypeORM way
const user = await userRepository.findOne({ where: { email } });

// New Supabase way
import { getSupabaseClient } from "../config/database";
import { Tables, User } from "../types/database";

const supabase = getSupabaseClient();
const { data: user, error } = await supabase
  .from(Tables.USERS)
  .select("*")
  .eq("email", email)
  .single();
```

#### Example: Update ChatService

```typescript
// Old TypeORM way
const messages = await messageRepository.find({
  where: { user_id },
  order: { created_at: "DESC" },
});

// New Supabase way
const { data: messages, error } = await supabase
  .from(Tables.CHAT_MESSAGES)
  .select("*")
  .eq("user_id", userId)
  .order("created_at", { ascending: false });
```

### 6. Update Server Initialization

In your `src/server.ts`, make sure you're calling the new initialization:

```typescript
import { initializeDatabase } from "./config/database";

// Initialize database connection
await initializeDatabase();
```

### 7. Remove TypeORM Dependencies (Optional)

Once everything is working, you can remove TypeORM-related packages:

```bash
npm uninstall typeorm pg @types/pg reflect-metadata
```

And remove the old entity files:

- `src/entities/User.ts`
- `src/entities/ChatMessage.ts`

## 🔍 Key Differences Between TypeORM and Supabase

### Data Fetching

- **TypeORM**: `repository.find()`
- **Supabase**: `supabase.from('table').select()`

### Data Insertion

- **TypeORM**: `repository.save(entity)`
- **Supabase**: `supabase.from('table').insert(data)`

### Data Updates

- **TypeORM**: `repository.update(id, data)`
- **Supabase**: `supabase.from('table').update(data).eq('id', id)`

### Data Deletion

- **TypeORM**: `repository.delete(id)`
- **Supabase**: `supabase.from('table').delete().eq('id', id)`

### Relationships

- **TypeORM**: Automatic joins with `@ManyToOne`, `@OneToMany`
- **Supabase**: Manual joins or separate queries

## 🛡️ Security Features

Supabase provides built-in security features:

1. **Row Level Security (RLS)**: Already configured in the setup script
2. **Authentication**: Built-in auth system (optional to use)
3. **API Keys**: Separate keys for different access levels

## 🚀 Benefits of Supabase

1. **Managed Infrastructure**: No need to manage PostgreSQL server
2. **Real-time Subscriptions**: Built-in real-time capabilities
3. **Auto-generated APIs**: REST and GraphQL APIs
4. **Built-in Authentication**: Optional auth system
5. **Dashboard**: Web interface for data management

## 📝 Testing Checklist

- [ ] Supabase project created
- [ ] Environment variables updated
- [ ] Database tables created
- [ ] Connection test passes
- [ ] Auth service updated
- [ ] Chat service updated
- [ ] Server starts without errors
- [ ] All API endpoints working
- [ ] Data persistence verified

## 🆘 Troubleshooting

### Connection Issues

- Verify your Supabase URL and API keys
- Check if your Supabase project is active
- Ensure your IP is not blocked (Supabase allows all IPs by default)

### Permission Issues

- Check Row Level Security policies
- Verify API key permissions
- Ensure tables have correct grants

### Data Issues

- Check table schemas match your interfaces
- Verify foreign key constraints
- Check data types compatibility

## 📚 Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase JavaScript Client](https://supabase.com/docs/reference/javascript)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)
