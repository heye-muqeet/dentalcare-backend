module.exports = (sequelize, DataTypes) => {
    const Patient = sequelize.define("Patient", {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        address: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        medicalHistory: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        contact: {
            type: DataTypes.STRING(20), // Matches VARCHAR(20)
            allowNull: true,
        },
        identityNo: {
            type: DataTypes.STRING(20), // Matches VARCHAR(20)
            allowNull: true,
            unique:true
        },
        allergies: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        patientType: {
            type: DataTypes.ENUM('walk-in', 'appointed'),
            defaultValue: 'walk-in',
        },
        addedBy: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
                model: "Users",
                key: "id",
            },
            onDelete: "CASCADE",
        },
        email: {
            type: DataTypes.STRING(50), // Matches VARCHAR(20)
            allowNull: true,
        },
        deletedAt:{
            type:DataTypes.BIGINT,
            defaultValue:0,
        },
    });

    return Patient;
}