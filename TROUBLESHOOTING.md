# Firebase Configuration Troubleshooting

## Common Issues and Solutions

### 1. "Invalid API Key" Error

**Possible Causes:**
- API key is restricted to specific domains
- Firebase project is not properly configured
- Wrong project ID or configuration

**Solutions:**

#### A. Check Firebase Console Settings
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `ktufy-8428e`
3. Go to Project Settings (gear icon)
4. Check if the API key is correct: `AIzaSyAmY_IqguUIlHKJeJtenCC3LLvqVh-0N_w`

#### B. Enable Authentication
1. In Firebase Console, go to Authentication
2. Click "Get started" if not already set up
3. Go to "Sign-in method" tab
4. Enable "Email/Password" provider

#### C. Check API Key Restrictions
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project: `ktufy-8428e`
3. Go to APIs & Services > Credentials
4. Find your API key and check restrictions
5. If restricted, add your domain or remove restrictions for testing

### 2. Environment Variables Not Loading

**Solution:**
The app now uses a fallback configuration. If environment variables don't load, it will use the hardcoded values.

### 3. Test Firebase Configuration

Run this test to verify your configuration:

```bash
node testFirebase.js
```

### 4. Alternative Configuration

If the current configuration doesn't work, try creating a new Firebase project:

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project"
3. Name it "KTUfy" or similar
4. Follow the setup wizard
5. Enable Authentication > Email/Password
6. Get the new configuration and update the values

### 5. Update Configuration

If you get new Firebase keys, update them in:
- `firebaseConfig.ts` (hardcoded values)
- `.env` file (environment variables)

### 6. Common Error Messages

- **"Invalid API key"**: Check API key restrictions or project settings
- **"Project not found"**: Verify project ID is correct
- **"Authentication not enabled"**: Enable Email/Password in Firebase Console
- **"Domain not authorized"**: Add your domain to authorized domains

### 7. Testing Steps

1. **Test Firebase Connection:**
   ```javascript
   // Add this to your app temporarily
   import { auth } from './firebaseConfig';
   console.log('Auth object:', auth);
   ```

2. **Test Authentication:**
   - Try creating a new account
   - Try logging in with existing account
   - Check console for error messages

3. **Check Network:**
   - Ensure internet connection
   - Check if Firebase services are accessible

### 8. Emergency Fix

If nothing works, use this minimal configuration:

```javascript
const firebaseConfig = {
  apiKey: "YOUR_NEW_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.firebasestorage.app",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};
```

Replace with your actual Firebase configuration values.
