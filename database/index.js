const db = require("./db");
const User = require("./user");
const Receipts = require("./recipts");
const Item = require("./item");
const Group = require("./groups");


User.hasMany(Receipts, { foreignKey: "User_Id" });
Receipts.belongsTo(User, { foreignKey: "User_Id" });

Receipts.hasMany(Item, { foreignKey: "Receipt_Id" });
Item.belongsTo(Receipts, { foreignKey: "Receipt_Id" });

User.hasMany(Group, { foreignKey: "Owner" });
Group.belongsTo(User, { foreignKey: "Owner" });

Group.belongsToMany(User, {through: "UserGroups"});
User.belongsToMany(Group, {through: "UserGroups"});

Group.hasMany(Receipts, { foreignKey: "Group_Id" });
Receipts.belongsTo(Group, { foreignKey: "Group_Id" });

module.exports = {
  db,
  User,
  Receipts,
  Item,
  Group,
};
