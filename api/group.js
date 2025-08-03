const express = require("express");
const router = express.Router();
const { authenticateJWT } = require("../auth");
const { User, Group, Invite } = require("../database");

//add authenticateJWT later

// create a group
router.post("/create", async (req, res) => {
  const userId = req.user?.id;

  if (!userId) {
    return res.status(404).json({ error: "Unauthorized" });
  }

  const { description, groupName, Receipt_Id } = req.body;
  console.log("Request body:", req.body);

  try {
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const newGroup = await Group.create({
      Owner: userId,
      description,
      groupName,
      Receipt_Id,
    });

    res.status(200).json(newGroup);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create group" });
  }
});

//delete a group (only owner is supposed to this)
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

//Create an Invite
router.post("/invite", async (req, res) => {
  try {
    const { senderId, receiverId, GroupId } = req.body;

    const invite = await Invite.create({
      senderId,
      receiverId,
      GroupId,
      status: "pending",
    });

    res.status(200).json(invite);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create invite" });
  }
});

//Invite a user to a group(adding)
router.post("/invite/:invId/accept", async (req, res) => {
  try {
    const invite = await Invite.findByPk(req.params.invId);

    if (!invite || invite.status !== "pending") {
      return res
        .status(404)
        .json({ error: "Invite not found or already handled" });
    }

    const user = await User.findByPk(invite.receiverId);//invite.receiverId
    console.log(user);
    const group = await Group.findByPk(invite.GroupId);//invite.GroupId
    console.log(group);
    if (!user || !group) {
      return res.status(404).json({ error: "User or group not found" });
    }

    //this auto adds a user to a group, and updates the status to accepted
    await group.addUser(user);
    invite.status = "accepted";
    await invite.save();

    res.status(200).json({ message: "Invite accepted, user added to group" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to accept invite" });
  }
});

//decline an invite
router.post("/invite/:id/decline", async (req, res) => {
  try {
    const invite = await Invite.findByPk(req.params.id);
    if (!invite || invite.status !== "pending") {
      return res
        .status(404)
        .json({ error: "Invite not found or already handled" });
    }

    const user = await User.findByPk(invite.receiverId);
    const group = await Group.findByPk(invite.GroupId);

    if (!user || !group) {
      return res.status(404).json({ error: "User or group not found" });
    }

    //decline invite 
    invite.status = "declined";
    await invite.save();
    res.status(200).json({ message: "Invite declined" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to decline invite" });
  }
});

module.exports = router;
