const db = require("./db");
const User = require("./user");
const Receipts = require("./receipts")
const Item = require("./item");
const Group = require("./groups");

// 1. Users and Receipts
User.hasMany(Receipts, { foreignKey: "User_Id" });
Receipts.belongsTo(User, { foreignKey: "User_Id" });

// 2. Receipts and Items
Receipts.hasMany(Item, { foreignKey: "Receipt_Id" });
Item.belongsTo(Receipts, { foreignKey: "Receipt_Id" });

// 3. Users and Groups (Owner)
User.hasMany(Group, { foreignKey: "Owner" });

// 4. Users and Groups (Members)
Group.belongsToMany(User, { through: "UserGroups" });
User.belongsToMany(Group, { through: "UserGroups" });

// 5. Group has Receipts
Group.hasMany(Receipts, { foreignKey: "Group_Id" });
Receipts.belongsTo(Group, { foreignKey: "Group_Id" });

//Keeps the group but owner is set to null, is user for some reason removed
Group.belongsTo(User, { foreignKey: "Owner", onDelete: "SET NULL" });

module.exports = {
  db,
  User,
  Receipts,
  Item,
  Group,
};
