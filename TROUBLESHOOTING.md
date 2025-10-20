# Supabase Configuration Troubleshooting

## Common Issues and Solutions

### 1. Authentication Errors

**Possible Causes:**
- Incorrect SUPABASE_URL or SUPABASE_ANON_KEY
- Auth settings in Supabase project (e.g., email confirmations required)

**Solutions:**

1. Confirm your Supabase project URL and ANON key in `.env` match values from the Supabase dashboard.
2. In Supabase Console, go to Authentication > Settings and check whether email confirmations are required for sign-in.

### 2. Environment Variables Not Loading

**Solution:**
Copy `.env.example` to `.env` and fill the values. For Expo, ensure you either use `react-native-dotenv` or inject env vars at build time with EAS.

### 3. Test Supabase Connection

Add a small test snippet to verify the client is configured:

```javascript
import supabase from './supabaseClient';
async function test() {
  const { data, error } = await supabase.from('users').select('*').limit(1);
  console.log({ data, error });
}
test();
```

### 4. Data Access Issues

If you cannot read/write to tables, check:

- RLS (Row Level Security) policies in Supabase - either disable RLS for testing or create policies that allow authenticated users to read/write their rows.
- Ensure your tables have a `user_id` column that references `auth.users` for secure access.

### 5. Update Configuration

If you update keys, place them in `.env` or your CI/EAS secrets, and restart the dev server.

### 6. Testing Steps

1. **Test Supabase Client:**
   ```javascript
   import supabase from './supabaseClient';
   console.log('Supabase client:', supabase);
   ```

2. **Test Authentication:**
   - Try signing up and signing in from the app
   - Check the Supabase Auth logs in the dashboard

3. **Check Network:**
   - Ensure internet connection
   - Confirm Supabase services are accessible from your network

