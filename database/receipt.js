const {DataTypes} = require("sequelize");
const db = require("./db");

const Receipt = db.define("receipt", {
    title: {
        type: DataTypes.STRING,
        allowNull: false
    },
    body: {
        type: DataTypes.TEXT,
    },
});

module.exports = Receipt;