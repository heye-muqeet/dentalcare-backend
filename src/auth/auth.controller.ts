import { Controller, Post, Body, UseGuards, Request } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from './local-auth.guard';
import { JwtAuthGuard } from './jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  async login(@Request() req: any, @Body() loginDto: { email: string; password: string; role: string }) {
    const user = await this.authService.validateUser(loginDto.email, loginDto.password, loginDto.role);
    if (!user) {
      // Log failed login attempt
      await this.authService.auditLoggerService.logAuthEvent(
        'LOGIN_FAILED' as any,
        `Failed login attempt for email: ${loginDto.email}`,
        {
          userEmail: loginDto.email,
          userRole: loginDto.role as any,
          ipAddress: req.ip || req.connection.remoteAddress,
          userAgent: req.get('User-Agent'),
          requestId: req.requestId,
          endpoint: '/auth/login',
          method: 'POST',
          metadata: {
            attemptTime: new Date().toISOString(),
            reason: 'Invalid credentials'
          }
        }
      );
      throw new Error('Invalid credentials');
    }
    
    // Create context for audit logging
    const context = {
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent'),
      requestId: req.requestId
    };
    
    return this.authService.login(user, loginDto.role, context);
  }

  @Post('super-admin')
  async createSuperAdmin(@Body() createSuperAdminDto: any) {
    return this.authService.createSuperAdmin(createSuperAdminDto);
  }

  @Post('organization-admin')
  @UseGuards(JwtAuthGuard)
  async createOrganizationAdmin(@Request() req: any, @Body() createOrgAdminDto: any) {
    // Only Super Admin can create Organization Admins
    if (req.user.role !== 'super_admin') {
      throw new Error('Unauthorized');
    }
    return this.authService.createOrganizationAdmin(createOrgAdminDto);
  }

  @Post('branch-admin')
  @UseGuards(JwtAuthGuard)
  async createBranchAdmin(@Request() req: any, @Body() createBranchAdminDto: any) {
    // Only Organization Admin can create Branch Admins
    if (req.user.role !== 'organization_admin') {
      throw new Error('Unauthorized');
    }
    return this.authService.createBranchAdmin(createBranchAdminDto);
  }

  @Post('doctor')
  @UseGuards(JwtAuthGuard)
  async createDoctor(@Request() req: any, @Body() createDoctorDto: any) {
    // Only Branch Admin can create Doctors
    if (req.user.role !== 'branch_admin') {
      throw new Error('Unauthorized');
    }
    return this.authService.createDoctor(createDoctorDto);
  }

  @Post('receptionist')
  @UseGuards(JwtAuthGuard)
  async createReceptionist(@Request() req: any, @Body() createReceptionistDto: any) {
    // Only Branch Admin can create Receptionists
    if (req.user.role !== 'branch_admin') {
      throw new Error('Unauthorized');
    }
    return this.authService.createReceptionist(createReceptionistDto);
  }

  @Post('patient')
  @UseGuards(JwtAuthGuard)
  async createPatient(@Request() req: any, @Body() createPatientDto: any) {
    // Only Receptionists can create Patients
    if (req.user.role !== 'receptionist') {
      throw new Error('Unauthorized');
    }
    return this.authService.createPatient(createPatientDto);
  }
}
