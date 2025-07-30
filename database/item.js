const { DataTypes } = require("sequelize");
const db = require("./db");
const { Receipt } = require("./recipts");

const Item = db.define("item", {

    name: {
        type: DataTypes.STRING,
        allowNull: false,
    },

    price: {
        type: DataTypes.FLOAT,
        allowNull: false,
    },

    Receipt_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
    }
    
});


module.exports = Item;