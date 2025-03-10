const { Appointment } = require("../models/index"); // Import models

const addAppointment = async (req, res) => {
    try {
        const { doctorId, patientId, } = req.body;

        // Create a new appointment
        const newAppointment = await Appointment.create({
            doctorId,
            receptionistId:req.user.id,
            patientId,
            branchId:req.user.branchId, // Use provided date or default to current date
        });

        // Return success response
        res.status(201).json({
            success: true,
            message: "Appointment created successfully",
            data: newAppointment,
        });
    } catch (error) {
        console.error("Error creating appointment:", error);
        res.status(500).json({
            success: false,
            message: "Failed to create appointment",
            error: error.message,
        });
    }
};

const getAppointments = async (req, res) => {
    try {

        const appointments = await Appointment.findAll();

        res.status(200).json(appointments); // Use json() for structured response
    } catch (error) {
        console.error("Error fetching users:", error);
        res.status(500).json({ error: "Internal Server Error" }); // Corrected error response
    }
};

module.exports = {addAppointment,getAppointments}