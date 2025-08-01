const express = require("express");
const router = express.Router();
const { processDocument } = require("./veryfiClient");

//Base64: It encodes binary data as ASCII characters (letters, digits, +, /).

router.post("/upload", async (req, res) => {
  try {
    let { fileName, fileDataBase64 } = req.body;

    if (!fileName || !fileDataBase64) {
      return res
        .status(400)
        .json({ error: "Missing fileName or fileDataBase64" });
    }

    //It removes the "data URL prefix" from a base64 string
    fileDataBase64 = fileDataBase64.replace(/^data:\w+\/\w+;base64,/, "");

    // Send the file name and base64-encoded file content to Veryfi's OCR API
    const result = await processDocument(fileName, fileDataBase64);

    console.log("Veryfi result:", JSON.stringify(result, null, 2));
    res.json(result);
  } catch (err) {
    console.error("Veryfi upload error:", err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
