# 🔐 Token Management System - Complete Guide

## Overview

The Dental Care Management System implements a comprehensive token management system with access tokens, refresh tokens, and secure session management. This system ensures proper authentication, authorization, and security for all users.

## 🏗️ System Architecture

### Token Types

1. **Access Token (JWT)**
   - Short-lived (15 minutes by default)
   - Used for API authentication
   - Contains user information and permissions
   - Automatically expires

2. **Refresh Token**
   - Long-lived (7 days by default)
   - Used to generate new access tokens
   - Stored securely in database
   - Can be revoked manually

### Security Features

- **Token Rotation**: Refresh tokens can be rotated for enhanced security
- **Device Tracking**: Each token is associated with a device
- **Usage Limits**: Refresh tokens have usage limits
- **Automatic Cleanup**: Expired tokens are automatically cleaned up
- **Audit Logging**: All token operations are logged

## ⚙️ Configuration

### Environment Variables

All token settings are configured via environment variables in `.env`:

```env
# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_IN=7d
REFRESH_TOKEN_MAX_USAGE=100
MAX_REFRESH_TOKENS_PER_USER=5

# Token Security
TOKEN_ROTATION_ENABLED=true
TOKEN_CLEANUP_INTERVAL=24h
TOKEN_CLEANUP_BATCH_SIZE=1000
```

### Token Expiry Times

| Token Type | Default | Environment Variable | Description |
|------------|---------|---------------------|-------------|
| Access Token | 15 minutes | `JWT_EXPIRES_IN` | Short-lived for security |
| Refresh Token | 7 days | `REFRESH_TOKEN_EXPIRES_IN` | Long-lived for convenience |
| Remember Me | 30 days | `REFRESH_TOKEN_EXPIRES_IN` | Extended for trusted devices |

## 🔄 Token Lifecycle

### 1. Login Process

```typescript
// User logs in
POST /auth/login
{
  "email": "user@example.com",
  "password": "password123",
  "role": "doctor"
}

// Response includes both tokens
{
  "user": { ... },
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0...",
  "expires_in": 900,
  "token_type": "Bearer",
  "role": "doctor"
}
```

### 2. Token Refresh Process

```typescript
// When access token expires, use refresh token
POST /auth/token/refresh
{
  "refreshToken": "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0..."
}

// Response with new access token
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0...",
    "expiresIn": 900,
    "tokenType": "Bearer"
  }
}
```

### 3. Logout Process

```typescript
// Revoke current refresh token
POST /auth/token/revoke
{
  "refreshToken": "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0..."
}

// Or revoke all tokens for user
POST /auth/token/revoke-all
```

## 🛡️ Security Features

### 1. Token Validation

- **Access Token**: Validated on every API request
- **Refresh Token**: Validated when refreshing access token
- **Expiry Check**: Automatic expiry validation
- **Usage Limits**: Refresh token usage tracking

### 2. Device Management

- **Device Tracking**: Each token is associated with a device
- **Device Limits**: Maximum tokens per user (configurable)
- **Device Information**: IP address, user agent, device name

### 3. Token Cleanup

- **Automatic Cleanup**: Expired tokens are cleaned up hourly
- **Manual Cleanup**: Admins can force cleanup
- **Remember Me Cleanup**: Old remember me tokens are cleaned up daily

## 📊 Token Management APIs

### Authentication Endpoints

| Endpoint | Method | Description | Auth Required |
|----------|--------|-------------|---------------|
| `/auth/login` | POST | Login and get tokens | No |
| `/auth/token/refresh` | POST | Refresh access token | No |
| `/auth/token/revoke` | POST | Revoke refresh token | Yes |
| `/auth/token/revoke-all` | POST | Revoke all user tokens | Yes |
| `/auth/token/tokens` | GET | Get user's active tokens | Yes |
| `/auth/token/stats` | GET | Get token statistics | Admin |

### Token Information

Each refresh token contains:

```typescript
{
  id: "token_id",
  deviceName: "Chrome Browser",
  deviceId: "device-123",
  lastUsedAt: "2024-01-15T10:30:00Z",
  createdAt: "2024-01-15T09:00:00Z",
  expiresAt: "2024-01-22T09:00:00Z",
  isRememberMe: false,
  usageCount: 5,
  maxUsageCount: 100,
  ipAddress: "192.168.1.100",
  userAgent: "Mozilla/5.0..."
}
```

## 🔧 Implementation Details

### Database Schema

```typescript
// RefreshToken Schema
{
  token: string,           // Unique refresh token
  userId: string,          // User ID
  userEmail: string,       // User email
  userRole: string,        // User role
  organizationId?: string, // Organization context
  branchId?: string,       // Branch context
  status: TokenStatus,     // ACTIVE, REVOKED, EXPIRED
  expiresAt: Date,         // Expiration date
  lastUsedAt?: Date,       // Last usage
  ipAddress?: string,      // IP address
  userAgent?: string,      // User agent
  deviceId?: string,       // Device identifier
  deviceName?: string,     // Device name
  usageCount: number,      // Usage counter
  maxUsageCount: number,   // Usage limit
  isRememberMe: boolean,   // Remember me flag
  // ... other fields
}
```

