const { DataTypes } = require("sequelize");
const db = require("./db");

const Receipt = db.define("receipt", {

    title: {
        type: DataTypes.STRING,
        allowNull: false,
    },

    body: {
        type: DataTypes.TEXT,
        allowNull: false,
    },

    User_Id: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },

    Group_Id: {
        type: DataTypes.INTEGER,
        allowNull: true,
    }

});

module.exports = Receipt;