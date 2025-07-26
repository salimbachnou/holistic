# Email Verification System

## Overview

The email verification system ensures that users verify their email addresses before they can access the platform. This adds an extra layer of security and helps maintain data quality.

## Features

### ✅ Backend Implementation
- **User Model Updates**: Added verification fields to User schema
- **Email Service**: Integrated verification email functionality
- **Registration Flow**: Users are created as unverified by default
- **Login Protection**: Unverified users cannot log in
- **Verification Endpoints**: Complete API for verification process
- **Resend Functionality**: Users can request new verification codes
- **Token Expiration**: Verification codes expire after 15 minutes

### ✅ Frontend Implementation
- **Verification Page**: Dedicated page for entering verification codes
- **Registration Flow**: Redirects to verification when needed
- **Login Handling**: Shows verification message for unverified accounts
- **Resend Feature**: Users can request new codes with cooldown
- **Auto-login**: Users are automatically logged in after verification

## Database Schema Changes

### User Model Updates
```javascript
// Email verification fields
emailVerificationToken: {
  type: String,
  default: null
},
emailVerificationExpiry: {
  type: Date,
  default: null
},
emailVerified: {
  type: Boolean,
  default: false
},
emailVerifiedAt: {
  type: Date,
  default: null
}
```

## API Endpoints

### 1. Registration (Updated)
```http
POST /api/auth/register
POST /api/auth/register/professional
```

**Response for verification required:**
```json
{
  "success": true,
  "message": "Inscription réussie. Veuillez vérifier votre email pour activer votre compte.",
  "requiresVerification": true,
  "email": "user@example.com"
}
```

### 2. Login (Updated)
```http
POST /api/auth/login
```

**Response for unverified account:**
```json
{
  "message": "Votre compte n'est pas encore vérifié. Veuillez vérifier votre email et entrer le code de vérification.",
  "requiresVerification": true,
  "email": "user@example.com"
}
```

### 3. Email Verification
```http
POST /api/auth/verify-email
```

**Request:**
```json
{
  "email": "user@example.com",
  "code": "123456"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Email vérifié avec succès. Votre compte est maintenant actif.",
  "token": "jwt_token_here",
  "user": {
    "id": "user_id",
    "email": "user@example.com",
    "emailVerified": true,
    // ... other user data
  }
}
```

### 4. Resend Verification Code
```http
POST /api/auth/resend-verification
```

**Request:**
```json
{
  "email": "user@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Nouveau code de vérification envoyé à votre email."
}
```

## Email Templates

### Verification Email
- **Subject**: "Vérification de votre compte - Holistic.ma"
- **Content**: Professional HTML template with verification code
- **Features**:
  - 6-digit verification code
  - 15-minute expiration
  - Responsive design
  - Branded styling

## Frontend Routes

### New Route
```javascript
<Route path="/verify-email" element={<EmailVerificationPage />} />
```

### Updated Routes
- Registration pages now redirect to verification when needed
- Login page handles unverified account responses
- AuthContext updated to handle verification flow

## User Flow

### 1. Registration Flow
```
User fills registration form
    ↓
Account created (unverified)
    ↓
Verification email sent
    ↓
Redirect to /verify-email
    ↓
User enters verification code
    ↓
Account verified & auto-login
    ↓
Redirect to appropriate dashboard
```

### 2. Login Flow (Unverified Account)
```
User attempts login
    ↓
System detects unverified account
    ↓
Redirect to /verify-email
    ↓
User enters verification code
    ↓
Account verified & auto-login
    ↓
Redirect to appropriate dashboard
```

### 3. Resend Flow
```
User clicks "Resend code"
    ↓
60-second cooldown starts
    ↓
New verification email sent
    ↓
User can enter new code
```

## Security Features

### ✅ Token Security
- **Random Generation**: 6-digit codes generated randomly
- **Expiration**: 15-minute timeout for security
- **One-time Use**: Tokens are cleared after verification
- **Rate Limiting**: Resend has 60-second cooldown

