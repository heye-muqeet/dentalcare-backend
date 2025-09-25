import { Controller, Post, Get, Body, UseGuards, Request, Query } from '@nestjs/common';
import { JwtAuthGuard } from './jwt-auth.guard';
import { TokenService } from '../services/token.service';
import { AuditLoggerService } from '../services/audit-logger.service';
import { ActivityType, LogLevel } from '../schemas/audit-log.schema';

@Controller('auth/token')
export class AuthTokenController {
  constructor(
    private tokenService: TokenService,
    private auditLoggerService: AuditLoggerService,
  ) {}

  /**
   * Refresh access token using refresh token
   */
  @Post('refresh')
  async refreshToken(@Body() body: { refreshToken: string }, @Request() req: any) {
    try {
      console.log('🔄 Token refresh request received:', {
        hasRefreshToken: !!body.refreshToken,
        refreshTokenLength: body.refreshToken?.length,
        refreshTokenPreview: body.refreshToken?.substring(0, 10) + '...',
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.get('User-Agent')
      });

      const context = {
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.get('User-Agent'),
        requestId: req.requestId,
      };

      const result = await this.tokenService.refreshAccessToken(body.refreshToken, context);
      
      // Log successful refresh
      await this.auditLoggerService.logAuthEvent(
        ActivityType.LOGIN,
        'Access and refresh tokens refreshed successfully',
        {
          userId: result.userId,
          userEmail: result.userEmail,
          userRole: result.userRole as any,
          ipAddress: context.ipAddress,
          userAgent: context.userAgent,
          requestId: context.requestId,
          endpoint: '/auth/token/refresh',
          method: 'POST',
          metadata: {
            refreshTime: new Date().toISOString(),
            deviceId: result.deviceId,
            deviceName: result.deviceName
          }
        }
      );

      return {
        success: true,
        data: result
      };
    } catch (error) {
      console.error('❌ Token refresh failed:', {
        error: error.message,
        stack: error.stack,
        refreshToken: body.refreshToken ? 'provided' : 'missing',
        refreshTokenLength: body.refreshToken?.length
      });

      // Log failed refresh attempt
      await this.auditLoggerService.logAuthEvent(
        'login_failed' as any,
        `Failed token refresh attempt: ${error.message}`,
        {
          userEmail: 'unknown',
          userRole: 'system' as any, // Use 'system' instead of 'unknown'
          ipAddress: req.ip || req.connection.remoteAddress,
          userAgent: req.get('User-Agent'),
          requestId: req.requestId,
          endpoint: '/auth/token/refresh',
          method: 'POST',
          metadata: {
            attemptTime: new Date().toISOString(),
            reason: error.message,
            refreshToken: body.refreshToken ? 'provided' : 'missing'
          }
        }
      );

      throw error;
    }
  }

  /**
   * Revoke refresh token (logout from current device)
   */
  @Post('revoke')
  @UseGuards(JwtAuthGuard)
  async revokeToken(@Body() body: { refreshToken: string }, @Request() req: any) {
    try {
      const context = {
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.get('User-Agent'),
        requestId: req.requestId,
      };

      const result = await this.tokenService.revokeRefreshToken(
        body.refreshToken,
        req.user.userId,
        'User logout'
      );

      // Log successful revocation
      await this.auditLoggerService.logAuthEvent(
        ActivityType.LOGOUT,
        'Refresh token revoked successfully',
        {
          userId: req.user.userId,
          userEmail: req.user.email,
          userRole: req.user.role as any,
          ipAddress: context.ipAddress,
          userAgent: context.userAgent,
          requestId: context.requestId,
          endpoint: '/auth/token/revoke',
          method: 'POST',
          metadata: {
            revocationTime: new Date().toISOString(),
            reason: 'User logout'
          }
        }
      );

      return {
        success: true,
        message: 'Token revoked successfully',
        data: result
      };
    } catch (error) {
      // Log failed revocation
      await this.auditLoggerService.logError(
        'Failed to revoke refresh token',
        error as Error,
        {
          userId: req.user?.userId,
          userEmail: req.user?.email,
          userRole: req.user?.role,
          ipAddress: req.ip || req.connection.remoteAddress,
          userAgent: req.get('User-Agent'),
          requestId: req.requestId,
          endpoint: '/auth/token/revoke',
          method: 'POST',
          metadata: {
            error: error.message,
            refreshToken: body.refreshToken ? 'provided' : 'missing'
          }
        }
      );

      throw error;
    }
  }

