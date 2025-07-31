const { DataTypes } = require("sequelize");
const db = require("./db");

const Group = db.define
  ("groups",
  {
    Owner: {
      type: DataTypes.INTEGER,
      allownull: false,
    },

    groupName: {
      type: DataTypes.TEXT,
      allownull: true,
    },

    Receipt_Id: {
      type: DataTypes.INTEGER,
      allownull: false,
    },
  });

module.exports = Group;
