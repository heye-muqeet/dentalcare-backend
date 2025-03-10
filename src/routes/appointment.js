const express = require("express");
const authenticate = require("../middleware/auth");
const { addAppointment, getAppointments } = require("../controllers/appointment");

const router = express.Router();

router.route("/").post(authenticate,addAppointment)
router.route("/").get(authenticate,getAppointments)

module.exports = router;