  /**
   * Revoke all refresh tokens for user (logout from all devices)
   */
  @Post('revoke-all')
  @UseGuards(JwtAuthGuard)
  async revokeAllTokens(@Request() req: any) {
    try {
      const context = {
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.get('User-Agent'),
        requestId: req.requestId,
      };

      const result = await this.tokenService.revokeAllUserTokens(
        req.user.userId,
        req.user.userId,
        'User logout from all devices'
      );

      // Log successful bulk revocation
      await this.auditLoggerService.logAuthEvent(
        ActivityType.LOGOUT,
        `All refresh tokens revoked successfully (${result} tokens)`,
        {
          userId: req.user.userId,
          userEmail: req.user.email,
          userRole: req.user.role as any,
          ipAddress: context.ipAddress,
          userAgent: context.userAgent,
          requestId: context.requestId,
          endpoint: '/auth/token/revoke-all',
          method: 'POST',
          metadata: {
            revocationTime: new Date().toISOString(),
            reason: 'User logout from all devices',
            tokensRevoked: result
          }
        }
      );

      return {
        success: true,
        message: `All tokens revoked successfully (${result} tokens)`,
        data: { tokensRevoked: result }
      };
    } catch (error) {
      // Log failed bulk revocation
      await this.auditLoggerService.logError(
        'Failed to revoke all refresh tokens',
        error as Error,
        {
          userId: req.user?.userId,
          userEmail: req.user?.email,
          userRole: req.user?.role,
          ipAddress: req.ip || req.connection.remoteAddress,
          userAgent: req.get('User-Agent'),
          requestId: req.requestId,
          endpoint: '/auth/token/revoke-all',
          method: 'POST',
          metadata: {
            error: error.message
          }
        }
      );

      throw error;
    }
  }

  /**
   * Get user's active refresh tokens
   */
  @Get('tokens')
  @UseGuards(JwtAuthGuard)
  async getUserTokens(
    @Request() req: any,
    @Query('includeExpired') includeExpired?: string
  ) {
    try {
      const includeExpiredFlag = includeExpired === 'true';
      const tokens = await this.tokenService.getUserRefreshTokens(
        req.user.userId,
        includeExpiredFlag
      );

      // Log token access
      await this.auditLoggerService.logUserEvent(
        ActivityType.USER_ACCESS,
        'User accessed their active tokens',
        {
          userId: req.user.userId,
          userEmail: req.user.email,
          userRole: req.user.role as any,
          ipAddress: req.ip || req.connection.remoteAddress,
          userAgent: req.get('User-Agent'),
          requestId: req.requestId,
          endpoint: '/auth/token/tokens',
          method: 'GET',
          metadata: {
            accessTime: new Date().toISOString(),
            includeExpired: includeExpiredFlag,
            tokenCount: tokens.length
          }
        }
      );

      return {
        success: true,
        data: {
          tokens: tokens.map(token => ({
            id: token._id,
            deviceName: token.deviceName,
            deviceId: token.deviceId,
            lastUsedAt: token.lastUsedAt,
            createdAt: token.createdAt,
            expiresAt: token.expiresAt,
            isRememberMe: token.isRememberMe,
            usageCount: token.usageCount,
            maxUsageCount: token.maxUsageCount,
            ipAddress: token.ipAddress,
            userAgent: token.userAgent,
            status: token.status
          })),
          totalCount: tokens.length
        }
      };
    } catch (error) {
      // Log failed token access
      await this.auditLoggerService.logError(
        'Failed to get user tokens',
        error as Error,
        {
          userId: req.user?.userId,
          userEmail: req.user?.email,
          userRole: req.user?.role,
          ipAddress: req.ip || req.connection.remoteAddress,
          userAgent: req.get('User-Agent'),
          requestId: req.requestId,
          endpoint: '/auth/token/tokens',
          method: 'GET',
          metadata: {
            error: error.message,
            includeExpired: includeExpired
          }
        }
      );

      throw error;
    }
  }

  /**
   * Get token statistics (Super Admin and Organization Admin only)
   */
  @Get('stats')
  @UseGuards(JwtAuthGuard)
  async getTokenStats(@Request() req: any) {
    try {
      // Check if user has admin privileges
      if (!['super_admin', 'organization_admin'].includes(req.user.role)) {
        throw new Error('Insufficient privileges to access token statistics');
      }

      const stats = await this.tokenService.getTokenStats();

      // Log admin access to token statistics
      await this.auditLoggerService.logUserEvent(
        ActivityType.USER_ACCESS,
        'Admin accessed token statistics',
        {
          userId: req.user.userId,
          userEmail: req.user.email,
          userRole: req.user.role as any,
          ipAddress: req.ip || req.connection.remoteAddress,
          userAgent: req.get('User-Agent'),
          requestId: req.requestId,
          endpoint: '/auth/token/stats',
          method: 'GET',
          metadata: {
            accessTime: new Date().toISOString(),
            stats: stats
          }
        }
      );

      return {
        success: true,
        data: stats
      };
    } catch (error) {
      // Log failed stats access
      await this.auditLoggerService.logError(
        'Failed to get token statistics',
        error as Error,
        {
          userId: req.user?.userId,
          userEmail: req.user?.email,
          userRole: req.user?.role,
          ipAddress: req.ip || req.connection.remoteAddress,
          userAgent: req.get('User-Agent'),
          requestId: req.requestId,
          endpoint: '/auth/token/stats',
          method: 'GET',
          metadata: {
            error: error.message
          }
        }
      );

      throw error;
    }
  }
}
