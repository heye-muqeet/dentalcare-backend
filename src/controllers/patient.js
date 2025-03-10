const { where } = require("sequelize");
const { Patient } = require("../models/index"); // Import models

const addPatient = async (req, res) => {
    try {
        const {name,address,} = req.body;
        console.log(req.body);
        const patient = await Patient.create({...req.body,addedBy:req.user.id,branchId:req.user.branchId});
        res.status(201).json({ message: "Patient added successfully", patient });
    } catch (error) {
        console.error("Error adding patient:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

const getPatients = async (req, res) => {
    try {
        const patients = await Patient.findAll({where:{branchId:req.user.branchId}});

        res.status(200).json(patients); // Use json() for structured response
    } catch (error) {
        console.error("Error fetching users:", error);
        res.status(500).json({ error: "Internal Server Error" }); // Corrected error response
    }
};



module.exports = { addPatient,getPatients }