const { DataTypes } = require("sequelize");
const db = require("./db");

const Purchase = db.define("purchase", {
    name: {
        tyoe: DataTypes.STRING,
        allowNull: false,
    },
    price: {
        type: DataTypes.DECIMAL
    }
})

module.exports = Purchase;