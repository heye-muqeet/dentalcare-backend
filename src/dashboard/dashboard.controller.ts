import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import type { Request } from 'express';

@UseGuards(JwtAuthGuard)
@Controller('dashboard')
export class DashboardController {
  @Get()
  async get(@Req() req: Request) {
    const user = (req as any).user as { role: string };
    if (user.role === 'doctor') {
      return {
        todayAppointments: 0,
        totalPatients: 0,
        monthlyTreatments: 0,
        totalTreatments: 0,
        successfulTreatments: 0,
        successRate: 0,
        appointmentChange: 0,
        patientGrowth: 0,
      };
    }
    return {
      todayAppointments: 0,
      totalPatients: 0,
      revenue: 0,
      monthlyTreatments: 0,
      pendingAppointments: 0,
      outstandingBalance: 0,
      totalPaidInvoices: 0,
      totalExpenses: 0,
    };
  }
}


