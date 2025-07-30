const db = require("./db");
const { User, Receipt, Item } = require("./index");

const seed = async () => {
  try {
    db.logging = false;
    await db.sync({ force: true }); // Drop and recreate tables

    const users = await User.bulkCreate([
      { username: "admin", passwordHash: User.hashPassword("admin123") },
      { username: "user1", passwordHash: User.hashPassword("user111") },
      { username: "user2", passwordHash: User.hashPassword("user222") },
    ]);

    console.log(`👤 Created ${users.length} users`);

    const receipts = await Receipt.bulkCreate([
      {
        title: "Grocery Shopping",
        body: "Bought fruits and vegetables",
        userId: users[0].id,
        groupId: null
      },
      {
        title: "Electronics Purchase",
        body: "Bought a new laptop",
        userId: users[1].id,
        groupId: groups[0].id
      },
    ]);

    console.log(`🧾 Created ${receipts.length} receipts`);

    const items = await Item.bulkCreate([
      { name: "Apple", price: 1.2, Receipt_id: receipts[0].id },
      { name: "Banana", price: 0.8, Receipt_id: receipts[0].id },
      { name: "Laptop", price: 1200, Receipt_id: receipts[1].id },
    ]);

    console.log(`📦 Created ${items.length} items`)
    ;
    // Create more seed data here once you've created your models
    // Seed files are a great way to test your database schema!

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
