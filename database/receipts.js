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

  // Defines foreign key constraint linking this column to the primary key
  uploaded_by: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: "users",
      key: "id",
    },
  },

   category: {
    type: DataTypes.STRING,
    allowNull: true,
   },

});

module.exports = Receipts;
