const express = require("express");
const authenticate = require("../middleware/auth");
const { addPatient, getPatients } = require("../controllers/patient");

const router = express.Router();

router.route("/").post(authenticate,addPatient)
router.route("/").get(authenticate,getPatients)

module.exports = router;