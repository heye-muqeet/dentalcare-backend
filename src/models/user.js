module.exports = (sequelize, DataTypes) => {
    const User = sequelize.define("User", {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        contact: {
            type: DataTypes.STRING(20), // Matches VARCHAR(20)
            allowNull: false,
            unique:true
        },
        email: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
        },
        password: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        role: {
            type: DataTypes.ENUM("organization_admin", "branch_admin", "doctor", "receptionist"),
            allowNull: false,
        },
        isActive:{
            type:DataTypes.BOOLEAN,
            defaultValue:false
        },
    });

    return User;
};
