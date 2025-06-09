module.exports = {
    /**
     * `TreatmentController.create()`
     * Creates a new treatment and automatically generates an invoice
     */
    create: async function (req, res) {
        try {
            const {
                appointment,
                patient,
                diagnosis,
                prescribedMedications,
                notes,
                servicesUsed,
                followUpRecommended,
                followUpDate,
                followUpTime,
                reports,
            } = req.body;

            // Validate required fields
            if (!appointment || !patient || !diagnosis) {
                return res.status(400).json({
                    status: 'error',
                    error: sails.config.responses.AUTH.REQUIRED_FIELDS_MISSING
                });
            }

            // Verify appointment exists and belongs to user's location
            const appointmentRecord = await Appointment.findOne({
                id: appointment,
                location: req.user.location,
            });

            if (appointmentRecord.doctor !== req.user.id) {
                return res.status(403).json({
                    status: 'error',
                    error: 'You are not authorized to create a treatment for this appointment'
                });
            }

            //   if (!appointmentRecord) {
            //     return res.status(404).json({
            //       status: 'error',
            //       error: 'Appointment not found'
            //     });
            //   }

            //   // Verify patient exists and belongs to user's location
            //   const patientRecord = await Patient.findOne({
            //     id: patient,
            //     location: req.user.location,
            //     organization: req.user.organization
            //   });

            //   if (!patientRecord) {
            //     return res.status(404).json({
            //       status: 'error',
            //       error: 'Patient not found'
            //     });
            //   }

            // Calculate total from services and appointment fee
            let subtotal = appointmentRecord.fee || 0; // Start with appointment fee
            let serviceTotal = 0;

            if (servicesUsed && Array.isArray(servicesUsed)) {
                for (const serviceItem of servicesUsed) {
                    if (serviceItem.id && serviceItem.price) {
                        // // Verify service exists and belongs to user's location
                        // const service = await Service.findOne({
                        //   id: serviceItem.serviceId,
                        //   location: req.user.location,
                        //   deletedAt: 0
                        // });

                        // if (service) {
                        serviceTotal += serviceItem.price;
                        // }
                    }
                }
            }

            subtotal += serviceTotal;

            // Create treatment record
            const newTreatment = await Treatment.create({
                appointment,
                doctor: req.user.id,
                patient,
                diagnosis,
                prescribedMedications: prescribedMedications || [],
                notes: notes || '',
                servicesUsed: servicesUsed || [],
                followUpRecommended: followUpRecommended || false,
                followUpDate: followUpDate || '',
                followUpTime: followUpTime || '',
                reports: reports || [],
                organization: req.user.organization,
                location: req.user.location,
            }).fetch();

            // Calculate tax (assuming 10% tax rate)
            const taxRate = 0.10;
            const tax = subtotal * taxRate;
            const total = subtotal + tax;

            // Create invoice
            const dueDate = new Date();
            dueDate.setDate(dueDate.getDate() + 10); // 30 days from now

            // Generate invoice number
            const date = new Date();
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const count = await Invoice.count();
            const invoiceNum = `INV-${year}${month}-${String(count + 1).padStart(4, '0')}`;

            const invoice = await Invoice.create({
                invoiceNumber: invoiceNum,
                date: new Date(),
                dueDate: dueDate,
                subtotal: subtotal,
                tax: tax,
                total: total,
                status: 'due',
                patient: patient,
                services: servicesUsed,
                treatment: newTreatment.id,
                organization: req.user.organization,
                location: req.user.location,
            }).fetch();

            // Update treatment with invoice reference
            await Treatment.updateOne({ id: newTreatment.id }).set({
                invoice: invoice.id
            });

            // Update patient balance by adding the invoice total
            await Patient.updateOne({ id: patient }).set({
                balance: (await Patient.findOne({ id: patient })).balance + total
            });
            

            // Update appointment status to completed
            await Appointment.updateOne({ id: appointment }).set({
                status: 'completed'
            });

            return res.status(201).json({
                status: 'success',
                message: 'Treatment created successfully',
                data: newTreatment
            });

        } catch (err) {
            sails.log.error('Error creating treatment:', err);
            return res.status(500).json({
                status: 'error',
                error: sails.config.responses.GENERIC.SERVER_ERROR
            });
        }
    },

    /**
     * `TreatmentController.find()`
     * Get all treatments for the current user's location
     */
    find: async function (req, res) {
        try {
            if (!req.user || !req.user.location) {
                return res.status(400).json({
                    status: 'error',
                    error: 'User location is not available'
                });
            }

            const findCriteria = {
                location: req.user.location,
                organization: req.user.organization,
            };

            // If user is a doctor, only show their treatments
            if (req.user.role === 'doctor') {
                findCriteria.doctor = req.user.id;
            }

            const treatments = await Treatment.find(findCriteria)
                .populate('appointment')
                .populate('patient')
                .populate('doctor')
                .populate('invoice');

            return res.json({
                status: 'success',
                data: treatments
            });

        } catch (err) {
            sails.log.error('Error fetching treatments:', err);
            return res.status(500).json({
                status: 'error',
                error: sails.config.responses.GENERIC.SERVER_ERROR
            });
        }
    },

    /**
     * `TreatmentController.findOne()`
     * Get a specific treatment
     */
    findOne: async function (req, res) {
        try {
            const { id } = req.params; // appointment id

            if (!req.user || !req.user.location) {
                return res.status(400).json({
                    status: 'error',
                    error: 'User location is not available'
                });
            }

            const findCriteria = {
                appointment: id,
                location: req.user.location,
                organization: req.user.organization,
            };


            const treatment = await Treatment.findOne(findCriteria)
                .populate('appointment')
                .populate('patient')
                .populate('doctor')
                .populate('invoice');

            if (!treatment) {
                return res.status(404).json({
                    status: 'error',
                    error: sails.config.responses.GENERIC.NOT_FOUND
                });
            }

            return res.json({
                status: 'success',
                data: treatment
            });

        } catch (err) {
            sails.log.error('Error fetching treatment:', err);
            return res.status(500).json({
                status: 'error',
                error: sails.config.responses.GENERIC.SERVER_ERROR
            });
        }
    },

    /**
     * `TreatmentController.update()`
     * Update an existing treatment
     */
    update: async function (req, res) {
        try {
            const { id } = req.params;
            const {
                diagnosis,
                prescribedMedications,
                notes,
                servicesUsed,
                followUpRecommended,
                followUpDate,
                followUpTime,
            } = req.body;

            if (!req.user || !req.user.location) {
                return res.status(400).json({
                    status: 'error',
                    error: 'User location is not available'
                });
            }

            const findCriteria = {
                id,
                location: req.user.location,
                organization: req.user.organization,
            };

            // If user is a doctor, only allow updating their treatments
            if (req.user.role === 'doctor') {
                findCriteria.doctor = req.user.id;
            }

            const treatment = await Treatment.findOne(findCriteria);

            if (!treatment) {
                return res.status(404).json({
                    status: 'error',
                    error: sails.config.responses.GENERIC.NOT_FOUND
                });
            }

            // Update treatment
            const updatedTreatment = await Treatment.updateOne({ id })
                .set({
                    diagnosis: diagnosis || treatment.diagnosis,
                    prescribedMedications: prescribedMedications || treatment.prescribedMedications,
                    notes: notes || treatment.notes,
                    servicesUsed: servicesUsed || treatment.servicesUsed,
                    followUpRecommended: followUpRecommended !== undefined ? followUpRecommended : treatment.followUpRecommended,
                    followUpDate: followUpDate || treatment.followUpDate,
                    followUpTime: followUpTime || treatment.followUpTime,
                });

            // If services were updated, recalculate invoice
            if (servicesUsed && treatment.invoice) {
                const appointment = await Appointment.findOne({ id: treatment.appointment });
                let subtotal = appointment.fee || 0;
                let serviceTotal = 0;

                if (Array.isArray(servicesUsed)) {
                    for (const serviceItem of servicesUsed) {
                        if (serviceItem.serviceId && serviceItem.price) {
                            const service = await Service.findOne({
                                id: serviceItem.serviceId,
                                location: req.user.location,
                                deletedAt: 0
                            });

                            if (service) {
                                serviceTotal += serviceItem.price;
                            }
                        }
                    }
                }

                subtotal += serviceTotal;
                const taxRate = 0.10;
                const tax = subtotal * taxRate;
                const total = subtotal + tax;

                // Update invoice
                await Invoice.updateOne({ id: treatment.invoice }).set({
                    subtotal: subtotal,
                    tax: tax,
                    total: total,
                });
            }

            return res.json({
                status: 'success',
                message: 'Treatment updated successfully',
                data: updatedTreatment
            });

        } catch (err) {
            sails.log.error('Error updating treatment:', err);
            return res.status(500).json({
                status: 'error',
                error: sails.config.responses.GENERIC.SERVER_ERROR
            });
        }
    }
}; 