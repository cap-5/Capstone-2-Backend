const { DataTypes } = require("sequelize");
const db = require("./db");

const groups =
  ("groups",
  {
    owner: {
      type: DataTypes.INTEGER,
      allownull: false,
    },

    groupName: {
      type: DataTypes.TEXT,
      allownull: true,
    },

    receiptId: {
      type: DataTypes.INTEGER,
      allownull: false,
    },
  });

module.exports = groups;
