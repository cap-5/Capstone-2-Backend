const express = require("express");
const router = express.Router();
const { authenticateJWT } = require("../auth");
const { User, Group, Invite, UserGroups, Receipts } = require("../database");

// Edit Group info
router.patch("/:editGroup", async (req, res) => {
  try {
    const id = Number(req.params.editGroup);
    const groupTOPatch = await Group.findByPk(id);

    if (!groupTOPatch) {
      return res.status(404).json({ error: "Group does not exist" });
    }

    await groupTOPatch.update({
      groupName: req.body.groupName,
      description: req.body.description,
    });

    res.sendStatus(200);
  } catch (err) {
    console.error("Error updating group:", err);
    res.status(400).json({ error: "Unable to update group" });
  }
});

//Check my groups
router.get("/myGroups", authenticateJWT, async (req, res) => {
  try {
    const userId = req.user?.id;
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    const getGroups = await user.getGroups();
    res.status(200).send(getGroups);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not fetch groups" });
  }
});


//check individual group
router.get("/myGroups/:id", async (req, res) => {
  try {

    const groupId = Number(req.params.id);
    const group = await Group.findByPk(groupId);
    if (!group) {
      return res.status(404).json({ error: "Group not found" });
    }

    res.status(200).json(group);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not fetch group" });
  }
});


// create a group
router.post("/create", authenticateJWT, async (req, res) => {
  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const { description, groupName } = req.body;
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
    });

    //add owner to group
    await newGroup.addUser(user);

    res
      .status(201)
      .json({ message: "Group created successfully", group: newGroup });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create group" });
  }
});

//delete a group (only owner is supposed to this)
router.delete("/delete/:id", authenticateJWT, async (req, res) => {
  try {
    const userId = req.user?.id; //logged in user
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const groupId = Number(req.params.id);

    if (!groupId) {
      return res.status(400).json({ error: "Group ID is required" });
    }

    const group = await Group.findByPk(groupId);
    if (!group) {
      return res.status(404).json({ error: "Group does not exist" });
    }

    //check if logged-in user is the owner
    if (group.Owner !== userId) {
      //403, Forbidden status means the server understood the request but refuses to authorize it
      return res.status(403).json({ error: "Forbidden: Not group owner" });
    }

    await group.destroy();
    res.status(200).json({ message: "Group deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not delete group" });
  }
});

// Get members of a group
router.get("/:id/members", async (req, res) => {
  try {
    const groupId = Number(req.params.id);
    const group = await Group.findByPk(groupId);

    if (!group) {
      return res.status(404).json({ error: "Group not found" });
    }

    const members = await group.getUsers();
    res.status(200).json(members);
  } catch (err) {
    console.error("Error fetching group members:", err);
    res.status(500).json({ error: "Failed to fetch group members" });
  }
})

//remove a member from a group
router.delete("/:id/members/:userId", authenticateJWT, async (req, res) => {
  try {

    const groupId = Number(req.params.id);
    const userId = Number(req.params.userId);

    const group = await Group.findByPk(groupId);
    if (!group) {
      return res.status(404).json({ error: "Group not found" });
    }

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Check if the user is part of the group
    const isMember = await group.hasUser(user);
    if (!isMember) {
      return res.status(400).json({ error: "User is not a member of the group" });
    }

    if (group.Owner === userId) {
      // Remove the user from the group
      await group.removeUser(user);
      res.status(200).json({ message: "User removed from group successfully" });
    } else {
      return res.status(403).json({ error: "Only group owner can remove members" });
    }
  } catch (err) {
    console.error("Error removing member from group:", err);
    res.status(500).json({ error: "Failed to remove member from group" });
  }
});

//leave a group on your own
router.post("/:id/leave", authenticateJWT, async (req, res) => {
  try {
    const groupId = Number(req.params.id);
    const userId = req.user?.id; 
    const group = await Group.findByPk(groupId);
    if (!group) {
      return res.status(404).json({ error: "Group not found" });
    }

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const isMember = await group.hasUser(user);
    if (!isMember) {
      return res.status(400).json({ error: "You are not a member of this group" });
    }

    //prevent owner from leaving their own group
    if (group.Owner === userId) {
      return res.status(403).json({ error: "Group owner cannot leave the group. Please delete the group instead." });
    } else {
      await group.removeUser(user);
      res.status(200).json({ message: "You have left the group successfully" });
    }

  } catch (err) {
    console.error("Error leaving group:", err);
    res.status(500).json({ error: "Failed to leave group" });
  }

});
//Create an Invite
router.post("/invite", authenticateJWT, async (req, res) => {
  try {
    const userId = req.user?.id; // logged in user

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { receiverId, GroupId } = req.body;

    const group = await Group.findByPk(GroupId);
    if (!group) {
      return res.status(404).json({ error: "Group not found" });
    }

    const receiver = await User.findByPk(receiverId);
    if (!receiver) {
      return res.status(404).json({ error: "Receiver user not found" });
    }

    if (receiverId === userId) {
      return res.status(400).json({ error: "Cannot invite yourself" });
    }

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ error: "Sender user not found" });
    }

    // Check if the sender/user is part of the group.
    // This line fetches all groups the user belongs to, but filters only for the current GroupId.
    // If the returned array is empty, it means the user is not a member of that group.
    const groups = await user.getGroups({ where: { id: GroupId } });
    if (groups.length === 0) {
      return res
        .status(403)
        .json({ error: "You must be part of the group to send invites" });
    }

    //Check if there is already a pending invite from the same sender to the same receiver for the same group.
    const existingInvite = await Invite.findOne({
      where: {
        senderId: userId,
        receiverId,
        GroupId,
        status: "pending",
      },
    });

    if (existingInvite) {
      return res.status(400).json({ error: "Invite already sent and pending" });
    }

    const invite = await Invite.create({
      senderId: userId,
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


//get all invites for a user
router.get("/invites", authenticateJWT, async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    const invites = await Invite.findAll({
      where: { receiverId: user.id, status: "pending" },
      include: [{ model: Group }],
    });

    res.status(200).json(invites);

  } catch (err) {
    console.error("Error fetching invites:", err);
    res.status(500).json({ error: "Failed to fetch invites" });
  }

})

//Invite a user to a group(adding)
router.post("/invite/:invId/accept", authenticateJWT, async (req, res) => {
  try {
    const invite = await Invite.findByPk(req.params.invId);

    if (!invite || invite.status !== "pending") {
      return res
        .status(404)
        .json({ error: "Invite not found or already handled" });
    }

    const user = await User.findByPk(invite.receiverId); //invite.receiverId
    console.log(user);
    const group = await Group.findByPk(invite.GroupId); //invite.GroupId
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
router.post("/invite/:id/decline", authenticateJWT, async (req, res) => {
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

//get a repcipt based of group
router.get("/:id", async (req, res) => {
  try {

    const getUrl = Number(req.params.id);

    const group = await Group.findByPk(getUrl);
    if (!group) {
      return res.status(404).json({ error: "Group not found" });
    }

    const groupReceipts = await Receipts.findAll({
      where: { Group_Id: group.id },
    });

    // check if no receipts found
    if (!groupReceipts || groupReceipts.length === 0) {
      return res.status(404).json({ error: "No receipts found for this group" });
    }
    res.status(200).json(groupReceipts);

  } catch (err) {
    console.error("Cannot get group receipts:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
