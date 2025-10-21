# Supabase Setup for KTUfy

## Prerequisites
- A Supabase account
- Your Supabase project created

## Setup Steps

### 1. Configure Environment Variables
Make sure your `.env` file has the correct Supabase credentials:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
```

These values can be found in your Supabase Dashboard under **Settings** > **API**.

### 2. Run Database Migrations

1. Go to your Supabase Dashboard
2. Navigate to **SQL Editor**
3. Create a new query
4. Copy and paste the entire contents of `supabase_schema.sql`
5. Click **Run** to execute the migration

This will create:
- `users` table for user profiles
- `ticklists` table for study checklists
- `game_stats` table for Learning Zone progress
- `coding_progress` table for Coding Hub stats
- Row Level Security (RLS) policies for data protection
- Automatic `updated_at` triggers

### 3. Verify Setup

After running the migration, verify in your Supabase Dashboard:

1. **Table Editor** - Check that all 4 tables exist:
   - `users`
   - `ticklists`
   - `game_stats`
   - `coding_progress`

2. **Authentication** - Make sure Email authentication is enabled under **Authentication** > **Providers**

### 4. Test the App

1. Start the Expo development server:
   ```bash
   npx expo start --clear
   ```

2. The app should now load without network errors

3. Try creating a new account to test the database integration

## Troubleshooting

### Network Request Failed
- Make sure your Supabase URL and keys are correct in `.env`
- Verify that the database tables have been created
- Check that RLS policies are in place

### Table Does Not Exist
- Run the SQL migration in Supabase SQL Editor
- Make sure the queries executed without errors

### Authentication Issues
- Enable Email authentication in Supabase Dashboard
- Check if email confirmations are required (can be disabled for development)

## Next Steps

### Optional: Disable Email Confirmation for Development

1. Go to **Authentication** > **Settings**
2. Disable "Enable email confirmations"
3. This allows instant signup without email verification

### Add Test Data

You can add some test data through the Supabase Table Editor for testing purposes.

## Database Schema Overview

```
users
├─ id (UUID, references auth.users)
├─ name (TEXT)
├─ email (TEXT)
├─ registration_number (TEXT)
├─ college (TEXT)
├─ branch (TEXT)
└─ timestamps

ticklists
├─ id (UUID)
├─ user_id (UUID, references auth.users)
├─ subject_name (TEXT)
├─ code (TEXT)
├─ color (TEXT)
├─ items (JSONB)
└─ timestamps

game_stats
├─ id (UUID)
├─ user_id (UUID, references auth.users)
├─ memory_best_score (INTEGER)
├─ quiz_score (INTEGER)
├─ daily_streak (INTEGER)
├─ total_points (INTEGER)
├─ achievements (JSONB)
└─ timestamps

coding_progress
├─ id (UUID)
├─ user_id (UUID, references auth.users)
├─ completed_problems (JSONB)
├─ total_attempts (INTEGER)
├─ successful_runs (INTEGER)
└─ timestamps
```

All tables have Row Level Security enabled to ensure users can only access their own data.
