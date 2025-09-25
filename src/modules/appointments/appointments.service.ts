import { Injectable, NotFoundException, ForbiddenException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Appointment, AppointmentDocument } from '../../schemas/appointment-schema';
import { AppointmentStatus, VisitType } from '../../schemas/appointment.enums';
import { Patient, PatientDocument } from '../../schemas/patient.schema';
import { Doctor, DoctorDocument } from '../../schemas/doctor.schema';
import { Branch, BranchDocument } from '../../schemas/branch.schema';

export interface CreateAppointmentDto {
  patientId: string;
  doctorId?: string;
  appointmentDate: string; // ISO date string
  startTime: string; // HH:MM format
  endTime?: string; // HH:MM format, calculated if not provided
  visitType: VisitType;
  reasonForVisit: string;
  notes?: string;
  duration?: number; // in minutes, defaults to 30
  isEmergency?: boolean;
  isWalkIn?: boolean; // Derived from visitType
  metadata?: {
    source?: string;
    priority?: 'low' | 'normal' | 'high' | 'urgent';
  };
}

export interface UpdateAppointmentDto {
  doctorId?: string;
  appointmentDate?: string;
  startTime?: string;
  endTime?: string;
  reasonForVisit?: string;
  notes?: string;
  duration?: number;
  status?: AppointmentStatus;
  isEmergency?: boolean;
  isWalkIn?: boolean;
  lastAssignedDoctor?: Types.ObjectId;
  lastDoctorAssignmentAt?: Date;
  metadata?: {
    source?: string;
    priority?: 'low' | 'normal' | 'high' | 'urgent';
    reminderSent?: boolean;
    confirmationSent?: boolean;
    followUpRequired?: boolean;
  };
}

export interface AvailableSlot {
  startTime: string;
  endTime: string;
  isAvailable: boolean;
  doctorId?: string;
  doctorName?: string;
}

export interface SlotValidationResult {
  success: boolean;
  data: {
    available: boolean;
    reason?: string;
  };
}

@Injectable()
export class AppointmentsService {
  constructor(
    @InjectModel(Appointment.name) private appointmentModel: Model<AppointmentDocument>,
    @InjectModel(Patient.name) private patientModel: Model<PatientDocument>,
    @InjectModel(Doctor.name) private doctorModel: Model<DoctorDocument>,
    @InjectModel(Branch.name) private branchModel: Model<BranchDocument>,
  ) {}

