import { Injectable, Logger, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ConfigService } from '@nestjs/config';
import { RefreshToken, RefreshTokenDocument, TokenStatus } from '../schemas/refresh-token.schema';
import { AuditLoggerService } from './audit-logger.service';
import { ActivityType, LogLevel, UserRole } from '../schemas/audit-log.schema';
import * as crypto from 'crypto';

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: string;
  userId?: string;
  userEmail?: string;
  userRole?: string;
  organizationId?: string;
  branchId?: string;
  deviceId?: string;
  deviceName?: string;
}

export interface TokenValidationResult {
  isValid: boolean;
  userId?: string;
  userEmail?: string;
  userRole?: string;
  organizationId?: string;
  branchId?: string;
  tokenId?: string;
  isExpired?: boolean;
  isRevoked?: boolean;
}

@Injectable()
export class TokenService {
  private readonly logger = new Logger(TokenService.name);
  private readonly accessTokenExpiry: number;
  private readonly refreshTokenExpiry: number;
  private readonly maxRefreshTokensPerUser: number;

  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
    @InjectModel(RefreshToken.name) private refreshTokenModel: Model<RefreshTokenDocument>,
    private auditLoggerService: AuditLoggerService,
  ) {
    // Get token expiry times from environment variables
    this.accessTokenExpiry = this.parseExpiry(this.configService.get<string>('JWT_EXPIRES_IN', '15m'));
    this.refreshTokenExpiry = this.parseExpiry(this.configService.get<string>('REFRESH_TOKEN_EXPIRES_IN', '7d'));
    this.maxRefreshTokensPerUser = parseInt(this.configService.get<string>('MAX_REFRESH_TOKENS_PER_USER', '5'));
    
    // Log token configuration on startup
    this.logger.log(`Token configuration loaded:`);
    this.logger.log(`- Access token expiry: ${this.accessTokenExpiry}s (${this.configService.get<string>('JWT_EXPIRES_IN', '15m')})`);
    this.logger.log(`- Refresh token expiry: ${this.refreshTokenExpiry}s (${this.configService.get<string>('REFRESH_TOKEN_EXPIRES_IN', '7d')})`);
    this.logger.log(`- Max refresh tokens per user: ${this.maxRefreshTokensPerUser}`);
  }

  /**
   * Generate a new token pair (access + refresh)
   */
  async generateTokenPair(
    user: any,
    context: {
      ipAddress?: string;
      userAgent?: string;
      deviceId?: string;
      deviceName?: string;
      isRememberMe?: boolean;
    } = {}
  ): Promise<TokenPair> {
    const now = new Date();
    const accessTokenExpiry = new Date(now.getTime() + this.accessTokenExpiry * 1000);
    const refreshTokenExpiry = new Date(now.getTime() + this.refreshTokenExpiry * 1000);

    // Generate access token
    const accessTokenPayload = {
      sub: user._id || user.id,
      email: user.email,
      role: user.role,
      organizationId: user.organizationId?._id || user.organizationId,
      branchId: user.branchId?._id || user.branchId,
      type: 'access',
    };

    const accessToken = this.jwtService.sign(accessTokenPayload);

    // Generate refresh token
    const refreshToken = this.generateSecureRefreshToken();
    
    // Clean up old refresh tokens for this user
    await this.cleanupOldRefreshTokens(user._id || user.id);

    // Save refresh token to database
    const refreshTokenDoc = new this.refreshTokenModel({
      token: refreshToken,
      userId: user._id || user.id,
      userEmail: user.email,
      userRole: user.role,
      organizationId: user.organizationId?._id || user.organizationId,
      branchId: user.branchId?._id || user.branchId,
      status: TokenStatus.ACTIVE,
      expiresAt: refreshTokenExpiry,
      lastUsedAt: now,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
      deviceId: context.deviceId,
      deviceName: context.deviceName,
      usageCount: 0,
      maxUsageCount: this.configService.get<number>('REFRESH_TOKEN_MAX_USAGE', 100),
      isRememberMe: context.isRememberMe || false,
      metadata: {
        createdBy: 'system',
        userAgent: context.userAgent,
        ipAddress: context.ipAddress
      }
    });

    await refreshTokenDoc.save();

    // Log token generation
    await this.auditLoggerService.logAuthEvent(
      ActivityType.TOKEN_REFRESH,
      `New token pair generated for user ${user.email}`,
      {
        userId: user._id || user.id,
        userEmail: user.email,
        userName: `${user.firstName} ${user.lastName}`,
        userRole: user.role as UserRole,
        organizationId: user.organizationId?.toString(),
        branchId: user.branchId?.toString(),
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
        metadata: {
          tokenType: 'access_refresh_pair',
          deviceId: context.deviceId,
          deviceName: context.deviceName,
          isRememberMe: context.isRememberMe
        }
      }
    );

    return {
      accessToken,
      refreshToken,
      expiresIn: this.accessTokenExpiry,
      tokenType: 'Bearer'
    };
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshAccessToken(
    refreshToken: string,
    context: {
      ipAddress?: string;
      userAgent?: string;
    } = {}
  ): Promise<TokenPair> {
    // Validate refresh token
    const tokenDoc = await this.refreshTokenModel.findOne({
      token: refreshToken,
      status: TokenStatus.ACTIVE
    }).exec();

    if (!tokenDoc) {
      await this.auditLoggerService.logSecurityEvent(
        ActivityType.UNAUTHORIZED_ACCESS,
        `Invalid refresh token used: ${refreshToken.substring(0, 10)}...`,
        {
          ipAddress: context.ipAddress,
          userAgent: context.userAgent,
          metadata: { refreshToken: refreshToken.substring(0, 10) + '...' }
        }
      );
      throw new UnauthorizedException('Invalid refresh token');
    }

    // Check if token is expired
    if (tokenDoc.expiresAt < new Date()) {
      tokenDoc.status = TokenStatus.EXPIRED;
      await tokenDoc.save();
      
      await this.auditLoggerService.logSecurityEvent(
        ActivityType.UNAUTHORIZED_ACCESS,
        `Expired refresh token used: ${refreshToken.substring(0, 10)}...`,
        {
          userId: tokenDoc.userId,
          userEmail: tokenDoc.userEmail,
          ipAddress: context.ipAddress,
          userAgent: context.userAgent,
          metadata: { refreshToken: refreshToken.substring(0, 10) + '...' }
        }
      );
      throw new UnauthorizedException('Refresh token expired');
    }

    // Check usage count
    if (tokenDoc.usageCount >= tokenDoc.maxUsageCount) {
      tokenDoc.status = TokenStatus.REVOKED;
      tokenDoc.revokedReason = 'Max usage count exceeded';
      await tokenDoc.save();
      
      await this.auditLoggerService.logSecurityEvent(
        ActivityType.SUSPICIOUS_ACTIVITY,
        `Refresh token max usage exceeded: ${refreshToken.substring(0, 10)}...`,
        {
          userId: tokenDoc.userId,
          userEmail: tokenDoc.userEmail,
          ipAddress: context.ipAddress,
          userAgent: context.userAgent,
          metadata: { refreshToken: refreshToken.substring(0, 10) + '...' }
        }
      );
      throw new UnauthorizedException('Refresh token usage limit exceeded');
    }

    // Revoke the old refresh token
    tokenDoc.status = TokenStatus.REVOKED;
    tokenDoc.revokedBy = 'system';
    tokenDoc.revokedReason = 'Token rotation - replaced with new token';
    tokenDoc.revokedAt = new Date();
    await tokenDoc.save();

    // Generate new access token
    const now = new Date();
    const accessTokenExpiry = new Date(now.getTime() + this.accessTokenExpiry * 1000);
    const refreshTokenExpiry = new Date(now.getTime() + this.refreshTokenExpiry * 1000);

    const accessTokenPayload = {
      sub: tokenDoc.userId,
      email: tokenDoc.userEmail,
      role: tokenDoc.userRole,
      organizationId: tokenDoc.organizationId,
      branchId: tokenDoc.branchId,
      type: 'access',
    };

    const accessToken = this.jwtService.sign(accessTokenPayload);

    // Generate new refresh token
    const newRefreshToken = this.generateSecureRefreshToken();
    
    // Save new refresh token to database
    const newRefreshTokenDoc = new this.refreshTokenModel({
      token: newRefreshToken,
      userId: tokenDoc.userId,
      userEmail: tokenDoc.userEmail,
      userRole: tokenDoc.userRole,
      organizationId: tokenDoc.organizationId,
      branchId: tokenDoc.branchId,
      status: TokenStatus.ACTIVE,
      expiresAt: refreshTokenExpiry,
      lastUsedAt: now,
      ipAddress: context.ipAddress || tokenDoc.ipAddress,
      userAgent: context.userAgent || tokenDoc.userAgent,
      deviceId: tokenDoc.deviceId,
      deviceName: tokenDoc.deviceName,
      usageCount: 0,
      maxUsageCount: this.configService.get<number>('REFRESH_TOKEN_MAX_USAGE', 100),
      isRememberMe: tokenDoc.isRememberMe,
      metadata: {
        createdBy: 'system',
        userAgent: context.userAgent || tokenDoc.userAgent,
        ipAddress: context.ipAddress || tokenDoc.ipAddress,
        rotatedFrom: (tokenDoc._id as any).toString()
      }
    });

    await newRefreshTokenDoc.save();

    // Log token refresh
    await this.auditLoggerService.logAuthEvent(
      ActivityType.TOKEN_REFRESH,
      `Access and refresh tokens refreshed for user ${tokenDoc.userEmail}`,
      {
        userId: tokenDoc.userId,
        userEmail: tokenDoc.userEmail,
        userRole: tokenDoc.userRole as UserRole,
        organizationId: tokenDoc.organizationId,
        branchId: tokenDoc.branchId,
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
        metadata: {
          tokenType: 'access_refresh_pair',
          oldRefreshTokenId: (tokenDoc._id as any).toString(),
          newRefreshTokenId: (newRefreshTokenDoc._id as any).toString(),
          rotationEnabled: true
        }
      }
    );

    return {
      accessToken,
      refreshToken: newRefreshToken, // Return new refresh token
      expiresIn: this.accessTokenExpiry,
      tokenType: 'Bearer',
      userId: tokenDoc.userId,
      userEmail: tokenDoc.userEmail,
      userRole: tokenDoc.userRole,
      organizationId: tokenDoc.organizationId,
      branchId: tokenDoc.branchId,
      deviceId: tokenDoc.deviceId,
      deviceName: tokenDoc.deviceName
    };
  }

  /**
   * Validate access token
   */
  async validateAccessToken(token: string): Promise<TokenValidationResult> {
    try {
      const payload = this.jwtService.verify(token);
      
      // Check if it's an access token
      if (payload.type !== 'access') {
        return { isValid: false, isExpired: false, isRevoked: true };
      }

      // Check if token is expired
      if (payload.exp < Math.floor(Date.now() / 1000)) {
        return { isValid: false, isExpired: true, isRevoked: false };
      }

      return {
        isValid: true,
        userId: payload.sub,
        userEmail: payload.email,
        userRole: payload.role,
        organizationId: payload.organizationId,
        branchId: payload.branchId,
        isExpired: false,
        isRevoked: false
      };
    } catch (error) {
      return { isValid: false, isExpired: true, isRevoked: false };
    }
  }

  /**
   * Revoke refresh token
   */
  async revokeRefreshToken(
    refreshToken: string,
    revokedBy: string,
    reason: string = 'User logout'
  ): Promise<boolean> {
    const tokenDoc = await this.refreshTokenModel.findOne({
      token: refreshToken,
      status: TokenStatus.ACTIVE
    }).exec();

    if (!tokenDoc) {
      return false;
    }

    tokenDoc.status = TokenStatus.REVOKED;
    tokenDoc.revokedBy = revokedBy;
    tokenDoc.revokedReason = reason;
    tokenDoc.revokedAt = new Date();
    await tokenDoc.save();

    // Log token revocation
    await this.auditLoggerService.logAuthEvent(
      ActivityType.LOGOUT,
      `Refresh token revoked for user ${tokenDoc.userEmail}`,
      {
        userId: tokenDoc.userId,
        userEmail: tokenDoc.userEmail,
        userRole: tokenDoc.userRole as UserRole,
        organizationId: tokenDoc.organizationId,
        branchId: tokenDoc.branchId,
        metadata: {
          revokedBy,
          reason,
          tokenId: (tokenDoc._id as any).toString()
        }
      }
    );

    return true;
  }

  /**
   * Revoke all refresh tokens for a user
   */
  async revokeAllUserTokens(
    userId: string,
    revokedBy: string,
    reason: string = 'Security action'
  ): Promise<number> {
    const result = await this.refreshTokenModel.updateMany(
      { userId, status: TokenStatus.ACTIVE },
      {
        status: TokenStatus.REVOKED,
        revokedBy,
        revokedReason: reason,
        revokedAt: new Date()
      }
    );

    // Log bulk token revocation
    await this.auditLoggerService.logSecurityEvent(
      ActivityType.SUSPICIOUS_ACTIVITY,
      `All refresh tokens revoked for user ${userId}`,
      {
        userId,
        metadata: {
          revokedBy,
          reason,
          revokedCount: result.modifiedCount
        }
      }
    );

    return result.modifiedCount;
  }

  /**
   * Get active refresh tokens for a user
   */
  async getUserRefreshTokens(userId: string, includeExpired: boolean = false): Promise<RefreshTokenDocument[]> {
    const query: any = {
      userId,
      status: TokenStatus.ACTIVE
    };

    if (!includeExpired) {
      query.expiresAt = { $gt: new Date() };
    }

    return this.refreshTokenModel.find(query).sort({ lastUsedAt: -1 }).exec();
  }

  /**
   * Clean up expired and old refresh tokens
   */
  async cleanupExpiredTokens(): Promise<number> {
    const result = await this.refreshTokenModel.deleteMany({
      $or: [
        { expiresAt: { $lt: new Date() } },
        { status: { $in: [TokenStatus.EXPIRED, TokenStatus.REVOKED] } }
      ]
    });

    this.logger.log(`Cleaned up ${result.deletedCount} expired/revoked refresh tokens`);
    return result.deletedCount;
  }

  /**
   * Clean up old refresh tokens for a specific user
   */
  private async cleanupOldRefreshTokens(userId: string): Promise<void> {
    const userTokens = await this.refreshTokenModel.find({
      userId,
      status: TokenStatus.ACTIVE
    }).sort({ lastUsedAt: -1 }).exec();

    if (userTokens.length >= this.maxRefreshTokensPerUser) {
      const tokensToRevoke = userTokens.slice(this.maxRefreshTokensPerUser - 1);
      const tokenIds = tokensToRevoke.map(token => token._id);
      
      await this.refreshTokenModel.updateMany(
        { _id: { $in: tokenIds } },
        {
          status: TokenStatus.REVOKED,
          revokedBy: 'system',
          revokedReason: 'Max tokens per user exceeded',
          revokedAt: new Date()
        }
      );
    }
  }

  /**
   * Generate secure refresh token
   */
  private generateSecureRefreshToken(): string {
    return crypto.randomBytes(64).toString('hex');
  }

  /**
   * Parse expiry string to seconds
   */
  private parseExpiry(expiry: string): number {
    const match = expiry.match(/^(\d+)([smhd])$/);
    if (!match) return 900; // Default 15 minutes

    const value = parseInt(match[1]);
    const unit = match[2];

    switch (unit) {
      case 's': return value;
      case 'm': return value * 60;
      case 'h': return value * 60 * 60;
      case 'd': return value * 24 * 60 * 60;
      default: return 900;
    }
  }

  /**
   * Get token statistics
   */
  async getTokenStats(organizationId?: string, branchId?: string) {
    const matchQuery: any = {};
    if (organizationId) matchQuery.organizationId = organizationId;
    if (branchId) matchQuery.branchId = branchId;

    const stats = await this.refreshTokenModel.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: null,
          totalTokens: { $sum: 1 },
          activeTokens: {
            $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] }
          },
          expiredTokens: {
            $sum: { $cond: [{ $eq: ['$status', 'expired'] }, 1, 0] }
          },
          revokedTokens: {
            $sum: { $cond: [{ $eq: ['$status', 'revoked'] }, 1, 0] }
          },
          uniqueUsers: { $addToSet: '$userId' }
        }
      },
      {
        $project: {
          totalTokens: 1,
          activeTokens: 1,
          expiredTokens: 1,
          revokedTokens: 1,
          uniqueUserCount: { $size: '$uniqueUsers' }
        }
      }
    ]);

    return stats[0] || {
      totalTokens: 0,
      activeTokens: 0,
      expiredTokens: 0,
      revokedTokens: 0,
      uniqueUserCount: 0
    };
  }
}
