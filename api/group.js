const express = require("express");
const router = express.Router();
const { authenticateJWT } = require("../auth");
const { User, Group } = require("../database");

// create a group
router.post("/create", async (req, res) => {
  const userId = req.user?.id;

  if (!userId) {
    return res.status(404).json({ error: "Unauthorized" });
  }

  const { groupName, Receipt_Id } = req.body;

  try {
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const newGroup = await Group.create({
      Owner: userId,
      groupName,
      Receipt_Id,
    });

    res.status(200).json(newGroup);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create group" });
  }
});



module.exports = router;
