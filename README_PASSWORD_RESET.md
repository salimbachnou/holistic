# Password Reset Functionality

This document describes the password reset functionality implemented in the Holistic.ma application.

## Overview

The password reset system allows users to reset their passwords via email when they forget them. The system uses secure tokens with expiration times to ensure security.

## Features

- ✅ Send password reset emails with nodemailer
- ✅ Secure token generation with expiration (1 hour)
- ✅ Email templates with professional styling
- ✅ Frontend integration with React forms
- ✅ Backend API endpoints for forgot/reset password
- ✅ User model updated with reset token fields
- ✅ Security measures (no user enumeration)

## Backend Implementation

### API Endpoints

#### 1. Forgot Password
```http
POST /api/auth/forgot-password
Content-Type: application/json

{
  "email": "user@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Si cette adresse email existe dans notre système, vous recevrez un lien de réinitialisation."
}
```

#### 2. Reset Password
```http
POST /api/auth/reset-password/:token
Content-Type: application/json

{
  "password": "newpassword123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Mot de passe réinitialisé avec succès"
}
```

### Database Schema

The User model has been updated with the following fields:

```javascript
{
  resetPasswordToken: {
    type: String,
    default: null
  },
  resetPasswordExpiry: {
    type: Date,
    default: null
  }
}
```

### Email Configuration

The system uses the existing email service with nodemailer. Make sure these environment variables are set:

```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
EMAIL_FROM_NAME=Holistic.ma
FRONTEND_URL=http://localhost:3000
```

### Security Features

1. **Token Expiration**: Reset tokens expire after 1 hour
2. **No User Enumeration**: Same response whether user exists or not
3. **Secure Token Generation**: Uses crypto.randomBytes(32)
4. **Token Cleanup**: Tokens are cleared after successful reset

## Frontend Implementation

### Pages

#### 1. Forgot Password Page (`/forgot-password`)
- Email input form
- Success/error message display
- Link back to login page

#### 2. Reset Password Page (`/reset-password/:token`)
- New password and confirmation inputs
- Token validation
- Success message with auto-redirect

### AuthContext Integration

The AuthContext now includes:

```javascript
const {
  sendPasswordResetEmail,
  resetPassword
} = useAuth();
```

### Usage Example

```javascript
// Send reset email
try {
  await sendPasswordResetEmail('user@example.com');
  setSuccessMessage('Email sent successfully');
} catch (error) {
  setError(error.message);
}

// Reset password
try {
  await resetPassword(token, newPassword);
  navigate('/login');
} catch (error) {
  setError(error.message);
}
```

## Email Template

The reset email includes:
- Professional styling with Holistic.ma branding
- Clear call-to-action button
- Fallback link for copying/pasting
- Security information about token expiration
- Contact information for support

## Testing

### Manual Testing

1. **Test Forgot Password:**
   - Go to `/forgot-password`
   - Enter a valid email address
   - Check email for reset link

2. **Test Reset Password:**
   - Click the reset link in email
   - Enter new password
   - Confirm successful reset

### Automated Testing

Run the test script:
```bash
cd backend
node test-password-reset.js
```

## Error Handling

### Backend Errors
- Invalid email format
- Token expired/invalid
- Server errors

### Frontend Errors
- Network errors
- Validation errors
- Token missing from URL

## Security Considerations

1. **Rate Limiting**: Consider implementing rate limiting for reset requests
2. **Email Verification**: Tokens are only sent to verified email addresses
3. **HTTPS**: Always use HTTPS in production
4. **Token Storage**: Tokens are stored securely in database, not in URLs permanently

## Deployment Notes

### Environment Variables
Make sure all email configuration variables are set in production:
- `EMAIL_HOST`
- `EMAIL_PORT`
- `EMAIL_USER`
- `EMAIL_PASS`
- `EMAIL_FROM_NAME`
- `FRONTEND_URL`

### Email Service
- Configure your email service (Gmail, SendGrid, etc.)
- Use app passwords for Gmail
- Test email delivery in production environment

## Troubleshooting

### Common Issues

1. **Emails not sending:**
   - Check email configuration
   - Verify SMTP settings
   - Check firewall/network restrictions

2. **Invalid token errors:**
   - Check token expiration (1 hour limit)
   - Verify token format in URL
   - Ensure token exists in database

3. **Frontend routing issues:**
   - Verify route configuration in App.jsx
   - Check token parameter in URL

### Debug Steps

1. Check backend logs for email sending errors
2. Verify database connection and user model
3. Test API endpoints directly with curl/Postman
4. Check browser network tab for API calls

## Future Enhancements

- [ ] Add rate limiting for reset requests
- [ ] Implement email templates with better styling
- [ ] Add password strength requirements
- [ ] Implement account lockout after multiple failed attempts
- [ ] Add audit logging for security events
- [ ] Support for multiple email providers 