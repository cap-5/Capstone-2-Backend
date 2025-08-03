const express = require("express");
const router = express.Router();
const { adminAuthenticate, authenticateJWT } = require("../auth");
const { User, Group, Item } = require("../database");


router.get("/Allitems", async (req, res) => {
  try {
    const getAll = await Item.findAll();
    res.sendStatus(200);
  } catch (err) {
    console.error("can not get all the items", err);
    res.status(400).json({ message: "there no items" });
  }
});

module.exports = router;
