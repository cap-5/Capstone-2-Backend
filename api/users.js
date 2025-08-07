const express = require("express");
const router = express.Router();
const { authenticateJWT } = require("../auth");
const { User, Group, Receipts } = require("../database");

// add authenticateJWT later

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

router.get("/me", authenticateJWT, async (req, res) => {
  try {
    const userId = req.user.id;
    const userInfo = await User.findByPk(userId);
    if (!userInfo) {
      return res.status(404).json({ error: "user not found" });
    }
    res.send({
      message: "Display user specific info successful",
      userInfo: {
        username: userInfo.username,
        profilePic: userInfo.profilePic,
        email: userInfo.email,
        firstName: userInfo.firstName,
        lastName: userInfo.lastName,
      },
    });
  } catch (err) {
    console.error("User info not fetched", err);
    res.status(500).json({ message: "internal server error" });
  }
});

module.exports = router;
