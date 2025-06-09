/**
 * AppointmentController
 */

module.exports = {
  /**
   * Create a new appointment
   */
  create: async function(req, res) {
    try {
      const { 
        date, 
        time, 
        reason, 
        patientId, 
        doctorId, 
        notes,
        followUpForId 
      } = req.body;

      // Validate required fields
      if (!date || !time || !reason || !patientId || !doctorId ) {
        return res.badRequest({ message: 'Missing required fields' });
      }

      // Parse and validate date format
      const appointmentDate = new Date(date);
      if (isNaN(appointmentDate)) {
        return res.badRequest({ message: 'Invalid date format. Please use ISO format (YYYY-MM-DDT00:00:00.000Z)' });
      }

      // Validate time format (24-hour)
      const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
      if (!timeRegex.test(time)) {
        return res.badRequest({ message: 'Invalid time format. Please use 24-hour format (HH:MM).' });
      }

      // Create timestamp for the appointment (useful for sorting and queries)
      const [hours, minutes] = time.split(':').map(Number);
      const appointmentTimestamp = new Date(appointmentDate);
      appointmentTimestamp.setHours(hours, minutes, 0, 0);

      // Create the appointment with ISO date format
      const appointment = await Appointment.create({
        date: appointmentDate.toISOString(), // Store in ISO format
        time,
        reason,
        appointmentTimestamp: appointmentTimestamp.getTime(), // Store as epoch timestamp
        patient: patientId,
        doctor: doctorId,
        organization: req.user.organization,
        location: req.user.location,
        addedBy: req.user.id,
        notes: notes || '',
        followUpFor: followUpForId || null,
      }).fetch();

      return res.json({
        message: 'Appointment created successfully',
        data: appointment
      });
    } catch (error) {
        console.log(error);
      if (error.message === 'Time slot is already booked' || error.message === 'Doctor not found') {
        return res.badRequest({ message: error.message });
      }
      return res.serverError({ message: 'An error occurred', error: error.message });
    }
  },

  /**
   * Update an appointment
   */
  update: async function(req, res) {
    try {
      const { id } = req.params;
      const { 
        date, 
        time, 
        reason, 
        status,
        notes,
        followUpForId,
        doctorId
      } = req.body;

      if (!id) {
        return res.badRequest({ message: 'Appointment ID is required' });
      }

      // Check if appointment exists
      const appointment = await Appointment.findOne({ id });
      if (!appointment) {
        return res.notFound({ message: 'Appointment not found' });
      }

      // Prepare update data
      const updateData = {};

      // Only include fields that are provided in the request
      if (date) {
        const appointmentDate = new Date(date);
        if (isNaN(appointmentDate)) {
          return res.badRequest({ message: 'Invalid date format. Please use ISO format (YYYY-MM-DDT00:00:00.000Z)'});
        }
        updateData.date = appointmentDate.toISOString(); // Store in ISO format
      }

      if (time) {
        const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
        if (!timeRegex.test(time)) {
          return res.badRequest({ message: 'Invalid time format. Please use 24-hour format (HH:MM).' });
        }
        updateData.time = time;
      }

      // Update timestamp if date or time changed
      if (date || time) {
        const updatedDate = date ? new Date(date) : new Date(appointment.date);
        const updatedTime = time || appointment.time;
        const [hours, minutes] = updatedTime.split(':').map(Number);
        
        const appointmentTimestamp = new Date(updatedDate);
        appointmentTimestamp.setHours(hours, minutes, 0, 0);
        updateData.appointmentTimestamp = appointmentTimestamp.getTime(); // Store as epoch timestamp
      }

      if (reason) updateData.reason = reason;
      if (status) {
        if (!['pending', 'confirmed', 'completed', 'cancelled'].includes(status)) {
          return res.badRequest({ message: 'Invalid status value' });
        }
        updateData.status = status;
      }
      if (notes !== undefined) updateData.notes = notes;
      if (followUpForId) updateData.followUpFor = followUpForId;
      if (doctorId) updateData.doctor = doctorId;

      // Update the appointment
      const updatedAppointment = await Appointment.updateOne({ id }).set(updateData);

      if (!updatedAppointment) {
        return res.serverError({ message: 'Failed to update appointment' });
      }

      return res.json({
        message: 'Appointment updated successfully',
        data: updatedAppointment
      });
    } catch (error) {
      return res.serverError({ message: 'An error occurred', error: error.message });
    }
  },

  /**
   * Find all appointments
   */
  find: async function(req, res) {
    try {
      const { 
        doctorId, 
        patientId, 
        status, 
        startDate, 
        endDate, 
        organizationId 
      } = req.query;

      // Build query criteria
      const criteria = {};

      if (req.user.role === 'doctor') criteria.doctor = req.user.id;
      if (patientId) criteria.patient = patientId;
      if (status) criteria.status = status;
      if (organizationId) criteria.organization = organizationId;

      // Date range filter using timestamps for more efficient filtering
      if (startDate || endDate) {
        criteria.appointmentTimestamp = {};
        
        if (startDate) {
          const start = new Date(startDate);
          if (isNaN(start)) {
            return res.badRequest({ message: 'Invalid startDate format. Please use ISO format.' });
          }
          start.setHours(0, 0, 0, 0);
          criteria.appointmentTimestamp['>='] = start.getTime();
        }
        
        if (endDate) {
          const end = new Date(endDate);
          if (isNaN(end)) {
            return res.badRequest({ message: 'Invalid endDate format. Please use ISO format.' });
          }
          end.setHours(23, 59, 59, 999);
          criteria.appointmentTimestamp['<='] = end.getTime();
        }
      }

      // Query appointments with populated fields
      const appointments = await Appointment.find(criteria)
        .populate('patient')
        .populate('doctor')
        .populate('organization')
        .populate('location')
        .populate('followUpFor')
        .sort('appointmentTimestamp DESC');

      return res.json(appointments);
    } catch (error) {
      return res.serverError({ message: 'An error occurred', error: error.message });
    }
  },

  /**
   * Find a single appointment
   */
  findOne: async function(req, res) {
    try {
      const { id } = req.params;
      
      if (!id) {
        return res.badRequest({ message: 'Appointment ID is required' });
      }

      const appointment = await Appointment.findOne({ id })
        .populate('patient')
        .populate('doctor')
        .populate('organization')
        .populate('location')
        .populate('followUpFor');

      if (!appointment) {
        return res.notFound({ message: 'Appointment not found' });
      }

      return res.json(appointment);
    } catch (error) {
      return res.serverError({ message: 'An error occurred', error: error.message });
    }
  },

  /**
   * Cancel an appointment
   */
  cancel: async function(req, res) {
    try {
      const { id } = req.params;
      const { reason } = req.body;

      if (!id) {
        return res.badRequest({ message: 'Appointment ID is required' });
      }

      // Find the appointment
      const appointment = await Appointment.findOne({
        id,
        organization: req.user.organization,
        location: req.user.location
      });

      if (!appointment) {
        return res.notFound({ message: 'Appointment not found' });
      }

      // Check if appointment is already cancelled
      if (appointment.status === 'cancelled') {
        return res.badRequest({ message: 'Appointment is already cancelled' });
      }

      // Check if appointment is already completed
      if (appointment.status === 'completed') {
        return res.badRequest({ message: 'Cannot cancel a completed appointment' });
      }

      // Only allow cancellation by appointment owner (doctor), patient, or admin roles
      if (req.user.role === 'doctor' && appointment.doctor !== req.user.id) {
        return res.forbidden({ message: 'You can only cancel your own appointments' });
      }

      // Update appointment status to cancelled
      const cancelledAppointment = await Appointment.updateOne({ id }).set({
        status: 'cancelled',
        notes: reason ? `${appointment.notes || ''}\nCancellation reason: ${reason}`.trim() : appointment.notes
      });

      if (!cancelledAppointment) {
        return res.serverError({ message: 'Failed to cancel appointment' });
      }

      return res.json({
        status: 'success',
        message: 'Appointment cancelled successfully',
        data: cancelledAppointment
      });

    } catch (error) {
      sails.log.error('Error cancelling appointment:', error);
      return res.serverError({ 
        status: 'error',
        message: 'An error occurred while cancelling the appointment', 
        error: error.message 
      });
    }
  },

  /**
   * Get available time slots for a doctor on a specific date
   */
  getAvailableSlots: async function(req, res) {
    try {
      const { doctorId, date } = req.query;

      if (!doctorId || !date) {
        return res.badRequest({ message: 'Doctor ID and date are required' });
      }

      // Validate doctor exists
      const doctor = await User.findOne({ id: doctorId });
      if (!doctor) {
        return res.badRequest({ message: 'Doctor not found' });
      }

      // Parse the date
      const requestedDate = new Date(date);
      if (isNaN(requestedDate)) {
        return res.badRequest({ message: 'Invalid date format. Please use ISO format (YYYY-MM-DDT00:00:00.000Z)' });
      }

      // Set the date to start of day and end of day for timestamp range
      const startDate = new Date(requestedDate);
      startDate.setHours(0, 0, 0, 0);
      const startTimestamp = startDate.getTime();
      
      const endDate = new Date(requestedDate);
      endDate.setHours(23, 59, 59, 999);
      const endTimestamp = endDate.getTime();

      // Get all appointments for the doctor on the requested date by using the timestamp
      const appointments = await Appointment.find({
        doctor: doctorId,
        appointmentTimestamp: { '>=': startTimestamp, '<=': endTimestamp },
        status: { '!=': 'cancelled' }
      });

      // Get the booked time slots
      const bookedSlots = appointments.map(appointment => appointment.time);

      // Define working hours (can be customized based on doctor's schedule)
      // For now, using standard 9 AM to 5 PM with 30-minute slots
      const workingHours = {
        start: 9, // 9 AM
        end: 17,  // 5 PM
        interval: 30 // 30 minutes per appointment
      };

      // Generate all possible time slots
      const allSlots = [];
      for (let hour = workingHours.start; hour < workingHours.end; hour++) {
        for (let minute = 0; minute < 60; minute += workingHours.interval) {
          const formattedHour = hour.toString().padStart(2, '0');
          const formattedMinute = minute.toString().padStart(2, '0');
          allSlots.push(`${formattedHour}:${formattedMinute}`);
        }
      }

      // Filter out booked slots
      const availableSlots = allSlots.filter(slot => !bookedSlots.includes(slot));

      return res.json({
        date: requestedDate.toISOString(), // Return in ISO format
        doctor: doctorId,
        availableSlots
      });
    } catch (error) {
      return res.serverError({ message: 'An error occurred', error: error.message });
    }
  }
}; 