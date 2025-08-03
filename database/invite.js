const { DataTypes } = require("sequelize");
const db = require("./db");

const Invite = db.define("invite", {
  senderId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },

  receiverId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },

  GroupId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },

  status: {
    type: DataTypes.ENUM("pending", "accepted", "declined"),
    defaultValue: "pending",
    allowNull: false,
  },
});

module.exports = Invite;