  async create(
    createAppointmentDto: CreateAppointmentDto,
    branchId: string,
    organizationId: string,
    createdBy: string,
    userRole: string,
    userOrganizationId?: string,
    userBranchId?: string
  ): Promise<Appointment> {
    console.log('🔍 AppointmentsService.create called with:', {
      createAppointmentDto,
      branchId,
      organizationId,
      createdBy,
      userRole,
      userOrganizationId,
      userBranchId
    });

    // Check permissions
    if (userRole === 'super_admin') {
      console.log('✅ Super admin creating appointment');
      // Super admin can create appointments in any branch
    } else if (userRole === 'organization_admin' && userOrganizationId === organizationId) {
      console.log('✅ Organization admin creating appointment');
      // Organization admin can create appointments in their organization's branches
    } else if (userRole === 'branch_admin' && userBranchId === branchId) {
      console.log('✅ Branch admin creating appointment');
      // Branch admin can create appointments in their own branch
    } else if (userRole === 'receptionist' && userBranchId === branchId) {
      console.log('✅ Receptionist creating appointment');
      // Receptionist can create appointments in their own branch
    } else {
      console.log('❌ Insufficient permissions:', { userRole, userBranchId, branchId });
      throw new ForbiddenException('Insufficient permissions to create appointment');
    }

    // Validate patient exists and belongs to the branch
    console.log('🔍 Looking for patient:', {
      patientId: createAppointmentDto.patientId,
      branchId: branchId,
      branchIdObjectId: new Types.ObjectId(branchId)
    });
    
    const patient = await this.patientModel.findOne({
      _id: createAppointmentDto.patientId,
      branchId: new Types.ObjectId(branchId),
      isActive: true
    }).exec();

    console.log('🔍 Patient found:', patient ? 'Yes' : 'No');
    if (patient) {
      console.log('🔍 Patient details:', {
        _id: patient._id,
        name: patient.name,
        branchId: patient.branchId,
        isActive: patient.isActive
      });
    }

    if (!patient) {
      console.log('❌ Patient not found or does not belong to this branch');
      throw new NotFoundException('Patient not found or does not belong to this branch');
    }

    // Validate doctor if provided
    let doctor: any = null;
    if (createAppointmentDto.doctorId) {
      doctor = await this.doctorModel.findOne({
        _id: createAppointmentDto.doctorId,
        branchId: new Types.ObjectId(branchId),
        isActive: true
      }).exec();

      if (!doctor) {
        throw new NotFoundException('Doctor not found or does not belong to this branch');
      }
    }

    // Validate branch exists
    const branch = await this.branchModel.findById(branchId).exec();
    if (!branch) {
      throw new NotFoundException('Branch not found');
    }

    // Parse appointment date and time
    const appointmentDate = new Date(createAppointmentDto.appointmentDate);
    const duration = createAppointmentDto.duration || 30;
    const endTime = createAppointmentDto.endTime || this.calculateEndTime(createAppointmentDto.startTime, duration);

    // Validate slot availability
    const slotValidation = await this.validateSlotAvailability(
      createAppointmentDto.doctorId,
      branchId,
      organizationId,
      appointmentDate,
      createAppointmentDto.startTime,
      endTime,
      createAppointmentDto.patientId,
      undefined,
      createAppointmentDto.isWalkIn
    );

    if (!slotValidation.success || !slotValidation.data.available) {
      throw new ConflictException(`Slot not available: ${slotValidation.data.reason || 'Unknown conflict'}`);
    }

    // Create appointment
    const appointment = new this.appointmentModel({
      ...createAppointmentDto,
      patientId: new Types.ObjectId(createAppointmentDto.patientId),
      doctorId: createAppointmentDto.doctorId ? new Types.ObjectId(createAppointmentDto.doctorId) : undefined,
      branchId: new Types.ObjectId(branchId),
      organizationId: new Types.ObjectId(organizationId),
      createdBy: new Types.ObjectId(createdBy),
      appointmentDate,
      startTime: createAppointmentDto.startTime,
      endTime,
      duration,
      isWalkIn: createAppointmentDto.isWalkIn || createAppointmentDto.visitType === VisitType.WALK_IN,
      lastAssignedDoctor: createAppointmentDto.doctorId ? new Types.ObjectId(createAppointmentDto.doctorId) : undefined,
      lastDoctorAssignmentAt: createAppointmentDto.doctorId ? new Date() : undefined,
    });

    const savedAppointment = await appointment.save();
    return this.populateAppointment(savedAppointment);
  }

  async findAll(
    branchId: string,
    organizationId: string,
    userRole: string,
    userOrganizationId?: string,
    userBranchId?: string,
    filters?: {
      status?: AppointmentStatus;
      doctorId?: string;
      patientId?: string;
      dateFrom?: string;
      dateTo?: string;
    }
  ): Promise<Appointment[]> {
    // Check permissions
    if (userRole === 'super_admin') {
      // Super admin can view all appointments
    } else if (userRole === 'organization_admin' && userOrganizationId === organizationId) {
      // Organization admin can view appointments in their organization
    } else if (userRole === 'branch_admin' && userBranchId === branchId) {
      // Branch admin can view appointments in their branch
    } else if (userRole === 'receptionist' && userBranchId === branchId) {
      // Receptionist can view appointments in their branch
    } else if (userRole === 'doctor' && userBranchId === branchId) {
      // Doctor can view their own appointments
    } else {
      throw new ForbiddenException('Insufficient permissions to view appointments');
    }

    const query: any = {
      branchId: new Types.ObjectId(branchId),
      organizationId: new Types.ObjectId(organizationId),
    };

    // Apply filters
    if (filters?.status) {
      query.status = filters.status;
    }
    if (filters?.doctorId) {
      query.doctorId = new Types.ObjectId(filters.doctorId);
    }
    if (filters?.patientId) {
      query.patientId = new Types.ObjectId(filters.patientId);
    }
    if (filters?.dateFrom || filters?.dateTo) {
      query.appointmentDate = {};
      if (filters.dateFrom) {
        query.appointmentDate.$gte = new Date(filters.dateFrom);
      }
      if (filters.dateTo) {
        query.appointmentDate.$lte = new Date(filters.dateTo);
      }
    }

    // If user is a doctor, only show their appointments
    if (userRole === 'doctor') {
      query.doctorId = new Types.ObjectId(userBranchId); // Assuming userBranchId contains doctorId for doctors
    }

    const appointments = await this.appointmentModel
      .find(query)
      .populate('patientId', 'name email phone')
      .populate('doctorId', 'firstName lastName specialization')
      .populate('createdBy', 'firstName lastName email')
      .populate('cancelledBy', 'firstName lastName email')
      .sort({ appointmentDate: 1, startTime: 1 })
      .exec();

    return appointments;
  }

