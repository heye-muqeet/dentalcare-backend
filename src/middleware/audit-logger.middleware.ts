import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { AuditLoggerService } from '../services/audit-logger.service';
import { ActivityType, UserRole, LogLevel } from '../schemas/audit-log.schema';

@Injectable()
export class AuditLoggerMiddleware implements NestMiddleware {
  private readonly logger = new Logger(AuditLoggerMiddleware.name);

  constructor(private readonly auditLoggerService: AuditLoggerService) {}

  async use(req: Request, res: Response, next: NextFunction) {
    const startTime = Date.now();
    const requestId = this.generateRequestId();
    
    // Add request ID to request object for use in controllers
    (req as any).requestId = requestId;

    // Extract user information from JWT token if available
    const user = (req as any).user;
    
    // Extract IP address
    const ipAddress = this.getClientIp(req);
    
    // Extract user agent
    const userAgent = req.get('User-Agent') || 'Unknown';

    // Create base context
    const baseContext = {
      requestId,
      ipAddress,
      userAgent,
      endpoint: req.originalUrl,
      method: req.method,
      userId: user?.userId,
      userEmail: user?.email,
      userName: user ? `${user.firstName} ${user.lastName}` : undefined,
      userRole: user?.role as UserRole,
      organizationId: user?.organizationId,
      branchId: user?.branchId,
    };

    // Log API access start
    await this.auditLoggerService.logActivity(
      'info' as any,
      ActivityType.API_ACCESS,
      `API Request Started: ${req.method} ${req.originalUrl}`,
      `User ${user?.email || 'Anonymous'} started ${req.method} request to ${req.originalUrl}`,
      baseContext
    );

    // Override res.end to capture response details
    const originalEnd = res.end;
    res.end = (chunk?: any, encoding?: any) => {
      const responseTime = Date.now() - startTime;
      const statusCode = res.statusCode;

      // Determine if this is a security event
      const isSecurityEvent = this.isSecurityEvent(req, statusCode);
      
      // Log API access completion (async, don't wait)
      this.auditLoggerService.logActivity(
        this.getLogLevel(statusCode),
        isSecurityEvent ? ActivityType.SUSPICIOUS_ACTIVITY : ActivityType.API_ACCESS,
        `API Request Completed: ${req.method} ${req.originalUrl} - ${statusCode}`,
        `User ${user?.email || 'Anonymous'} completed ${req.method} request to ${req.originalUrl} with status ${statusCode} in ${responseTime}ms`,
        {
          ...baseContext,
          statusCode,
          responseTime,
          isSecurityEvent,
          securityLevel: isSecurityEvent ? 'high' : undefined,
        }
      ).catch(error => {
        console.error('Failed to log API access:', error);
      });

      // Call original end method
      return originalEnd.call(res, chunk, encoding);
    };

    next();
  }

  /**
   * Generate unique request ID
   */
  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get client IP address
   */
  private getClientIp(req: Request): string {
    return (
      req.headers['x-forwarded-for'] as string ||
      req.headers['x-real-ip'] as string ||
      req.connection.remoteAddress ||
      req.socket.remoteAddress ||
      'unknown'
    );
  }

  /**
   * Determine if this is a security event
   */
  private isSecurityEvent(req: Request, statusCode: number): boolean {
    // Check for unauthorized access
    if (statusCode === 401 || statusCode === 403) {
      return true;
    }

    // Check for suspicious endpoints
    const suspiciousEndpoints = [
      '/auth/login',
      '/auth/logout',
      '/auth/password-reset',
      '/admin',
      '/super-admin'
    ];

    if (suspiciousEndpoints.some(endpoint => req.originalUrl.includes(endpoint))) {
      return true;
    }

    // Check for high-privilege operations
    const highPrivilegeMethods = ['POST', 'PUT', 'PATCH', 'DELETE'];
    if (highPrivilegeMethods.includes(req.method)) {
      return true;
    }

    return false;
  }

  /**
   * Get appropriate log level based on status code
   */
  private getLogLevel(statusCode: number): LogLevel {
    if (statusCode >= 500) return LogLevel.ERROR;
    if (statusCode >= 400) return LogLevel.WARN;
    return LogLevel.INFO;
  }
}
