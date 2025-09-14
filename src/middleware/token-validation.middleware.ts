import { Injectable, NestMiddleware, UnauthorizedException, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { TokenService } from '../services/token.service';
import { AuditLoggerService } from '../services/audit-logger.service';
import { ActivityType, LogLevel } from '../schemas/audit-log.schema';

@Injectable()
export class TokenValidationMiddleware implements NestMiddleware {
  private readonly logger = new Logger(TokenValidationMiddleware.name);

  constructor(
    private tokenService: TokenService,
    private auditLoggerService: AuditLoggerService,
  ) {}

  async use(req: Request, res: Response, next: NextFunction) {
    // Skip token validation for public endpoints
    if (this.isPublicEndpoint(req.originalUrl)) {
      return next();
    }

    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      await this.logUnauthorizedAccess(req, 'No authorization header');
      throw new UnauthorizedException('No authorization token provided');
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    try {
      // Validate access token
      const validationResult = await this.tokenService.validateAccessToken(token);
      
      if (!validationResult.isValid) {
        if (validationResult.isExpired) {
          await this.logUnauthorizedAccess(req, 'Access token expired');
          throw new UnauthorizedException('Access token expired');
        } else if (validationResult.isRevoked) {
          await this.logUnauthorizedAccess(req, 'Access token revoked');
          throw new UnauthorizedException('Access token revoked');
        } else {
          await this.logUnauthorizedAccess(req, 'Invalid access token');
          throw new UnauthorizedException('Invalid access token');
        }
      }

      // Add user information to request
      (req as any).user = {
        userId: validationResult.userId,
        email: validationResult.userEmail,
        role: validationResult.userRole,
        organizationId: validationResult.organizationId,
        branchId: validationResult.branchId,
        tokenType: 'access'
      };

      // Log successful token validation
      await this.auditLoggerService.logActivity(
        LogLevel.INFO,
        ActivityType.API_ACCESS,
        `Token validated successfully for user ${validationResult.userEmail}`,
        `User ${validationResult.userEmail} accessed ${req.method} ${req.originalUrl}`,
        {
          userId: validationResult.userId,
          userEmail: validationResult.userEmail,
          userRole: validationResult.userRole as any,
          organizationId: validationResult.organizationId,
          branchId: validationResult.branchId,
          ipAddress: this.getClientIp(req),
          userAgent: req.get('User-Agent'),
          endpoint: req.originalUrl,
          method: req.method,
          metadata: {
            tokenType: 'access',
            validationTime: new Date().toISOString()
          }
        }
      );

      next();
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      
      // Log token validation error
      await this.auditLoggerService.logError(
        'Token validation failed',
        error as Error,
        {
          ipAddress: this.getClientIp(req),
          userAgent: req.get('User-Agent'),
          endpoint: req.originalUrl,
          method: req.method,
          metadata: {
            token: token.substring(0, 10) + '...',
            error: error.message
          }
        }
      );
      
      throw new UnauthorizedException('Token validation failed');
    }
  }

  /**
   * Check if endpoint is public (doesn't require authentication)
   */
  private isPublicEndpoint(url: string): boolean {
    const publicEndpoints = [
      '/',
      '/health',
      '/auth/login',
      '/auth/super-admin',
      '/auth/refresh',
      '/auth/forgot-password',
      '/auth/reset-password'
    ];

    return publicEndpoints.some(endpoint => url.startsWith(endpoint));
  }

  /**
   * Log unauthorized access attempts
   */
  private async logUnauthorizedAccess(req: Request, reason: string): Promise<void> {
    await this.auditLoggerService.logSecurityEvent(
      ActivityType.UNAUTHORIZED_ACCESS,
      `Unauthorized access attempt: ${reason}`,
      {
        ipAddress: this.getClientIp(req),
        userAgent: req.get('User-Agent'),
        endpoint: req.originalUrl,
        method: req.method,
        metadata: {
          reason,
          timestamp: new Date().toISOString()
        }
      }
    );
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
}