  async findOne(
    id: string,
    branchId: string,
    organizationId: string,
    userRole: string,
    userOrganizationId?: string,
    userBranchId?: string
  ): Promise<Appointment> {
    const appointment = await this.appointmentModel
      .findOne({
        _id: id,
        branchId: new Types.ObjectId(branchId),
        organizationId: new Types.ObjectId(organizationId),
      })
      .populate('patientId', 'name email phone dateOfBirth')
      .populate('doctorId', 'firstName lastName specialization email phone')
      .populate('createdBy', 'firstName lastName email')
      .populate('cancelledBy', 'firstName lastName email')
      .exec();

    if (!appointment) {
      throw new NotFoundException('Appointment not found');
    }

    // Check permissions
    const hasPermission = this.checkAppointmentPermission(
      appointment,
      userRole,
      userOrganizationId,
      userBranchId
    );

    if (!hasPermission) {
      throw new ForbiddenException('Insufficient permissions to view this appointment');
    }

    return appointment;
  }

  async update(
    id: string,
    updateAppointmentDto: UpdateAppointmentDto,
    branchId: string,
    organizationId: string,
    userRole: string,
    userOrganizationId?: string,
    userBranchId?: string
  ): Promise<Appointment> {
    const appointment = await this.appointmentModel
      .findOne({
        _id: id,
        branchId: new Types.ObjectId(branchId),
        organizationId: new Types.ObjectId(organizationId),
      })
      .exec();

    if (!appointment) {
      throw new NotFoundException('Appointment not found');
    }

    // Check permissions
    const hasPermission = this.checkAppointmentPermission(
      appointment,
      userRole,
      userOrganizationId,
      userBranchId
    );

    if (!hasPermission) {
      throw new ForbiddenException('Insufficient permissions to update this appointment');
    }

    // If updating doctor, validate the new doctor
    if (updateAppointmentDto.doctorId && updateAppointmentDto.doctorId !== appointment.doctorId?.toString()) {
      const doctor = await this.doctorModel.findOne({
        _id: updateAppointmentDto.doctorId,
        branchId: new Types.ObjectId(branchId),
        isActive: true
      }).exec();

      if (!doctor) {
        throw new NotFoundException('Doctor not found or does not belong to this branch');
      }

      // Validate slot availability with new doctor
      const appointmentDate = updateAppointmentDto.appointmentDate ? 
        new Date(updateAppointmentDto.appointmentDate) : 
        appointment.appointmentDate;
      
      const startTime = updateAppointmentDto.startTime || appointment.startTime;
      const duration = updateAppointmentDto.duration || appointment.duration;
      const endTime = this.calculateEndTime(startTime, duration);

      const slotValidation = await this.validateSlotAvailability(
        updateAppointmentDto.doctorId,
        branchId,
        organizationId,
        appointmentDate,
        startTime,
        endTime,
        appointment.patientId.toString(),
        id, // Exclude current appointment from conflict check
        updateAppointmentDto.isWalkIn
      );

      if (!slotValidation.success || !slotValidation.data.available) {
        throw new ConflictException(`Slot not available: ${slotValidation.data.reason || 'Unknown conflict'}`);
      }

      updateAppointmentDto.lastAssignedDoctor = new Types.ObjectId(updateAppointmentDto.doctorId);
      updateAppointmentDto.lastDoctorAssignmentAt = new Date();
    }

    // If updating time/date, validate slot availability
    if (updateAppointmentDto.appointmentDate || updateAppointmentDto.startTime) {
      const appointmentDate = updateAppointmentDto.appointmentDate ? 
        new Date(updateAppointmentDto.appointmentDate) : 
        appointment.appointmentDate;
      
      const startTime = updateAppointmentDto.startTime || appointment.startTime;
      const duration = updateAppointmentDto.duration || appointment.duration;
      const endTime = this.calculateEndTime(startTime, duration);

      const slotValidation = await this.validateSlotAvailability(
        appointment.doctorId?.toString(),
        branchId,
        organizationId,
        appointmentDate,
        startTime,
        endTime,
        appointment.patientId.toString(),
        id, // Exclude current appointment from conflict check
        updateAppointmentDto.isWalkIn
      );

      if (!slotValidation.success || !slotValidation.data.available) {
        throw new ConflictException(`Slot not available: ${slotValidation.data.reason || 'Unknown conflict'}`);
      }

      updateAppointmentDto.endTime = endTime;
    }

    // Update appointment
    const updatedAppointment = await this.appointmentModel
      .findByIdAndUpdate(id, updateAppointmentDto, { new: true })
      .populate('patientId', 'name email phone')
      .populate('doctorId', 'firstName lastName specialization')
      .populate('createdBy', 'firstName lastName email')
      .populate('cancelledBy', 'firstName lastName email')
      .exec();

    if (!updatedAppointment) {
      throw new NotFoundException('Appointment not found after update');
    }

    return updatedAppointment;
  }

