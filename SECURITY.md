# Security Documentation

This document outlines the security measures implemented in the Flash Speaking application.

## Security Improvements Implemented

### 1. Environment Variable Protection
- **Issue**: API keys and Firebase configuration were hardcoded in source files
- **Fix**: Moved all sensitive configuration to environment variables
- **Files Modified**: `src/firebase.js`, `src/hooks/useGemini.js`
- **Action Required**: Create a `.env` file based on `.env.example` and add your API keys

### 2. Input Sanitization
- **Issue**: User inputs were not sanitized, potentially allowing XSS attacks
- **Fix**: Implemented comprehensive input sanitization utilities
- **Files Modified**:
  - Created `src/utils/sanitization.js`
  - Updated `src/components/Dashboard.jsx`
  - Updated `src/App.jsx`
- **Features**:
  - Remove dangerous characters (`<>{}[]\\/`)
  - Maximum length enforcement (100 characters for inputs)
  - Special sanitization for speech synthesis
  - HTML tag removal

### 3. Prompt Injection Prevention
- **Issue**: User inputs were directly concatenated into AI prompts without sanitization
- **Fix**: Added `sanitizeForPrompt()` function to prevent prompt injection attacks
- **Files Modified**: `src/hooks/useGemini.js`
- **Features**:
  - Remove newlines, quotes, and backticks
  - Filter instruction-like keywords (ignore, disregard, forget, system, etc.)
  - Collapse multiple spaces

### 4. Input Validation
- **Issue**: No length limits or validation on user inputs
- **Fix**: Added `maxLength` attributes and validation utilities
- **Files Modified**: `src/components/Dashboard.jsx`, `src/utils/sanitization.js`
- **Features**:
  - Maximum length: 100 characters for job/interests fields
  - Validation helper function for custom validation rules

### 5. Production Logging Protection
- **Issue**: Console.log statements could leak sensitive information in production
- **Fix**: Wrapped all debug console.log statements with `import.meta.env.DEV` checks
- **Files Modified**:
  - `src/hooks/useGemini.js`
  - `src/hooks/useAuth.js`
  - `src/App.jsx`

### 6. Speech Synthesis Sanitization
- **Issue**: Unsanitized text passed to speech synthesis API
- **Fix**: Added `sanitizeForSpeech()` to remove HTML tags and limit length
- **Files Modified**: `src/App.jsx`

## Security Best Practices

### For Developers

1. **Never commit `.env` files**: The `.env` file is in `.gitignore` and should never be committed
2. **Use environment variables**: Always use environment variables for sensitive data
3. **Sanitize user inputs**: Use the sanitization utilities in `src/utils/sanitization.js`
4. **Validate inputs**: Always validate user inputs before processing
5. **Guard console.log**: Wrap debug logs with `if (import.meta.env.DEV)`

### For Deployment

1. **Set environment variables**: Configure all variables listed in `.env.example`
2. **Firebase Security Rules**: Ensure Firestore security rules are properly configured
3. **HTTPS only**: Always deploy with HTTPS enabled
4. **Regular updates**: Keep dependencies updated to patch security vulnerabilities

## Firebase Security Rules

Ensure your Firestore has proper security rules. Example:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /artifacts/{appId}/contentPool/{contentId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }

    match /artifacts/{appId}/users/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

## Remaining Considerations

### API Key Security
- **Gemini API Key**: Keep this secret. Consider implementing a backend proxy in production
- **Firebase API Key**: While safe to expose (used for project identification), ensure Firebase Security Rules are strict

### Future Enhancements
1. Consider implementing rate limiting for API calls
2. Add CSRF protection if implementing authentication beyond anonymous
3. Implement Content Security Policy (CSP) headers
4. Add request validation on Firebase Cloud Functions if using backend processing
5. Consider implementing API key rotation procedures

## Reporting Security Issues

If you discover a security vulnerability, please report it to the repository maintainers immediately. Do not create public issues for security vulnerabilities.
