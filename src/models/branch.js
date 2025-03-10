module.exports = (sequelize, DataTypes) => {
    const Branch = sequelize.define("Branch", {
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
            allowNull: false,
        },
        contact: {
            type: DataTypes.STRING(20), // Matches VARCHAR(20)
            allowNull: true,
        },
        status: {
            type: DataTypes.ENUM('active', 'inactive'),
            defaultValue: 'active',
        },
        deletedAt:{
            type:DataTypes.BIGINT,
            defaultValue:0,
        },
    });

    return Branch;
}