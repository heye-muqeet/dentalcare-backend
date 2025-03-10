const sequelize = require("../config/db.config");
const { DataTypes } = require("sequelize");

// Import Models
const User = require("./user")(sequelize, DataTypes);
const Organization = require("./organization")(sequelize, DataTypes);
const Branch = require("./branch")(sequelize, DataTypes);
const Patient = require("./patient")(sequelize, DataTypes);
const Appointment = require("./appointment")(sequelize, DataTypes);

// ===========================
// Define Relationships
// ===========================

// Organization & Branch Relationship
Organization.hasMany(Branch, {foreignKey: "organizationId",as: "branches",});
Branch.belongsTo(Organization, {foreignKey: "organizationId",as: "organization",});

// Organization & Owner (User) Relationship
User.hasOne(Organization, {foreignKey: "ownerId",as: "ownedOrganization",});
Organization.belongsTo(User, {foreignKey: "ownerId",as: "owner",});

// Branch & Manager (User) Relationship
User.hasOne(Branch, {foreignKey: "managerId",as: "managedBranch",});
Branch.belongsTo(User, {foreignKey: "managerId",as: "manager",});

// Branch & Employees (Users) Relationship
Branch.hasMany(User, {foreignKey: "branchId",as: "employees",});
User.belongsTo(Branch, {foreignKey: "branchId",as: "branch",});

Branch.hasMany(Patient,{foreignKey:"branchId",as:"patients"})
Patient.belongsTo(Branch,{foreignKey:"branchId",as:"branch"})

// ===========================
// Export Models
// ===========================
module.exports = {
    sequelize,
    User,
    Organization,
    Branch,
    Patient,
    Appointment
};
