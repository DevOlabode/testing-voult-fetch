# Google OAuth Authorization Code Flow Implementation Guide

This guide explains how to set up and use Google OAuth in your test app using the Voult server's authorization code flow.

## Overview

The implementation uses the **OAuth 2.0 Authorization Code Flow**, which is more secure than the implicit flow and allows for server-side token exchange. Here's how it works:

1. User clicks "Sign in with Google" button
2. Your app requests an authorization URL from your Voult server
3. User is redirected to Google to log in
4. Google redirects back to your app with an authorization code
5. Your app sends the code to your Voult server
6. Your server exchanges the code for tokens with Google
7. Your server forwards the user info to Voult API for login/register
8. Tokens are returned and stored in your app

## Prerequisites

1. **Google Cloud Console Project** with OAuth 2.0 credentials
2. **Voult App** with Google OAuth configured
3. **Node.js** environment running your test app

## Step 1: Set Up Google OAuth in Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the **Google+ API**:
   - Go to "APIs & Services" > "Library"
   - Search for "Google+ API" and enable it
4. Create OAuth 2.0 credentials:
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth client ID"
   - Select "Web application"
   - Add authorized redirect URI: `http://localhost:5050/oauth/google/callback` (for development)
   - For production, add your production URL: `https://your-domain.com/oauth/google/callback`
5. Note your **Client ID** and **Client Secret**

## Step 2: Configure Your Voult App

1. Log in to your Voult dashboard
2. Go to your app settings
3. Add Google OAuth credentials:
   - Google Client ID (from Google Cloud Console)
   - Google Client Secret (from Google Cloud Console)
   - Redirect URI: `http://localhost:5050/oauth/google/callback` (or your production URL)

## Step 3: Configure Your Test App Environment

Update your `.env` file with your Google OAuth credentials:

```env
# Google OAuth Credentials for Authorization Code Flow
GOOGLE_CLIENT_ID = your_google_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET = your_google_client_secret
API_BASE_URL = http://localhost:5050
```

## Step 4: API Endpoints

Your Voult server now provides these endpoints:

### 1. Generate Authorization URL
**POST** `/api/oauth/google/authorize`

**Request Body:**
```json
{
  "intent": "login",  // or "register"
  "redirectUri": "http://localhost:5050/oauth/google/callback"
}
```

**Response:**
```json
{
  "success": true,
  "authUrl": "https://accounts.google.com/o/oauth2/v2/auth?client_id=..."
}
```

### 2. Handle OAuth Callback
**GET** `/api/oauth/google/callback?code=...&state=...`

This endpoint:
- Validates the state parameter
- Exchanges the authorization code for tokens
- Retrieves user info from Google
- Forwards to Voult API for login/register
- Returns access and refresh tokens

**Response:**
```json
{
  "success": true,
  "data": {
    "accessToken": "jwt_token_here",
    "refreshToken": "refresh_token_here"
  },
  "userInfo": {
    "email": "user@gmail.com",
    "name": "User Name",
    "picture": "https://..."
  }
}
```

## Step 5: Frontend Integration

The frontend implementation is already included in `public/js/google-oauth-code-flow.js`. It automatically:

1. Initializes Google OAuth buttons on login/register pages
2. Handles the authorization flow
3. Processes callbacks
4. Stores tokens in localStorage
5. Redirects users after successful authentication

### Using the OAuth Flow in Custom Pages

If you want to add Google OAuth to a custom page:

```html
<!-- Add a container for the button -->
<div id="google-login-btn" class="google-oauth-container"></div>

<!-- Include the script -->
<script src="/js/google-oauth-code-flow.js"></script>
```

The script will automatically initialize the button.

## Step 6: Testing the Flow

1. **Start your server:**
   ```bash
   npm start
   ```

2. **Visit the login page:**
   - Go to `http://localhost:5050/login`
   - Click "Sign in with Google"

3. **Complete Google login:**
   - You'll be redirected to Google
   - Log in with your Google account
   - Grant permissions

4. **Callback processing:**
   - You'll be redirected back to your app
   - The code will be exchanged for tokens
   - You'll be redirected to the dashboard

5. **Verify authentication:**
   - Check localStorage for `accessToken` and `refreshToken`
   - You should be logged in on the dashboard

## Troubleshooting

### Common Issues

1. **"Google Client ID not configured"**
   - Make sure `GOOGLE_CLIENT_ID` is set in your `.env` file
   - Restart your server after updating `.env`

2. **"Invalid state parameter"**
   - The state parameter may have expired (it includes a timestamp)
   - Try the flow again

3. **"redirect_uri_mismatch"**
   - Ensure the redirect URI in Google Cloud Console exactly matches your app's callback URL
   - Include the full path: `http://localhost:5050/oauth/google/callback`

4. **"OAuth callback failed"**
   - Check your Google Cloud Console credentials
   - Verify your Voult app has Google OAuth configured correctly
   - Check server logs for detailed error messages

### Debug Mode

To debug, check the server console logs. The implementation logs:
- Authorization URL generation errors
- Token exchange errors
- User info retrieval errors
- Voult API errors

## Security Considerations

1. **HTTPS in Production**: Google OAuth requires HTTPS. Use HTTPS for your production redirect URIs.

2. **State Parameter**: The implementation includes a state parameter with:
   - Intent (login/register)
   - App ID
   - Redirect URI
   - Timestamp
   This prevents CSRF attacks.

3. **Token Storage**: Tokens are stored in localStorage. For enhanced security, consider:
   - Using httpOnly cookies
   - Implementing token refresh logic
   - Adding token expiration handling

4. **CORS**: If your frontend is on a different domain, configure CORS on your server.

## Backward Compatibility

The legacy ID token flow endpoints are still available:
- `POST /google/login`
- `POST /google/register`

These use the Google Identity Services (GIS) button approach and are kept for backward compatibility.

## API Reference

### Controller Methods

- `generateAuthUrl(req, res)` - Generates Google OAuth authorization URL
- `handleCallback(req, res)` - Handles OAuth callback and token exchange
- `googleLogin(req, res)` - Legacy login with ID token
- `googleRegister(req, res)` - Legacy register with ID token

### Route Paths

```
POST   /api/oauth/google/authorize    - Generate auth URL
GET    /api/oauth/google/callback     - Handle callback
POST   /google/login                  - Legacy login
POST   /google/register               - Legacy register
GET    /api/config                    - Get app configuration
```

## Additional Resources

- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Voult API Documentation](https://voult.dev/docs)
- [OAuth 2.0 Playground](https://developers.google.com/oauthplayground/)

## Support

If you encounter issues:
1. Check the server logs
2. Verify your Google Cloud Console configuration
3. Verify your Voult app configuration
4. Review this guide for common pitfalls

---

**Note**: This implementation follows the OAuth 2.0 Authorization Code Flow with PKCE-like security through state parameter validation.