  async cancel(
    id: string,
    cancellationReason: string,
    branchId: string,
    organizationId: string,
    cancelledBy: string,
    userRole: string,
    userOrganizationId?: string,
    userBranchId?: string
  ): Promise<Appointment> {
    const appointment = await this.appointmentModel
      .findOne({
        _id: id,
        branchId: new Types.ObjectId(branchId),
        organizationId: new Types.ObjectId(organizationId),
      })
      .exec();

    if (!appointment) {
      throw new NotFoundException('Appointment not found');
    }

    // Check permissions
    const hasPermission = this.checkAppointmentPermission(
      appointment,
      userRole,
      userOrganizationId,
      userBranchId
    );

    if (!hasPermission) {
      throw new ForbiddenException('Insufficient permissions to cancel this appointment');
    }

    // Check if appointment can be cancelled
    if (appointment.status === AppointmentStatus.COMPLETED) {
      throw new BadRequestException('Cannot cancel a completed appointment');
    }

    if (appointment.status === AppointmentStatus.CANCELLED) {
      throw new BadRequestException('Appointment is already cancelled');
    }

    // Update appointment
    const updatedAppointment = await this.appointmentModel
      .findByIdAndUpdate(
        id,
        {
          status: AppointmentStatus.CANCELLED,
          cancelledAt: new Date(),
          cancelledBy: new Types.ObjectId(cancelledBy),
          cancellationReason,
        },
        { new: true }
      )
      .populate('patientId', 'name email phone')
      .populate('doctorId', 'firstName lastName specialization')
      .populate('createdBy', 'firstName lastName email')
      .populate('cancelledBy', 'firstName lastName email')
      .exec();

    if (!updatedAppointment) {
      throw new NotFoundException('Appointment not found after cancellation');
    }

    return updatedAppointment;
  }

