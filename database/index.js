const db = require("./db");
const User = require("./user");
const Receipts = require("./receipts");
const Item = require("./item");
const Group = require("./groups");
const Invite = require("./invite");
const Payments = require("./payment");

// 1. Users and Receipts
User.hasMany(Receipts, { foreignKey: "User_Id" });
Receipts.belongsTo(User, { foreignKey: "User_Id" });

// 2. Receipts and Items
Receipts.hasMany(Item, { foreignKey: "Receipt_Id" });
Item.belongsTo(Receipts, { foreignKey: "Receipt_Id" });

// 3. Users and Groups (Owner)
User.hasMany(Group, { foreignKey: "Owner" });

// 4. Users and Groups (Members)
Group.belongsToMany(User, { through: "UserGroups", as: "Members" });
User.belongsToMany(Group, { through: "UserGroups", as: "Memberships" });


// 5. Group has Receipts
Group.hasMany(Receipts, { foreignKey: "Group_Id" });
Receipts.belongsTo(Group, { foreignKey: "Group_Id" });

//Keeps the group but owner is set to null, if user for some reason removed
Group.belongsTo(User, { foreignKey: "Owner", onDelete: "SET NULL" });

// 6. Invites
User.hasMany(Invite, { as: "sentInvites", foreignKey: "senderId" });
User.hasMany(Invite, { as: "receivedInvites", foreignKey: "receiverId" });

Invite.belongsTo(User, { as: "sender", foreignKey: "senderId" });
Invite.belongsTo(User, { as: "receiver", foreignKey: "receiverId" });
Invite.belongsTo(Group, { foreignKey: "GroupId" });

// 7. Payments
User.hasMany(Payments, { foreignKey: "User_Id" });
Payments.belongsTo(User, { foreignKey: "User_Id" });

Receipts.hasMany(Payments, { foreignKey: "Receipt_Id" });
Payments.belongsTo(Receipts, { foreignKey: "Receipt_Id" });

//used to track per-item splits(optional).
Item.hasMany(Payments, { foreignKey: "Item_Id" }); // optional
Payments.belongsTo(Item, { foreignKey: "Item_Id" });

Group.hasMany(Payments, { foreignKey: "Group_Id" });
Payments.belongsTo(Group, { foreignKey: "Group_Id" });

module.exports = {
  db,
  User,
  Receipts,
  Item,
  Group,
  Invite,
  Payments,
};
