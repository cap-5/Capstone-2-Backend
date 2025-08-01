const express = require("express");
const router = express.Router();
const { authenticateJWT } = require("../auth");
const { User, Group } = require("../database");

//add authenticateJWT later


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

//delete a group
router.delete("/delete/:id", async (req, res) => {
  try {
    const groupId = Number(req.params.id);

    const group = await Group.findByPk(groupId);
    if (!group) {
      return res.status(404).json({ error: "Group does not exist" });
    }

    await group.destroy();
    res.sendStatus(200);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not delete group" });
  }
});

//adding a user to a group
router.post("/:id/add-user", async (req, res) => {
  try {
    const groupId = Number(req.params.id);
    const { userId } = req.body;

    const group = await Group.findByPk(groupId);
    const user = await User.findByPk(userId);

    if (!group || !user) {
      return res.status(404).json({ error: "Group or User not found" });
    }

    await group.addUser(user); // magic lol
    res.status(200).json({ message: "User added to group" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to add user to group" });
  }
});

module.exports = router;
