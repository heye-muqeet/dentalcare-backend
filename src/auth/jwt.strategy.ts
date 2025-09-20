import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET'),
    });
  }

  async validate(payload: any) {
    if (!payload.sub || !payload.role) {
      throw new UnauthorizedException('Invalid token payload');
    }

    // Handle both string and object formats for organizationId/branchId
    // This provides backward compatibility with existing tokens
    const organizationId = typeof payload.organizationId === 'string' 
      ? payload.organizationId 
      : payload.organizationId?._id || payload.organizationId?.id;
      
    const branchId = typeof payload.branchId === 'string'
      ? payload.branchId
      : payload.branchId?._id || payload.branchId?.id;

    console.log('JWT Strategy - Processing payload:', {
      userId: payload.sub,
      role: payload.role,
      rawOrganizationId: payload.organizationId,
      processedOrganizationId: organizationId,
      rawBranchId: payload.branchId,
      processedBranchId: branchId
    });

    return {
      userId: payload.sub,
      email: payload.email,
      role: payload.role,
      organizationId: organizationId,
      branchId: branchId,
    };
  }
}
