import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { PatientsModule } from './patients/patients.module';
import { AppointmentsModule } from './appointments/appointments.module';
import { ServicesModule } from './services/services.module';
import { InvoicesModule } from './invoices/invoices.module';
import { PaymentsModule } from './payments/payments.module';
import { ExpensesModule } from './expenses/expenses.module';
import { MediaModule } from './media/media.module';
import { ReportsModule } from './reports/reports.module';
import { TreatmentsModule } from './treatments/treatments.module';
import { DashboardController } from './dashboard/dashboard.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env'],
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        uri: configService.get<string>('DATABASE_URL'),
      }),
    }),
    AuthModule,
    UsersModule,
    PatientsModule,
    AppointmentsModule,
    ServicesModule,
    InvoicesModule,
    PaymentsModule,
    ExpensesModule,
    MediaModule,
    ReportsModule,
    TreatmentsModule,
  ],
  controllers: [AppController, DashboardController],
  providers: [AppService],
})
export class AppModule {}
