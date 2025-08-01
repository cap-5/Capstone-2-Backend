const express = require("express");
const router = express.Router();
const { adminAuthenticate, authenticateJWT } = require("../auth");
const { User, Group } = require("../database");

// get all users
router.get("/Allusers", async (req, res) => {
  try {
    const getAllUsers = await User.findAll();
    res.status(200).send(getAllUsers);
  } catch (err) {
    console.error("error finding all users", err);
    res.status(500).json({ message: "internal server error" });
  }
});

// create a group
router.post("/create", async (req, res) => {
  const { Owner, groupName, Receipt_Id } = req.body;

  if (!Owner) {
    return res.status(400).json({ error: "Owner is required" });
  }

  try {
    const newGroup = await Group.create({ Owner, groupName, Receipt_Id });
    res.status(201).json(newGroup);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create group" });
  }
});

module.exports = router;
