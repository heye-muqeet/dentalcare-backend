module.exports = (sequelize, DataTypes) => {
    const Organization = sequelize.define("Organization", {
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
            type: DataTypes.TEXT, // Matches SQL definition
            allowNull: false,
        },
        contact: {
            type: DataTypes.STRING(20), // Matches VARCHAR(20)
            allowNull: true,
        },
        deletedAt:{
            type:DataTypes.BIGINT,
            defaultValue:0,
        },
        ownerId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: "Users", // Ensure it matches the table name in DB
                key: "id",
            },
            onDelete: "CASCADE",
        },
    });

    return Organization;
}