### ✅ Validation
- **Email Format**: Validates email addresses
- **Code Format**: Ensures 6-digit numeric codes
- **Expiration Check**: Validates token hasn't expired
- **Duplicate Prevention**: Prevents re-verification

### ✅ Error Handling
- **Graceful Degradation**: Works without email service
- **User-Friendly Messages**: Clear error messages
- **Fallback Behavior**: Users created as verified if email fails
- **Existing User Handling**: If user exists but is unverified, sends new verification code

## Configuration

### Environment Variables
```env
# Email Configuration (Required for verification emails)
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# Optional: Email service settings
EMAIL_FROM_NAME=Holistic.ma
EMAIL_FROM_ADDRESS=noreply@holistic.ma
```

### Email Service Setup
1. **Gmail Setup**:
   - Enable 2-factor authentication
   - Generate app password
   - Use app password in EMAIL_PASS

2. **Alternative Services**:
   - Update emailService.js for other providers
   - Configure SMTP settings in admin panel

## Testing

### Manual Testing
1. **Registration Test**:
   - Register new user
   - Check verification email received
   - Verify account with code
   - Confirm auto-login works

2. **Login Test**:
   - Try login with unverified account
   - Verify redirect to verification page
   - Complete verification process

3. **Resend Test**:
   - Request new verification code
   - Verify cooldown works
   - Test with expired codes

### Automated Testing
```bash
# Run verification test script
cd backend
node test-verification.js
```

## Fallback Behavior

### Email Service Unavailable
If email service is not configured:
- Users are created as verified automatically
- No verification emails sent
- Registration completes normally
- Users can login immediately

### Error Handling
- **Network Issues**: Graceful error messages
- **Invalid Codes**: Clear feedback to user
- **Expired Codes**: Option to request new code
- **Server Errors**: User-friendly error pages

## Migration Notes

### Existing Users
- Existing users are not affected
- No migration required for current users
- New registrations will require verification

### Database Migration
```javascript
// Optional: Mark existing users as verified
db.users.updateMany(
  { emailVerified: { $exists: false } },
  { $set: { emailVerified: true, emailVerifiedAt: new Date() } }
);
```

## Future Enhancements

### Planned Features
- [ ] **SMS Verification**: Add SMS as alternative
- [ ] **Two-Factor Auth**: Integrate with 2FA system
- [ ] **Admin Verification**: Manual verification by admins
- [ ] **Bulk Operations**: Admin tools for bulk verification
- [ ] **Analytics**: Track verification rates and success

### Security Improvements
- [ ] **Rate Limiting**: Implement API rate limiting
- [ ] **IP Tracking**: Track verification attempts by IP
- [ ] **Device Fingerprinting**: Enhanced security measures
- [ ] **Audit Logging**: Log all verification attempts

## Troubleshooting

### Common Issues

1. **Registration Fails with Existing Email**:
   - **Issue**: User tries to register with email that already exists
   - **Solution**: System now sends new verification code to existing unverified users
   - **Behavior**: User gets success message and redirected to verification

2. **Email Service Errors**:
   - **Issue**: `nodemailer.createTransporter is not a function` error
   - **Solution**: Fixed typo in emailService.js (should be `createTransport`)
   - **Status**: ✅ Fixed

3. **Emails Not Sending**:
   - Check email configuration
   - Verify SMTP settings
   - Check firewall/network restrictions

4. **Verification Codes Not Working**:
   - Check code expiration (15 minutes)
   - Verify code format (6 digits)
   - Check database for token storage

5. **Frontend Issues**:
   - Verify route configuration
   - Check AuthContext updates
   - Test navigation flow

### Debug Steps
1. Check backend logs for email errors
2. Verify database schema updates
3. Test API endpoints directly
4. Check frontend console for errors
5. Verify email service configuration

## Support

For issues or questions:
- Check the logs for detailed error messages
- Verify all environment variables are set
- Test email service configuration
- Review the troubleshooting section above 