### Token Service Methods

```typescript
// Generate new token pair
async generateTokenPair(user, context): Promise<TokenPair>

// Refresh access token
async refreshAccessToken(refreshToken, context): Promise<TokenPair>

// Validate access token
async validateAccessToken(token): Promise<TokenValidationResult>

// Revoke refresh token
async revokeRefreshToken(refreshToken, revokedBy, reason): Promise<boolean>

// Revoke all user tokens
async revokeAllUserTokens(userId, revokedBy, reason): Promise<number>

// Get user's active tokens
async getUserRefreshTokens(userId): Promise<RefreshTokenDocument[]>

// Clean up expired tokens
async cleanupExpiredTokens(): Promise<number>
```

## 📈 Monitoring & Analytics

### Token Statistics

```typescript
// Get token statistics
GET /auth/token/stats

// Response
{
  "success": true,
  "data": {
    "totalTokens": 150,
    "activeTokens": 120,
    "expiredTokens": 20,
    "revokedTokens": 10,
    "uniqueUserCount": 45
  }
}
```

### Audit Logging

All token operations are logged:

- **Token Generation**: When new tokens are created
- **Token Refresh**: When access tokens are refreshed
- **Token Revocation**: When tokens are revoked
- **Token Cleanup**: When tokens are cleaned up
- **Security Events**: Failed token operations

## 🚨 Security Best Practices

### 1. Token Storage

- **Access Token**: Store in memory or secure storage
- **Refresh Token**: Store securely (encrypted if possible)
- **Never**: Store tokens in localStorage for production

### 2. Token Transmission

- **HTTPS Only**: Always use HTTPS in production
- **Secure Headers**: Use secure cookie attributes
- **CORS**: Configure CORS properly

### 3. Token Rotation

- **Regular Rotation**: Rotate refresh tokens periodically
- **Suspicious Activity**: Rotate tokens on suspicious activity
- **Logout**: Revoke tokens on logout

### 4. Monitoring

- **Usage Patterns**: Monitor token usage patterns
- **Failed Attempts**: Monitor failed token operations
- **Suspicious Activity**: Alert on suspicious token usage

## 🔄 Frontend Integration

### 1. Login Flow

```javascript
// Login and store tokens
const login = async (credentials) => {
  const response = await fetch('/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials)
  });
  
  const data = await response.json();
  
  // Store tokens securely
  localStorage.setItem('access_token', data.access_token);
  localStorage.setItem('refresh_token', data.refresh_token);
  
  return data;
};
```

### 2. Token Refresh

```javascript
// Automatic token refresh
const refreshToken = async () => {
  const refreshToken = localStorage.getItem('refresh_token');
  
  const response = await fetch('/auth/token/refresh', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken })
  });
  
  const data = await response.json();
  
  if (data.success) {
    localStorage.setItem('access_token', data.data.accessToken);
    return data.data.accessToken;
  } else {
    // Redirect to login
    window.location.href = '/login';
  }
};
```

### 3. API Request with Token

```javascript
// Make API request with token
const apiRequest = async (url, options = {}) => {
  let accessToken = localStorage.getItem('access_token');
  
  // Check if token is expired
  if (isTokenExpired(accessToken)) {
    accessToken = await refreshToken();
  }
  
  return fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': `Bearer ${accessToken}`
    }
  });
};
```

## 🛠️ Troubleshooting

### Common Issues

1. **Token Expired**
   - **Cause**: Access token has expired
   - **Solution**: Use refresh token to get new access token

2. **Invalid Refresh Token**
   - **Cause**: Refresh token is invalid or expired
   - **Solution**: User needs to login again

3. **Token Not Found**
   - **Cause**: Token was revoked or doesn't exist
   - **Solution**: User needs to login again

4. **Usage Limit Exceeded**
   - **Cause**: Refresh token usage limit reached
   - **Solution**: Generate new token pair

### Debug Information

Enable debug logging to troubleshoot token issues:

```env
LOG_LEVEL=debug
AUDIT_LOG_LEVEL=DEBUG
```

## 📋 Configuration Examples

### Development Environment

```env
JWT_EXPIRES_IN=1h
REFRESH_TOKEN_EXPIRES_IN=7d
MAX_REFRESH_TOKENS_PER_USER=10
```

### Production Environment

```env
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_IN=7d
MAX_REFRESH_TOKENS_PER_USER=5
TOKEN_ROTATION_ENABLED=true
```

### High Security Environment

```env
JWT_EXPIRES_IN=5m
REFRESH_TOKEN_EXPIRES_IN=1d
MAX_REFRESH_TOKENS_PER_USER=3
TOKEN_ROTATION_ENABLED=true
```

This comprehensive token management system provides secure, scalable, and maintainable authentication for the Dental Care Management System.
