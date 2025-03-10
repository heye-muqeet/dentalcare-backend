// require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");

const { sequelize } = require("./src/models"); // Import models

const userRouter = require("./src/routes/user");
const authRouter = require("./src/routes/auth");
const patientRouter = require("./src/routes/patient");
const appointmentRouter = require("./src/routes/appointment");
// const postRouter = require("./src/routes/post");

const PORT = 9000;
const app = express();

// Middlewares
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Routes
app.use("/api/users", userRouter);
app.use("/api/auth", authRouter);
app.use("/api/patients", patientRouter);
app.use("/api/appointments", appointmentRouter);
// app.use("/api/posts", postRouter);

// Sync Database
sequelize
  .sync({ force: false }) // `force: true` will DROP tables and re-create them
  .then(() => {
    console.log("Database synced successfully.");
    app.listen(PORT, () => {
      console.log(`Server listening on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error("Error syncing database:", error);
  });

// const { User, Organization,Branch } = require("./src/models/index");
// const bcrypt = require('bcrypt');

// // Create a new User (Owner)
// const createOrg = async () => {
//   const hashedPassword = await bcrypt.hash("a3f8d2e1", 10);
//   const user = await User.create({ name: "John Doe", email: "john@example.com", password: hashedPassword, role: "organization_admin",contact:"03121289669" });
//   const org = await Organization.create({ name: "HealthCare Inc.",address:"korangi karachi", ownerId: user.id });
//   const branch = await Branch.create({ name: "Main Branch",address:"korangi karachi", organizationId: org.id,managerId: user.id});
//   console.log("Organization Created:", branch);
// };

// createOrg();

// f0e77e2b recep abdul@gmail.com
