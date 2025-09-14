# 🔍 Audit Logging System - Comprehensive Guide

## Overview

The Dental Care Management System includes a comprehensive audit logging system that tracks every activity, ensuring complete accountability and traceability. This system logs all user actions, system events, and security-related activities.

## 🏗️ System Architecture

### Core Components

1. **AuditLog Schema** - MongoDB collection storing all audit logs
2. **AuditLoggerService** - Central service for logging activities
3. **AuditLoggerMiddleware** - Automatic API request/response logging
4. **AuditController** - API endpoints for viewing and managing logs

### Log Levels

- **CRITICAL** - System-critical events (7 years retention)
- **ERROR** - Error conditions (3 years retention)
- **WARN** - Warning conditions (1 year retention)
- **INFO** - General information (3 months retention)
- **DEBUG** - Debug information (1 month retention)

## 📊 Activity Types Tracked

### Authentication Events
- `LOGIN` - Successful user login
- `LOGOUT` - User logout
- `LOGIN_FAILED` - Failed login attempts
- `PASSWORD_CHANGE` - Password changes
- `TOKEN_REFRESH` - Token refresh events

### User Management
- `USER_CREATED` - New user creation
- `USER_UPDATED` - User profile updates
- `USER_DELETED` - User deletion
- `USER_ACTIVATED` - User account activation
- `USER_DEACTIVATED` - User account deactivation

### Organization Management
- `ORGANIZATION_CREATED` - New organization creation
- `ORGANIZATION_UPDATED` - Organization updates
- `ORGANIZATION_DELETED` - Organization deletion

### Branch Management
- `BRANCH_CREATED` - New branch creation
- `BRANCH_UPDATED` - Branch updates
- `BRANCH_DELETED` - Branch deletion

### File Management
- `FILE_UPLOADED` - File upload events
- `FILE_DELETED` - File deletion events
- `FILE_DOWNLOADED` - File download events

### System Events
- `SYSTEM_STARTUP` - System startup
- `SYSTEM_SHUTDOWN` - System shutdown
- `CONFIGURATION_CHANGED` - Configuration changes

### Security Events
- `SUSPICIOUS_ACTIVITY` - Suspicious behavior
- `UNAUTHORIZED_ACCESS` - Unauthorized access attempts
- `RATE_LIMIT_EXCEEDED` - Rate limiting violations

## 🔧 Implementation Details

### Automatic Logging

The system automatically logs:

1. **All API Requests** - Every API call is logged with:
   - User information
   - Request details (method, endpoint, IP, user agent)
   - Response status and timing
   - Security classification

2. **Authentication Events** - All login/logout activities
3. **Data Changes** - All create, update, delete operations
4. **File Operations** - All file upload/download activities
5. **System Events** - Startup, shutdown, configuration changes

### Manual Logging

Developers can manually log activities using the `AuditLoggerService`:

```typescript
// Log user activity
await this.auditLoggerService.logUserEvent(
  ActivityType.USER_UPDATED,
  'User profile updated',
  {
    userId: user.id,
    userEmail: user.email,
    organizationId: user.organizationId,
    branchId: user.branchId
  },
  oldValues,
  newValues
);

// Log security event
await this.auditLoggerService.logSecurityEvent(
  ActivityType.SUSPICIOUS_ACTIVITY,
  'Multiple failed login attempts detected',
  {
    userId: user.id,
    ipAddress: req.ip,
    securityLevel: 'high'
  }
);
```

## 📈 Audit Log Structure

Each audit log contains:

```typescript
{
  level: LogLevel,
  activityType: ActivityType,
  message: string,
  description: string,
  
  // User Information
  userId?: string,
  userEmail?: string,
  userName?: string,
  userRole?: UserRole,
  
  // Context
  organizationId?: string,
  organizationName?: string,
  branchId?: string,
  branchName?: string,
  
  // Request Information
  ipAddress?: string,
  userAgent?: string,
  requestId?: string,
  endpoint?: string,
  method?: string,
  statusCode?: number,
  responseTime?: number,
  
  // Data Changes
  oldValues?: Record<string, any>,
  newValues?: Record<string, any>,
  
  // Security
  isSecurityEvent: boolean,
  securityLevel?: string,
  
  // System
  module?: string,
  service?: string,
  version?: string,
  
  // Timestamps
  timestamp: Date,
  expiresAt?: Date
}
```

## 🔍 Querying Audit Logs

### API Endpoints

#### Get All Audit Logs
```
GET /audit/logs?userId=123&activityType=LOGIN&level=INFO&limit=100&offset=0
```

#### Get User Activity
```
GET /audit/user/{userId}/activity?limit=50&offset=0
```

#### Get Security Events
```
GET /audit/security-events?limit=100&offset=0
```

#### Get Audit Statistics
```
GET /audit/stats
```

### Query Parameters

