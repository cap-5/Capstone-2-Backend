const express = require("express");
const router = express.Router();
const { adminAuthenticate, authenticateJWT } = require("../auth");
const { User } = require("../database");

router.get("/Allusers", async (req, res) => {
  try {
    const getAllUsers = await User.findAll();
    res.status(200).send(getAllUsers);
  } catch (err) {
    console.error("error finding all users", err);
    res.status(500).json({ message: "internal server error" });
  }
});




module.exports = router;
