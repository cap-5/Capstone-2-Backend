const db = require("./db");
const { User, Item, Receipts, Group } = require("./index");

const seed = async () => {
  try {
    db.logging = false;
    await db.sync({ force: true }); // Drop and recreate tables

    const users = await User.bulkCreate([
      {
        username: "admin",
        passwordHash: User.hashPassword("admin123"),
        firstName: "Alice",
        lastName: "Admin",
        email: "admin@example.com",
        profilePic: "https://i.pravatar.cc/150?img=1",
      },
      {
        username: "user1",
        passwordHash: User.hashPassword("user111"),
        firstName: "Bob",
        lastName: "Builder",
        email: "bob@example.com",
        profilePic: "https://i.pravatar.cc/150?img=1",
      },
      {
        username: "user2",
        passwordHash: User.hashPassword("user222"),
        firstName: "Carol",
        lastName: "Coder",
        email: "carol@example.com",
        profilePic: "https://i.pravatar.cc/150?img=1",
      },
      {
        username: "user3",
        passwordHash: User.hashPassword("user333"),
        firstName: "Mike",
        lastName: "Snake",
        email: "Snake@example.com",
        profilePic: "https://i.pravatar.cc/150?img=1",
      },
    ]);

    console.log(`👤 Created ${users.length} users`);

    const groups = await Group.bulkCreate([
      {
        Owner: users[0].id,
        groupName: "Family",
        description: "Family group for shared expenses",
      },
      {
        Owner: users[1].id,
        groupName: "Friends",
        description: "Friends group for outings",
      },
    ]);

    console.log(`👥 Created ${groups.length} groups`);

    const receipts = await Receipts.bulkCreate([
      {
        title: "Grocery Shopping",
        body: "Bought fruits and vegetables",
        User_Id: users[0].id,
        Group_Id: groups[0].id,
      },
      {
        title: "Electronics Purchase",
        body: "Bought a new laptop",
        User_Id: users[1].id,
        Group_Id: groups[1].id,
      },
      {
        title: "Testing Assign-Items",
        body: "testing",
        User_Id: users[0].id,
        Group_Id: groups[0].id,
      },
    ]);

    console.log(`🧾 Created ${receipts.length} receipts`);

    const items = await Item.bulkCreate([
      { name: "Apple", price: 1.2, Receipt_Id: receipts[0].id },
      { name: "Banana", price: 0.8, Receipt_Id: receipts[0].id },

      { name: "Laptop", price: 1200, Receipt_Id: receipts[1].id },

      { name: "Apples", price: 6.0, Receipt_Id: receipts[2].id },
      { name: "Bananas", price: 6.0, Receipt_Id: receipts[2].id },
      { name: "Candy", price: 6.0, Receipt_Id: receipts[2].id },
    ]);

    console.log(`📦 Created ${items.length} items`);

    console.log("🌱 Seeded the database");
  } catch (error) {
    console.error("Error seeding database:", error);
    if (error.message.includes("does not exist")) {
      console.log("\n🤔🤔🤔 Have you created your database??? 🤔🤔🤔");
    }
  }
  db.close();
};

seed();
