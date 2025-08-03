const { DataTypes } = require("sequelize");
const db = require("./db");

const Group = db.define("groups", {
  Owner: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },

  // maybe something we can use?
    description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },

  groupName: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  
  Receipt_Id: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
});

module.exports = Group;
