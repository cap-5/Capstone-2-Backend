const express = require("express");
const router = express.Router();
const testDbRouter = require("./test-db");
const receiptsRouter = require("./receipts");

router.use("/test-db", testDbRouter);
router.use("/receipts", receiptsRouter);

module.exports = router;
