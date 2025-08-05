const express = require("express");
const router = express.Router();
const users = require("./users");
const group = require("./group");
const receiptsRouter = require("./receipts");

//DB API
router.use("/users", users);
router.use("/group", group);
router.use("/receipts", receiptsRouter);

module.exports = router;


