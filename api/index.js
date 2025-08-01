const express = require("express");
const router = express.Router();
const testDbRouter = require("./test-db");
const veryfiReceipt = require("./veryfiReceipt");
const users = require("./users");
const items = require("./items");

router.use("/test-db", testDbRouter);
//test OCR
router.use("/veryfiReceipt", veryfiReceipt);
router.use("/users", users);
router.use("/items", items);
module.exports = router;