  async getAvailableSlots(
    branchId: string,
    organizationId: string,
    date: string,
    doctorId?: string,
    duration: number = 30
  ): Promise<AvailableSlot[]> {
    const appointmentDate = new Date(date);
    const branch = await this.branchModel.findById(branchId).exec();
    
    if (!branch) {
      throw new NotFoundException('Branch not found');
    }

    const dayOfWeek = appointmentDate.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    const branchHours = branch.operatingHours[dayOfWeek];

    if (!branchHours || !branchHours.isOpen) {
      return []; // Branch is closed on this day
    }

    const slots: AvailableSlot[] = [];
    const startTime = this.timeToMinutes(branchHours.open);
    const endTime = this.timeToMinutes(branchHours.close);

    // Generate 30-minute slots
    for (let time = startTime; time < endTime; time += duration) {
      const slotStartTime = this.minutesToTime(time);
      const slotEndTime = this.minutesToTime(time + duration);

      // Check if doctor is available at this time
      let isAvailable = true;
      let doctorName = '';

      if (doctorId) {
        const doctor = await this.doctorModel.findById(doctorId).exec();
        if (!doctor) {
          isAvailable = false;
        } else {
          doctorName = `${doctor.firstName} ${doctor.lastName}`;
          const doctorAvailability = doctor.availability[dayOfWeek];
          if (!doctorAvailability || !doctorAvailability.isAvailable) {
            isAvailable = false;
          } else {
            const doctorStart = this.timeToMinutes(doctorAvailability.start);
            const doctorEnd = this.timeToMinutes(doctorAvailability.end);
            if (time < doctorStart || time + duration > doctorEnd) {
              isAvailable = false;
            }
          }
        }
      }

      // Check for existing appointments
      if (isAvailable) {
        const existingAppointment = await this.appointmentModel.findOne({
          branchId: new Types.ObjectId(branchId),
          appointmentDate: {
            $gte: new Date(appointmentDate.setHours(0, 0, 0, 0)),
            $lt: new Date(appointmentDate.setHours(23, 59, 59, 999))
          },
          startTime: slotStartTime,
          status: { $in: [AppointmentStatus.SCHEDULED, AppointmentStatus.IN_PROGRESS] },
          ...(doctorId && { doctorId: new Types.ObjectId(doctorId) })
        }).exec();

        if (existingAppointment) {
          isAvailable = false;
        }
      }

      slots.push({
        startTime: slotStartTime,
        endTime: slotEndTime,
        isAvailable,
        doctorId,
        doctorName
      });
    }

    return slots;
  }

