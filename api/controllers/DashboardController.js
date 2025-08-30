module.exports = {
    /**
     * `DashboardController.getDashboardData()`
     * Get dashboard data based on user role
     */
    getDashboardData: async function (req, res) {
        try {
            const userRole = req.user.role;
            const userId = req.user.id;
            const userLocation = req.user.location;
            const userOrganization = req.user.organization;

            // Calculate date ranges
            const now = new Date();
            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            const todayStart = today.getTime();
            const todayEnd = new Date(today).setHours(23, 59, 59, 999);

            const yesterday = new Date(today);
            yesterday.setDate(yesterday.getDate() - 1);
            const yesterdayStart = yesterday.getTime();
            const yesterdayEnd = new Date(yesterday).setHours(23, 59, 59, 999);

            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
            const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).getTime();
            const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0).setHours(23, 59, 59, 999);

            // Base criteria for user's organization/location
            const baseCriteria = {
                organization: userOrganization,
                location: userLocation
            };

            let dashboardData = {};

            if (userRole === 'owner' || userRole === 'receptionist') {
                // Owner Dashboard Data
                const [
                    todayAppointments,
                    totalPatients,
                    totalPaidInvoices,
                    monthlyTreatments,
                    pendingAppointments,
                    totalExpenses
                ] = await Promise.all([
                    // Today's appointments
                    Appointment.count({
                        ...baseCriteria,
                        appointmentTimestamp: { '>=': todayStart, '<=': todayEnd },
                        status: { '!=': 'cancelled' }
                    }),
                    
                    // Total patients
                    Patient.count({
                        ...baseCriteria,
                        deletedAt: 0
                    }),
                    
                    // Total revenue (from ALL paid invoices)
                    Invoice.sum('total', {
                        ...baseCriteria,
                        status: 'paid'
                    }),
                    
                    // Monthly treatments
                    Treatment.count({
                        ...baseCriteria,
                        createdAt: { '>=': startOfMonth }
                    }),
                    
                    // Pending appointments
                    Appointment.count({
                        ...baseCriteria,
                        status: 'pending'
                    }),
                    
                    // Total expenses (ALL expenses)
                    Expense.sum('amount', {
                        ...baseCriteria,
                        deletedAt: 0
                    })
                ]);

                // Calculate outstanding balance
                const outstandingBalance = await Patient.sum('balance', {
                    ...baseCriteria,
                    deletedAt: 0
                });

                // Calculate net revenue (total paid invoices - total expenses)
                const revenue = (totalPaidInvoices || 0) - (totalExpenses || 0);

                dashboardData = {
                    role: userRole,
                    todayAppointments,
                    totalPatients,
                    revenue,
                    monthlyTreatments,
                    pendingAppointments,
                    outstandingBalance: outstandingBalance || 0,
                    totalPaidInvoices: totalPaidInvoices || 0,
                    totalExpenses: totalExpenses || 0
                };

            } else if (userRole === 'doctor') {
                // Doctor Dashboard Data - only their own data
                const doctorCriteria = { ...baseCriteria, doctor: userId };

                const [
                    todayAppointments,
                    yesterdayAppointments,
                    totalPatients,
                    lastMonthPatients,
                    monthlyTreatments,
                    totalTreatments,
                    successfulTreatments
                ] = await Promise.all([
                    // Today's appointments
                    Appointment.count({
                        ...baseCriteria,
                        doctor: userId,
                        appointmentTimestamp: { '>=': todayStart, '<=': todayEnd },
                        status: { '!=': 'cancelled' }
                    }),
                    
                    // Yesterday's appointments (for comparison)
                    Appointment.count({
                        ...baseCriteria,
                        doctor: userId,
                        appointmentTimestamp: { '>=': yesterdayStart, '<=': yesterdayEnd },
                        status: { '!=': 'cancelled' }
                    }),
                    
                    // Total patients treated by this doctor
                    Treatment.count({
                        ...doctorCriteria
                    }),
                    
                    // Last month's patients (for comparison)
                    Treatment.count({
                        ...doctorCriteria,
                        createdAt: { '>=': startOfLastMonth, '<=': endOfLastMonth }
                    }),
                    
                    // Monthly treatments
                    Treatment.count({
                        ...doctorCriteria,
                        createdAt: { '>=': startOfMonth }
                    }),
                    
                    // Total treatments by doctor
                    Treatment.count(doctorCriteria),
                    
                    // Successful treatments (completed appointments)
                    Appointment.count({
                        ...baseCriteria,
                        doctor: userId,
                        status: 'completed'
                    })
                ]);

                // Calculate percentages
                const appointmentChange = yesterdayAppointments > 0 
                    ? Math.round(((todayAppointments - yesterdayAppointments) / yesterdayAppointments) * 100)
                    : todayAppointments > 0 ? 100 : 0;

                const patientGrowth = lastMonthPatients > 0
                    ? Math.round(((totalPatients - lastMonthPatients) / lastMonthPatients) * 100)
                    : totalPatients > 0 ? 100 : 0;

                const successRate = totalTreatments > 0
                    ? Math.round((successfulTreatments / totalTreatments) * 100)
                    : 0;

                dashboardData = {
                    role: 'doctor',
                    todayAppointments,
                    totalPatients,
                    monthlyTreatments,
                    totalTreatments,
                    successfulTreatments,
                    successRate,
                    appointmentChange,
                    patientGrowth
                };

            } 
            // else if (userRole === 'receptionist') {
            //     // Receptionist Dashboard Data - focus on appointments and patients
            //     const [
            //         todayAppointments,
            //         pendingAppointments,
            //         totalPatients,
            //         monthlyAppointments,
            //         cancelledAppointments,
            //         upcomingAppointments
            //     ] = await Promise.all([
            //         // Today's appointments
            //         Appointment.count({
            //             ...baseCriteria,
            //             appointmentTimestamp: { '>=': todayStart, '<=': todayEnd },
            //             status: { '!=': 'cancelled' }
            //         }),
                    
            //         // Pending appointments
            //         Appointment.count({
            //             ...baseCriteria,
            //             status: 'pending'
            //         }),
                    
            //         // Total patients
            //         Patient.count({
            //             ...baseCriteria,
            //             deletedAt: 0
            //         }),
                    
            //         // Monthly appointments
            //         Appointment.count({
            //             ...baseCriteria,
            //             createdAt: { '>=': startOfMonth }
            //         }),
                    
            //         // Cancelled appointments this month
            //         Appointment.count({
            //             ...baseCriteria,
            //             status: 'cancelled',
            //             createdAt: { '>=': startOfMonth }
            //         }),
                    
            //         // Upcoming appointments (next 7 days)
            //         Appointment.count({
            //             ...baseCriteria,
            //             appointmentTimestamp: { 
            //                 '>=': todayStart, 
            //                 '<=': new Date(today.getTime() + (7 * 24 * 60 * 60 * 1000))
            //             },
            //             status: { '!=': 'cancelled' }
            //         })
            //     ]);

            //     dashboardData = {
            //         role: 'receptionist',
            //         widgets: {
            //             appointments: {
            //                 value: todayAppointments,
            //                 label: 'Today',
            //                 subtitle: 'Scheduled for today',
            //                 icon: 'calendar'
            //             },
            //             patients: {
            //                 value: totalPatients,
            //                 label: 'Total',
            //                 subtitle: 'Registered patients',
            //                 icon: 'users'
            //             },
            //             pending: {
            //                 value: pendingAppointments,
            //                 label: 'Pending',
            //                 subtitle: 'Awaiting confirmation',
            //                 icon: 'clock'
            //             },
            //             upcoming: {
            //                 value: upcomingAppointments,
            //                 label: 'Next 7 Days',
            //                 subtitle: 'Upcoming appointments',
            //                 icon: 'calendar-check'
            //             }
            //         },
            //         stats: {
            //             monthlyAppointments,
            //             cancelledAppointments,
            //             cancellationRate: monthlyAppointments > 0 
            //                 ? Math.round((cancelledAppointments / monthlyAppointments) * 100)
            //                 : 0
            //         }
            //     };
            // }

            return res.json({
                status: 'success',
                data: dashboardData
            });

        } catch (err) {
            sails.log.error('Error fetching dashboard data:', err);
            return res.status(500).json({
                status: 'error',
                error: sails.config.responses.GENERIC.SERVER_ERROR
            });
        }
    }
}; 