- `userId` - Filter by specific user
- `activityType` - Filter by activity type
- `level` - Filter by log level
- `organizationId` - Filter by organization
- `branchId` - Filter by branch
- `startDate` - Filter by start date
- `endDate` - Filter by end date
- `isSecurityEvent` - Filter security events
- `search` - Text search across logs
- `limit` - Number of results (default: 100)
- `offset` - Pagination offset (default: 0)

## 🛡️ Security & Access Control

### Role-Based Access

- **Super Admin** - Can view all logs across all organizations
- **Organization Admin** - Can view logs for their organization
- **Branch Admin** - Can view logs for their branch
- **Other Roles** - Can only view their own logs

### Security Events

Security events are automatically flagged and include:
- Failed login attempts
- Unauthorized access attempts
- Suspicious API usage patterns
- High-privilege operations

## 📊 Analytics & Reporting

### Built-in Statistics

The system provides:
- Total log count
- Error log count
- Security event count
- Unique user count
- Activity breakdown by type

### Custom Queries

You can create custom queries using MongoDB aggregation:

```javascript
// Get daily activity summary
db.auditlogs.aggregate([
  {
    $match: {
      timestamp: { $gte: new Date('2024-01-01') }
    }
  },
  {
    $group: {
      _id: {
        date: { $dateToString: { format: "%Y-%m-%d", date: "$timestamp" } },
        activityType: "$activityType"
      },
      count: { $sum: 1 }
    }
  },
  {
    $sort: { "_id.date": -1, count: -1 }
  }
])
```

## 🔄 Log Management

### Automatic Cleanup

- Logs are automatically cleaned up based on retention policy
- Critical logs: 7 years
- Error logs: 3 years
- Warning logs: 1 year
- Info logs: 3 months
- Debug logs: 1 month

### Manual Cleanup

Super admins can manually trigger cleanup:

```
POST /audit/cleanup
```

## 🚨 Monitoring & Alerts

### Security Monitoring

The system automatically detects:
- Multiple failed login attempts
- Unusual access patterns
- High-privilege operations
- Data export activities

### Performance Monitoring

- API response times
- Error rates
- User activity patterns
- System resource usage

## 📋 Best Practices

### For Developers

1. **Always log important activities** - Use the audit logger for all significant operations
2. **Include context** - Provide user, organization, and branch context
3. **Log before operations** - Log the intent before performing operations
4. **Log errors** - Always log errors with full context
5. **Use appropriate log levels** - Choose the right level for each event

### For Administrators

1. **Regular monitoring** - Check security events regularly
2. **Review access patterns** - Look for unusual user behavior
3. **Monitor failed attempts** - Watch for potential security threats
4. **Archive important logs** - Export critical logs for long-term storage
5. **Set up alerts** - Configure alerts for critical security events

## 🔧 Configuration

### Environment Variables

```env
# Audit logging configuration
AUDIT_LOG_LEVEL=INFO
AUDIT_LOG_RETENTION_DAYS=90
AUDIT_LOG_CLEANUP_INTERVAL=24h
AUDIT_LOG_MAX_SIZE=100MB
```

### Database Indexes

The system creates optimized indexes for:
- Timestamp-based queries
- User-based queries
- Activity type queries
- Security event queries
- Text search queries

## 📚 Examples

### Logging User Creation

```typescript
await this.auditLoggerService.logUserEvent(
  ActivityType.USER_CREATED,
  `New ${role} created: ${user.email}`,
  {
    userId: user._id.toString(),
    userEmail: user.email,
    userName: `${user.firstName} ${user.lastName}`,
    userRole: role as UserRole,
    organizationId: user.organizationId?.toString(),
    branchId: user.branchId?.toString(),
    createdBy: req.user.userId,
    createdByEmail: req.user.email
  },
  null,
  {
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    role: role
  }
);
```

### Logging File Upload

```typescript
await this.auditLoggerService.logFileEvent(
  ActivityType.FILE_UPLOADED,
  `File uploaded: ${file.originalname}`,
  {
    userId: req.user.userId,
    userEmail: req.user.email,
    organizationId: req.user.organizationId,
    branchId: req.user.branchId,
    ipAddress: req.ip,
    userAgent: req.get('User-Agent')
  },
  {
    fileName: file.originalname,
    fileSize: file.size,
    fileType: file.mimetype,
    publicId: result.public_id,
    secureUrl: result.secure_url
  }
);
```

## 🎯 Benefits

1. **Complete Accountability** - Every action is tracked and attributed
2. **Security Compliance** - Meets audit requirements for healthcare systems
3. **Troubleshooting** - Easy to trace issues and user actions
4. **Performance Monitoring** - Track system performance and usage patterns
5. **Compliance Reporting** - Generate reports for regulatory compliance
6. **User Behavior Analysis** - Understand how users interact with the system

This comprehensive audit logging system ensures that every action in the Dental Care Management System is properly tracked, providing complete transparency and accountability for all users and administrators.
