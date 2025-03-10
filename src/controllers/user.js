const { User } = require("../models/index"); // Import models
const bcrypt = require('bcrypt');
const crypto = require("crypto");



const addUser = async (req, res) => {
    try {
        const { name, email, contact,role } = req.body;

        const allowedRoles = ["branch_admin", "doctor", "receptionist"];
        if (!allowedRoles.includes(role)) {
            return res.status(400).json({ error: "Invalid role specified" });
        }

        const generatedPassword = crypto.randomBytes(4).toString("hex"); // Example: "a3f8d2e1"
        const hashedPassword = await bcrypt.hash(generatedPassword, 10);

        const user = await User.create({ name, email,role, contact, password: hashedPassword,branchId:req.user.branchId });

        res.status(201).json({
            message: "User created successfully",
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
            },
            password: generatedPassword,
        });
    } catch (error) {
        console.error("Error creating user:", error);
        res.status(500).json({ error: "Internal Server Error" }); // ✅ Corrected response
    }
};

const getUsers = async (req, res) => {
    try {
        console.log("Fetching users with posts...");

        const users = await User.findAll();

        res.status(200).json(users); // Use json() for structured response
    } catch (error) {
        console.error("Error fetching users:", error);
        res.status(500).json({ error: "Internal Server Error" }); // Corrected error response
    }
};



module.exports = { addUser, getUsers }