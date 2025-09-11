import { Body, Controller, Get, HttpException, HttpStatus, Post, Req, Res, UseGuards } from '@nestjs/common';
import type { Request, Response } from 'express';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { Organization } from '../schemas/organization.schema';
import { Location } from '../schemas/location.schema';
import { User } from '../schemas/user.schema';
import { IsEmail, IsNotEmpty } from 'class-validator';

class RegisterBody {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsNotEmpty()
  password: string;

  @IsNotEmpty()
  name: string;

  @IsNotEmpty()
  phone: string;

  @IsNotEmpty()
  organizationName: string;

  @IsNotEmpty()
  organizationAddress: string;

  @IsNotEmpty()
  organizationPhone: string;

  @IsEmail()
  @IsNotEmpty()
  organizationEmail: string;
}

class LoginBody {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsNotEmpty()
  password: string;
}

@Controller('auth')
export class AuthController {
  constructor(
    private readonly jwtService: JwtService,
    @InjectModel(Organization.name) private orgModel: Model<Organization>,
    @InjectModel(Location.name) private locationModel: Model<Location>,
    @InjectModel(User.name) private userModel: Model<User>,
  ) {}

  @Post('register')
  async register(@Body() body: RegisterBody, @Res() res: Response) {
    try {
      // Validate required fields
      if (!body.email || !body.password || !body.name || !body.phone || 
          !body.organizationName || !body.organizationAddress || 
          !body.organizationPhone || !body.organizationEmail) {
        throw new HttpException('All fields are required', HttpStatus.BAD_REQUEST);
      }

      const exists = await this.userModel.findOne({ email: body.email });
      if (exists) throw new HttpException('Email already in use', HttpStatus.BAD_REQUEST);

      const org = await this.orgModel.create({
        name: body.organizationName,
        address: body.organizationAddress,
        phone: body.organizationPhone,
        email: body.organizationEmail,
        status: 'active',
      });

      const location = await this.locationModel.create({
        name: `${org.name} Main Branch`,
        address: body.organizationAddress,
        phone: body.organizationPhone,
        email: body.organizationEmail,
        status: 'active',
        organization: org._id.toString(),
      });

      const hashed = await bcrypt.hash(body.password, 10);
      const user = await this.userModel.create({
        name: body.name,
        email: body.email,
        password: hashed,
        phone: body.phone,
        role: 'owner',
        organization: org._id.toString(),
        location: location._id.toString(),
      });

      await this.orgModel.updateOne({ _id: org._id }, { owner: user._id.toString() });

      const token = this.jwtService.sign({
        id: user._id.toString(),
        email: user.email,
        role: user.role,
        organizationId: user.organization,
        locationId: user.location,
      });

      res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        maxAge: 24 * 60 * 60 * 1000,
      });

      return res.json({
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          organization: org,
          location: location,
        },
      });
    } catch (error) {
      console.error('Registration error:', error);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        error.message || 'Registration failed', 
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('login')
  async login(@Body() body: LoginBody, @Res() res: Response) {
    const user = await this.userModel.findOne({ email: body.email });
    if (!user) throw new HttpException('Invalid email or password', HttpStatus.UNAUTHORIZED);
    const valid = await bcrypt.compare(body.password, user.password);
    if (!valid) throw new HttpException('Invalid email or password', HttpStatus.UNAUTHORIZED);

    const token = this.jwtService.sign({
      id: user._id.toString(),
      email: user.email,
      role: user.role,
      organizationId: user.organization,
      locationId: user.location,
    });

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 24 * 60 * 60 * 1000,
    });

    return res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      token: token, // Return token in response body as well
    });
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  async profile(@Req() req: Request) {
    try {
      const auth = (req as any).user as { id: string };
      const user = await this.userModel.findById(auth.id).lean();
      
      if (!user) {
        throw new HttpException('User not found', HttpStatus.NOT_FOUND);
      }
      
      const organization = await this.orgModel.findById(user?.organization).lean();
      const location = await this.locationModel.findById(user?.location).lean();
      
      // Generate a fresh token to extend the session
      const token = this.jwtService.sign({
        id: user._id.toString(),
        email: user.email,
        role: user.role,
        organizationId: user.organization,
        locationId: user.location,
      });
      
      return { 
        ...user, 
        organization, 
        location,
        token // Include token in response
      };
    } catch (error) {
      console.error('Profile fetch error:', error);
      throw new HttpException(
        'Failed to fetch profile', 
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('logout')
  async logout(@Res() res: Response) {
    res.clearCookie('token');
    return res.json({ success: true });
  }
}
