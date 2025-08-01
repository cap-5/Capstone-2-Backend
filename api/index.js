const express = require("express");
const router = express.Router();
const testDbRouter = require("./test-db");
const veryfiReceipt = require("./veryfiReceipt");
const users = require("./users");

router.use("/test-db", testDbRouter);
//test OCR
router.use("/veryfiReceipt", veryfiReceipt);
router.use("/users", users);

module.exports = router;
