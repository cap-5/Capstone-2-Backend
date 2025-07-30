const { DataTypes } = require("sequelize");
const db = require("./db");
// const { use } = require("react");

const Receipt = db.define("receipt", {

    title: {
        type: DataTypes.STRING,
        allowNull: false,
    },

    body: {
        type: DataTypes.TEXT,
        allowNull: false,
    },

    userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },

    groupId: {
        type: DataTypes.INTEGER,
        allowNull: true,
    }

});

exports.Receipt = Receipt;