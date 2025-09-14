import { Controller, Post, Body, UseGuards, Request, Get, Delete, Param, Query } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { TokenService, TokenPair } from '../../services/token.service';
import { AuditLoggerService } from '../../services/audit-logger.service';
import { ActivityType, LogLevel, UserRole } from '../../schemas/audit-log.schema';

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
  async refreshToken(
    @Body() body: { refreshToken: string },
    @Request() req: any
  ): Promise<{ success: boolean; data: TokenPair }> {
    const context = {
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent')
    };

    try {
      const tokenPair = await this.tokenService.refreshAccessToken(
        body.refreshToken,
        context
      );

      return {
        success: true,
        data: tokenPair
      };
    } catch (error) {
      // Log failed refresh attempt
      await this.auditLoggerService.logSecurityEvent(
        ActivityType.UNAUTHORIZED_ACCESS,
        `Failed token refresh attempt`,
        {
          ipAddress: context.ipAddress,
          userAgent: context.userAgent,
          metadata: {
            refreshToken: body.refreshToken?.substring(0, 10) + '...',
            error: error.message
          }
        }
      );

      throw error;
    }
  }

  /**
   * Revoke refresh token (logout)
   */
  @Post('revoke')
  @UseGuards(JwtAuthGuard)
  async revokeToken(
    @Body() body: { refreshToken: string },
    @Request() req: any
  ): Promise<{ success: boolean; message: string }> {
    const context = {
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent')
    };

    const success = await this.tokenService.revokeRefreshToken(
      body.refreshToken,
      req.user.userId,
      'User logout'
    );

    if (success) {
      // Log successful logout
      await this.auditLoggerService.logAuthEvent(
        ActivityType.LOGOUT,
        `User ${req.user.email} logged out successfully`,
        {
          userId: req.user.userId,
          userEmail: req.user.email,
          userRole: req.user.role as UserRole,
          organizationId: req.user.organizationId,
          branchId: req.user.branchId,
          ipAddress: context.ipAddress,
          userAgent: context.userAgent,
          metadata: {
            logoutMethod: 'token_revoke',
            refreshToken: body.refreshToken?.substring(0, 10) + '...'
          }
        }
      );

      return {
        success: true,
        message: 'Token revoked successfully'
      };
    } else {
      return {
        success: false,
        message: 'Token not found or already revoked'
      };
    }
  }

  /**
   * Revoke all user tokens (logout from all devices)
   */
  @Post('revoke-all')
  @UseGuards(JwtAuthGuard)
  async revokeAllTokens(
    @Request() req: any
  ): Promise<{ success: boolean; message: string; revokedCount: number }> {
    const context = {
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent')
    };

    const revokedCount = await this.tokenService.revokeAllUserTokens(
      req.user.userId,
      req.user.userId,
      'User requested logout from all devices'
    );

    // Log bulk logout
    await this.auditLoggerService.logAuthEvent(
      ActivityType.LOGOUT,
      `User ${req.user.email} logged out from all devices`,
      {
        userId: req.user.userId,
        userEmail: req.user.email,
        userRole: req.user.role as UserRole,
        organizationId: req.user.organizationId,
        branchId: req.user.branchId,
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
        metadata: {
          logoutMethod: 'revoke_all',
          revokedCount
        }
      }
    );

    return {
      success: true,
      message: 'All tokens revoked successfully',
      revokedCount
    };
  }

  /**
   * Get user's active refresh tokens
   */
  @Get('tokens')
  @UseGuards(JwtAuthGuard)
  async getUserTokens(
    @Request() req: any,
    @Query('includeExpired') includeExpired?: boolean
  ): Promise<{ success: boolean; data: any[] }> {
    const tokens = await this.tokenService.getUserRefreshTokens(req.user.userId);
    
    // Filter out sensitive information
    const sanitizedTokens = tokens.map(token => ({
      id: token._id,
      deviceName: token.deviceName || 'Unknown Device',
      deviceId: token.deviceId,
      lastUsedAt: token.lastUsedAt,
      createdAt: token.createdAt,
      expiresAt: token.expiresAt,
      isRememberMe: token.isRememberMe,
      usageCount: token.usageCount,
      maxUsageCount: token.maxUsageCount,
      ipAddress: token.ipAddress,
      userAgent: token.userAgent
    }));

    // Log token list access
    await this.auditLoggerService.logActivity(
      LogLevel.INFO,
      ActivityType.DATA_VIEWED,
      `User ${req.user.email} viewed their active tokens`,
      `User accessed their token list`,
      {
        userId: req.user.userId,
        userEmail: req.user.email,
        userRole: req.user.role as UserRole,
        organizationId: req.user.organizationId,
        branchId: req.user.branchId,
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.get('User-Agent'),
        endpoint: '/auth/token/tokens',
        method: 'GET',
        metadata: {
          tokenCount: sanitizedTokens.length,
          includeExpired: includeExpired || false
        }
      }
    );

    return {
      success: true,
      data: sanitizedTokens
    };
  }

  /**
   * Revoke specific token by ID
   */
  @Delete('tokens/:tokenId')
  @UseGuards(JwtAuthGuard)
  async revokeTokenById(
    @Param('tokenId') tokenId: string,
    @Request() req: any
  ): Promise<{ success: boolean; message: string }> {
    // This would require additional implementation to find token by ID
    // For now, we'll return a not implemented response
    return {
      success: false,
      message: 'Token revocation by ID not implemented yet'
    };
  }

  /**
   * Get token statistics (for admins)
   */
  @Get('stats')
  @UseGuards(JwtAuthGuard)
  async getTokenStats(
    @Request() req: any,
    @Query('organizationId') organizationId?: string,
    @Query('branchId') branchId?: string
  ): Promise<{ success: boolean; data: any }> {
    // Check if user has permission to view stats
    if (!this.canViewTokenStats(req.user)) {
      await this.auditLoggerService.logSecurityEvent(
        ActivityType.UNAUTHORIZED_ACCESS,
        `Unauthorized attempt to view token statistics`,
        {
          userId: req.user.userId,
          userEmail: req.user.email,
          userRole: req.user.role as UserRole,
          organizationId: req.user.organizationId,
          branchId: req.user.branchId,
          ipAddress: req.ip || req.connection.remoteAddress,
          userAgent: req.get('User-Agent')
        }
      );

      throw new Error('Unauthorized to view token statistics');
    }

    const stats = await this.tokenService.getTokenStats(organizationId, branchId);

    // Log stats access
    await this.auditLoggerService.logActivity(
      LogLevel.INFO,
      ActivityType.DATA_VIEWED,
      `Token statistics accessed by ${req.user.email}`,
      `User accessed token statistics`,
      {
        userId: req.user.userId,
        userEmail: req.user.email,
        userRole: req.user.role as UserRole,
        organizationId: req.user.organizationId,
        branchId: req.user.branchId,
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.get('User-Agent'),
        endpoint: '/auth/token/stats',
        method: 'GET',
        metadata: {
          requestedOrganizationId: organizationId,
          requestedBranchId: branchId
        }
      }
    );

    return {
      success: true,
      data: stats
    };
  }

  /**
   * Check if user can view token statistics
   */
  private canViewTokenStats(user: any): boolean {
    return user.role === UserRole.SUPER_ADMIN || 
           user.role === UserRole.ORGANIZATION_ADMIN;
  }
}
