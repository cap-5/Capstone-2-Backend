const { DataTypes } = require("sequelize");
const db = require("./db");

const Receipts = db.define("receipts", {
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
  },

  category: {
    type: DataTypes.STRING,
    allowNull: true,
  },

  totalPay: {
    type: DataTypes.DECIMAL,
    allowNull: true,
  },

  //Paypal columns
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

module.exports = Receipts;