  async validateSlotAvailability(
    doctorId: string | undefined,
    branchId: string,
    organizationId: string,
    appointmentDate: Date,
    startTime: string,
    endTime: string,
    patientId: string,
    excludeAppointmentId?: string,
    isWalkIn?: boolean
  ): Promise<SlotValidationResult> {
    try {
      console.log('🔍 validateSlotAvailability called with:', {
        doctorId,
        branchId,
        organizationId,
        appointmentDate: appointmentDate.toISOString(),
        startTime,
        endTime,
        patientId,
        excludeAppointmentId
      });

      const conflicts: string[] = [];

      // Check if the appointment is in the future (skip for walk-in appointments)
      if (!isWalkIn) {
        const now = new Date();
        const appointmentDateTime = new Date(appointmentDate);
        const [hours, minutes] = startTime.split(':').map(Number);
        appointmentDateTime.setHours(hours, minutes, 0, 0);
        
        // Add 30 minutes buffer to current time
        const bufferTime = new Date(now.getTime() + 30 * 60 * 1000);
        
        if (appointmentDateTime < bufferTime) {
          conflicts.push('Appointment time must be at least 30 minutes in the future');
          console.log('❌ Slot is in the past:', {
            appointmentTime: appointmentDateTime.toISOString(),
            currentTime: now.toISOString(),
            bufferTime: bufferTime.toISOString()
          });
        }
      } else {
        console.log('🚶‍♂️ Skipping past time validation for walk-in appointment');
        
        // For walk-in appointments, check if branch is currently open
        const branch = await this.branchModel.findById(branchId).exec();
        if (branch) {
          const now = new Date();
          const dayOfWeek = now.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
          const branchHours = branch.operatingHours[dayOfWeek];
          
          if (!branchHours || !branchHours.isOpen) {
            conflicts.push('Walk-in appointments are not available - branch is currently closed');
            console.log('❌ Branch is closed for walk-in appointments:', {
              dayOfWeek,
              isOpen: branchHours?.isOpen,
              currentTime: now.toTimeString().slice(0, 5)
            });
          } else {
            const currentTime = now.toTimeString().slice(0, 5);
            const currentMinutes = this.timeToMinutes(currentTime);
            const branchStart = this.timeToMinutes(branchHours.open);
            const branchEnd = this.timeToMinutes(branchHours.close);
            
            if (currentMinutes < branchStart || currentMinutes > branchEnd) {
              conflicts.push('Walk-in appointments are not available - current time is outside branch operating hours');
              console.log('❌ Current time outside branch hours for walk-in:', {
                currentTime,
                branchOpen: branchHours.open,
                branchClose: branchHours.close,
                currentMinutes,
                branchStart,
                branchEnd
              });
            } else {
              console.log('✅ Branch is open for walk-in appointment:', {
                currentTime,
                branchOpen: branchHours.open,
                branchClose: branchHours.close
              });
            }
          }
        }
      }

      // Check if patient already has an appointment at this time
      const startOfDay = new Date(appointmentDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(appointmentDate);
      endOfDay.setHours(23, 59, 59, 999);
    
    // Skip patient conflict check if patientId is 'temp' (for new patients)
    let patientConflict: AppointmentDocument | null = null;
    if (patientId && patientId !== 'temp' && Types.ObjectId.isValid(patientId)) {
      patientConflict = await this.appointmentModel.findOne({
        patientId: new Types.ObjectId(patientId),
        branchId: new Types.ObjectId(branchId),
        organizationId: new Types.ObjectId(organizationId),
        appointmentDate: {
          $gte: startOfDay,
          $lt: endOfDay
        },
        startTime,
        status: { $in: [AppointmentStatus.SCHEDULED, AppointmentStatus.IN_PROGRESS] },
        isDeleted: { $ne: true },
        ...(excludeAppointmentId && { _id: { $ne: new Types.ObjectId(excludeAppointmentId) } })
      }).exec();
    }

    if (patientConflict) {
      conflicts.push('Patient already has an appointment at this time');
    }

    // Check doctor availability if doctor is specified
    if (doctorId && Types.ObjectId.isValid(doctorId)) {
      const doctorConflict = await this.appointmentModel.findOne({
        doctorId: new Types.ObjectId(doctorId),
        branchId: new Types.ObjectId(branchId),
        organizationId: new Types.ObjectId(organizationId),
        appointmentDate: {
          $gte: startOfDay,
          $lt: endOfDay
        },
        startTime,
        status: { $in: [AppointmentStatus.SCHEDULED, AppointmentStatus.IN_PROGRESS] },
        isDeleted: { $ne: true },
        ...(excludeAppointmentId && { _id: { $ne: new Types.ObjectId(excludeAppointmentId) } })
      }).exec();

      if (doctorConflict) {
        conflicts.push('Doctor already has an appointment at this time');
      }

      // Check doctor's working hours
      const doctor = await this.doctorModel.findById(doctorId).exec();
      if (doctor) {
        const dayOfWeek = appointmentDate.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
        const doctorAvailability = doctor.availability[dayOfWeek];
        
        if (!doctorAvailability || !doctorAvailability.isAvailable) {
          conflicts.push('Doctor is not available on this day');
        } else {
          const doctorStart = this.timeToMinutes(doctorAvailability.start);
          const doctorEnd = this.timeToMinutes(doctorAvailability.end);
          const slotStart = this.timeToMinutes(startTime);
          const slotEnd = this.timeToMinutes(endTime);
          
          if (slotStart < doctorStart || slotEnd > doctorEnd) {
            conflicts.push('Appointment time is outside doctor\'s working hours');
          }
        }
      }
    }

    // Check branch operating hours
    const branch = await this.branchModel.findById(branchId).exec();
    if (branch) {
      const dayOfWeek = appointmentDate.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
      const branchHours = branch.operatingHours[dayOfWeek];
      
      if (!branchHours || !branchHours.isOpen) {
        if (isWalkIn) {
          conflicts.push('Walk-in appointments are not available - branch is closed on this day');
        } else {
          conflicts.push('Branch is closed on this day');
        }
      } else {
        const branchStart = this.timeToMinutes(branchHours.open);
        const branchEnd = this.timeToMinutes(branchHours.close);
        const slotStart = this.timeToMinutes(startTime);
        const slotEnd = this.timeToMinutes(endTime);
        
        if (slotStart < branchStart || slotEnd > branchEnd) {
          if (isWalkIn) {
            conflicts.push('Walk-in appointments are not available - current time is outside branch operating hours');
          } else {
            conflicts.push('Appointment time is outside branch operating hours');
          }
        }
      }
    }

      return {
        success: true,
        data: {
          available: conflicts.length === 0,
          reason: conflicts.length > 0 ? conflicts.join('; ') : undefined
        }
      };
    } catch (error) {
      console.error('❌ Error in validateSlotAvailability:', error);
      return {
        success: false,
        data: {
          available: false,
          reason: 'Error validating slot availability'
        }
      };
    }
  }

  private calculateEndTime(startTime: string, duration: number): string {
    const startMinutes = this.timeToMinutes(startTime);
    const endMinutes = startMinutes + duration;
    return this.minutesToTime(endMinutes);
  }

  private timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }

