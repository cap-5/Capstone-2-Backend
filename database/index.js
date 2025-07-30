const db = require("./db");
const User = require("./user");
const Receipts = require("./recipts");
const Item = require("./item");
const Group = require("./groups");


User.hasMany(Receipts, { foreignKey: "User_Id" });
Receipts.belongsTo(User, { foreignKey: "User_Id" });
Receipts.hasMany(Item, { foreignKey: "Receipt_id" });
Item.belongsTo(Receipts, { foreignKey: "Receipt_id" });
Group.belongsTo(User, { foreignKey: "Owner" });
User.hasMany(Group, { foreignKey: "Owner" });
Receipts.belongsTo(Group, { foreignKey: "Group_Id" });
Group.hasMany(Receipts, { foreignKey: "Group_Id" });

module.exports = {
  db,
  User,
  Receipts,
  Item,
  Group,
};
