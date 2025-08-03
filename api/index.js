const express = require("express");
const router = express.Router();
const testDbRouter = require("./test-db");
const veryfiReceipt = require("./veryfiReceipt");
const users = require("./users");
const group = require("./group");
const items = require("./items");
const receiptsRouter = require("./receipts");

router.use("/test-db", testDbRouter);

//test OCR
router.use("/veryfiReceipt", veryfiReceipt);

//DB API
router.use("/users", users);
router.use("/group", group);
router.use("/items", items);

//bryan?
router.use("/receipts", receiptsRouter);

module.exports = router;


