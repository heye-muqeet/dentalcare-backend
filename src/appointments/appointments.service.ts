import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Appointment } from '../schemas/appointment.schema';
import { User } from '../schemas/user.schema';

@Injectable()
export class AppointmentsService {
  constructor(
    @InjectModel(Appointment.name) private readonly apptModel: Model<Appointment>,
    @InjectModel(User.name) private readonly userModel: Model<User>,
  ) {}

  async list(organization: string, filters: any) {
    const query: any = { organization };
    if (filters.date) query.date = filters.date;
    if (filters.doctor) query.doctor = filters.doctor;
    if (filters.status) query.status = filters.status;
    if (filters.patient) query.patient = filters.patient;
    return this.apptModel.find(query).lean();
  }

  generateTimestamp(date: string, time: string) {
    const [h, m] = time.split(':').map((v) => parseInt(v, 10));
    const ts = new Date(date);
    ts.setHours(h, m, 0, 0);
    return Math.floor(ts.getTime());
  }

  async getAvailableSlots(doctorId: string, date: string) {
    const start = 9 * 60; // 09:00
    const end = 17 * 60; // 17:00
    const slot = 30; // minutes
    const allSlots: string[] = [];
    for (let t = start; t < end; t += slot) {
      const hh = Math.floor(t / 60).toString().padStart(2, '0');
      const mm = (t % 60).toString().padStart(2, '0');
      allSlots.push(`${hh}:${mm}`);
    }
    const dayAppointments = await this.apptModel.find({ doctor: doctorId, date, status: { $ne: 'cancelled' } }).lean();
    const taken = new Set(dayAppointments.map((a) => a.time));
    return allSlots.filter((s) => !taken.has(s));
  }

  async create(payload: any) {
    const doctor = await this.userModel.findById(payload.doctor);
    if (!doctor || doctor.status !== 'active') {
      throw new HttpException('Doctor not available', HttpStatus.BAD_REQUEST);
    }
    const appointmentTimestamp = this.generateTimestamp(payload.date, payload.time);
    const doubleBook = await this.apptModel.findOne({ doctor: payload.doctor, date: payload.date, time: payload.time, status: { $ne: 'cancelled' } });
    if (doubleBook) throw new HttpException('Time slot already booked', HttpStatus.BAD_REQUEST);
    return this.apptModel.create({ ...payload, appointmentTimestamp });
  }

  async cancel(id: string) {
    await this.apptModel.updateOne({ _id: id }, { $set: { status: 'cancelled' } });
    return { success: true };
  }
}


