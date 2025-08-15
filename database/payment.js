const { DataTypes } = require("sequelize");
const db = require("./db");

const Payments = db.define("payments", {
  User_Id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: "The user who needs to pay",
  },

  Receipt_Id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: "The receipt this payment is associated with",
  },

  Item_Id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: "Optional item-level payment (if split by item)",
  },

  Group_Id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: "The group associated with the payment",
  },

  requesterId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: "The user who sent the request",
  },

  paypalOrderId: {
    type: DataTypes.STRING,
    allowNull: true,
  },

  amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },

  status: {
    type: DataTypes.ENUM("pending", "partial", "paid"),
    allowNull: false,
    defaultValue: "pending",
  },
});

module.exports = Payments;