  private minutesToTime(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  }

  private async populateAppointment(appointment: AppointmentDocument): Promise<Appointment> {
    const populatedAppointment = await this.appointmentModel
      .findById(appointment._id)
      .populate('patientId', 'name email phone')
      .populate('doctorId', 'firstName lastName specialization')
      .populate('createdBy', 'firstName lastName email')
      .populate('cancelledBy', 'firstName lastName email')
      .exec();

    if (!populatedAppointment) {
      throw new NotFoundException('Appointment not found');
    }

    return populatedAppointment;
  }

  private checkAppointmentPermission(
    appointment: Appointment,
    userRole: string,
    userOrganizationId?: string,
    userBranchId?: string
  ): boolean {
    if (userRole === 'super_admin') {
      return true;
    }
    
    if (userRole === 'organization_admin' && userOrganizationId === appointment.organizationId.toString()) {
      return true;
    }
    
    if (userRole === 'branch_admin' && userBranchId === appointment.branchId.toString()) {
      return true;
    }
    
    if (userRole === 'receptionist' && userBranchId === appointment.branchId.toString()) {
      return true;
    }
    
    if (userRole === 'doctor' && appointment.doctorId && userBranchId === appointment.doctorId.toString()) {
      return true;
    }
    
    return false;
  }

  async checkExistingAppointment(
    patientId: string,
    appointmentDate: string,
    branchId: string,
    organizationId: string,
    userRole: string,
    userOrganizationId?: string,
    userBranchId?: string
  ): Promise<{ hasAppointment: boolean; existingAppointment?: any; canCreateNew: boolean; reason?: string }> {
    console.log('🔍 Checking for existing appointment:', {
      patientId,
      appointmentDate,
      branchId,
      organizationId,
      userRole
    });

    // Permission checks
    if (userRole === 'super_admin') {
      // Super admin can check any appointment
    } else if (userRole === 'organization_admin' && userOrganizationId) {
      if (organizationId !== userOrganizationId) {
        throw new ForbiddenException('Insufficient permissions');
      }
    } else if ((userRole === 'branch_admin' || userRole === 'receptionist') && userBranchId) {
      if (branchId !== userBranchId) {
        throw new ForbiddenException('Insufficient permissions');
      }
    } else {
      throw new ForbiddenException('Insufficient permissions');
    }

    // Find ANY existing active appointment for the patient (not just same date)
    const existingAppointment = await this.appointmentModel.findOne({
      patientId: new Types.ObjectId(patientId),
      branchId: new Types.ObjectId(branchId),
      organizationId: new Types.ObjectId(organizationId),
      status: { $in: ['scheduled', 'in_progress'] }, // Only check active appointments
      isDeleted: { $ne: true }
    }).populate('patientId', 'name email phone').populate('doctorId', 'firstName lastName specialization').exec();

    console.log('🔍 Existing active appointment found:', existingAppointment ? 'Yes' : 'No');
    if (existingAppointment) {
      console.log('🔍 Existing appointment details:', {
        id: existingAppointment._id,
        patientName: (existingAppointment.patientId as any)?.name || 'Unknown',
        appointmentDate: existingAppointment.appointmentDate,
        startTime: existingAppointment.startTime,
        status: existingAppointment.status
      });
    }

    // Determine if a new appointment can be created
    let canCreateNew = true;
    let reason = '';

    if (existingAppointment) {
      canCreateNew = false;
      reason = `Patient already has an active ${existingAppointment.status} appointment scheduled for ${existingAppointment.appointmentDate.toISOString().split('T')[0]} at ${existingAppointment.startTime}. Please complete or cancel the existing appointment before creating a new one.`;
    }

    return {
      hasAppointment: !!existingAppointment,
      existingAppointment: existingAppointment || null,
      canCreateNew,
      reason
    };
  }
}
