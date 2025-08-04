const express = require("express");
const router = express.Router();
const { Receipts, Item } = require("../database");

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
        res.status(500).send(
            "Failed to find the receipt you were looking for.",
        );
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
router.post("/", async (req, res) => {
    try {
        const { receipt, items } = req.body;
        const newReceipt = await Receipts.create(receipt); // create the new receipt
        const newReceiptId = newReceipt.id; // get the id of the created receipt

        // create the new items and associate them with this receipt
        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            item.Receipt_id = newReceiptId;
            await newReceipt.createItem(item);
        }

        res.status(200).send(receipt);
    } catch (error) {
        console.error("Error posting receipt:", error);
        res.status(500).send("Failed to post receipt.");
    }
});

module.exports = router;
