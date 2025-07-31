const express = require("express");
const router = express.Router();
const testDbRouter = require("./test-db");
const Verify  = require("./Verify ");

router.use("/test-db", testDbRouter);
//test OCR
router.use("/tesseract", Verify );

module.exports = router;
