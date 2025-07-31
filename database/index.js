const db = require("./db");
const User = require("./user");
const Group = require("./group");
const Receipt = require("./receipt");
const Purchase = require("./purchase")

// Many-to-many association between Users and Groups
User.belongsToMany(Group, {through: "User_Groups"});
Group.belongsToMany(User, {through: "User_Groups"});
// A User can have many Receipts, each Receipt belongs to a User
User.hasMany(Receipt);
Receipt.belongsTo(User);
// A Group can have many Receipts, each Receipt belongs to at most 1 Group
Group.hasMany(Receipt);
Receipt.belongsTo(Group);
// A Receipt has many Purchases, each Purchase belongs to a Receipt
Receipt.hasMany(Purchase);
Purchase.belongsTo(Receipt);

module.exports = {
  db,
  User,
  Group,
  Receipt,
  Purchase,
};
