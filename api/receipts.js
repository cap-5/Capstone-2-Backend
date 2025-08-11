const express = require("express");
const router = express.Router();
const { authenticateJWT } = require("../auth");
const { Receipts, Item, Group } = require("../database");

// GET all receipts
router.get("/", async (req, res) => {
  try {
    const receipts = await Receipts.findAll();
    res.status(200).send(receipts);
  } catch (error) {
    console.error("Error fetching receipts:", error);
    res.status(500).send("Failed to fetch receipts.");
  }
});

// GET a specific receipt by id
router.get("/:id", async (req, res) => {
  try {
    const receiptId = Number(req.params.id);
    const receipt = await Receipts.findByPk(receiptId);
    if (!receipt) {
      res.status(400).send("Receipt not found");
    }
    res.status(200).send(receipt);
  } catch (error) {
    console.error("Error fetching receipt by ID:", error);
    res.status(500).send("Failed to find the receipt you were looking for.");
  }
});

// GET all items associated with a receipt
router.get("/:id/items", async (req, res) => {
  try {
    const receiptId = Number(req.params.id);
    const receipt = await Receipts.findByPk(receiptId);
    if (!receipt) {
      res.status(400).send("Receipt not found");
    }
    const items = await receipt.getItems();
    res.status(200).send(items);
  } catch (error) {
    console.error("Error fetching items by receipt ID:", error);
    res.status(500).send("Failed to find the items you were looking for.");
  }
});

/* POST a receipt and its items, assuming that the request includes:
- receipt: Object
{
    title: string,
    body: string,
    User_Id: int
    Group_Id: int
}
- items: Array of Objects 
[
    {name: string, price: float}, ...
]
*/

//update this where it belongs to user, group ↓
// router.post("/", authenticateJWT, async (req, res) => {
//   try {
//     const { receipt, items } = req.body;

//     console.log("Items received from frontend:", items);

//     const userId = req.user ? req.user.id : null;

//     const newReceipt = await Receipts.create({
//       ...receipt,
//       User_Id: userId,
//       uploaded_by: userId,
//     });

//     const newReceiptId = newReceipt.id;

//     for (let i = 0; i < items.length; i++) {
//       const item = items[i];
//       item.Receipt_id = newReceiptId;
//       await newReceipt.createItem(item);
//     }

//     res.status(200).send(newReceipt);
//   } catch (error) {
//     console.error("Error posting receipt:", error);
//     res.status(500).send("Failed to post receipt.");
//   }
// });

// DELETE a receipt
router.delete("/:id", authenticateJWT, async (req, res) => {
  try {
    const userId = req.user?.id;
    const receiptId = Number(req.params.id);
    const receipt = await Receipts.findByPk(receiptId);

    if (!receipt) {
      return res.status(404).send("Receipt not found");
    }

    if (receipt.UploadedBy !== userId) {
      return res.status(403).send("Not authorized to delete this receipt");
    }

    await receipt.destroy();
    res.status(200).send("Receipt deleted");
  } catch (error) {
    console.error("Error deleting receipt:", error);
    res.status(500).send("Failed to delete receipt.");
  }
});

//(HERE NEW POST)
//upload a receipt
router.post("/:id/Upload", authenticateJWT, async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const groupId = Number(req.params.id);
    if (!groupId) {
      return res.status(400).json({ error: "Group ID is required" });
    }

    const group = await Group.findByPk(groupId);
    if (!group) {
      return res.status(404).json({ error: "Group does not exist" });
    }

    const { receipt, items } = req.body;
    const category = receipt.category;

    if (!receipt || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: "Receipt and items are required" });
    }

    // Create the receipt without totalPay first
    const newReceipt = await Receipts.create({
      ...receipt,
      GroupId: groupId,
      User_Id: userId,
      category: category,
    });

    // Attach receipt ID to items and bulk create
    const receiptItems = items.map((item) => ({
      ...item,
      Receipt_Id: newReceipt.id,
    }));

    const createdItems = await Item.bulkCreate(receiptItems);

    // Calculate totalPay from created items
    //.reduce() method is a tool that allows you to go through an array and combine all the values into a single final result.
    const totalPay = createdItems.reduce(
      (sum, item) => sum + parseFloat(item.price),
      0
    );

    // Update receipt with totalPay
    newReceipt.totalPay = Math.round(totalPay * 100) / 100; // round to 2 decimals
    //update the corresponding row in the database
    await newReceipt.save();

    res.status(201).json({
      message: "Receipt uploaded successfully",
      receipt: newReceipt,
      items: createdItems,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to upload receipt to group" });
  }
});

module.exports = router;
