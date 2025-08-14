const { DataTypes } = require("sequelize");
const db = require("./db");

const Payments = db.define("payments", {
    
  User_Id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },

  Receipt_Id: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },

  Item_Id: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },

  Group_Id: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },

  paypalOrderId: {
    type: DataTypes.STRING,
    allowNull: true,
  },

  amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true, // stores total paid
  },

  status: {
    type: DataTypes.ENUM("pending", "completed"),
    allowNull: true,
  },
});

module.exports = Payments;
