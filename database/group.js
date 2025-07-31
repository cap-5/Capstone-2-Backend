const { DataTypes } = require("sequelize");
const db = require("./db");

const Group = db.define("group", {
    name: {
        name: DataTypes.STRING,
        allowNull: false,
    },
});

module.exports = Group;