module.exports = (sequelize, DataTypes) => {
    const Appointment = sequelize.define("Appointment", {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        type: {
            type: DataTypes.ENUM('walk-in', 'scheduled'),
            defaultValue: 'walk-in',
        },
        doctorId: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
                model: "Users",
                key: "id",
            },
        },
        receptionistId: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
                model: "Users",
                key: "id",
            },
        },
        patientId: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
                model: "Patients",
                key: "id",
            },
        },
        branchId: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
                model: "Branches",
                key: "id",
            },
        },
        appointment_date: {
            type: DataTypes.DATEONLY, // Stores only the date (YYYY-MM-DD)
            allowNull: false,
            defaultValue: DataTypes.NOW, // Default to the current date
        },
    });

    return Appointment;
}