import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Treatment, TreatmentSchema } from '../schemas/treatment.schema';
import { Invoice, InvoiceSchema } from '../schemas/invoice.schema';
import { Patient, PatientSchema } from '../schemas/patient.schema';
import { Appointment, AppointmentSchema } from '../schemas/appointment.schema';
import { TreatmentsService } from './treatments.service.js';
import { TreatmentsController } from './treatments.controller.js';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Treatment.name, schema: TreatmentSchema },
      { name: Invoice.name, schema: InvoiceSchema },
      { name: Patient.name, schema: PatientSchema },
      { name: Appointment.name, schema: AppointmentSchema },
    ]),
  ],
  controllers: [TreatmentsController],
  providers: [TreatmentsService],
})
export class TreatmentsModule {}


