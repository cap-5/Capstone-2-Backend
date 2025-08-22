const express = require("express");
const router = express.Router();
const { authenticateJWT } = require("../auth");
const { db, User, Group, Invite, Receipts, Payments } = require("../database");

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
    const userId = req.user?.id; // logged in user
    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const memberGroups = await user.getMemberships(); // groups you're a member of

    res.status(200).send(memberGroups);
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
    await newGroup.addMember(user);

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
  const t = await db.transaction();
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const groupId = Number(req.params.id);
    if (!groupId) {
      return res.status(400).json({ error: "Group ID is required" });
    }

    const group = await Group.findByPk(groupId, { transaction: t });
    if (!group) {
      await t.rollback();
      return res.status(404).json({ error: "Group does not exist" });
    }

    if (group.Owner !== userId) {
      await t.rollback();
      return res.status(403).json({ error: "Forbidden: Not group owner" });
    }

    // Delete dependent records first
    await Invite.destroy({ where: { GroupId: groupId }, transaction: t });
    await Payments.destroy({ where: { Group_Id: groupId }, transaction: t });
    await Receipts.destroy({ where: { Group_Id: groupId }, transaction: t });
    await db.models.UserGroups.destroy({
      where: { groupId: groupId },
      transaction: t,
    });

    // Delete the group itself
    await group.destroy({ transaction: t });

    await t.commit();
    res.status(200).json({ message: "Group deleted successfully" });
  } catch (err) {
    await t.rollback();
    console.error(err);
    res.status(500).json({ error: "Could not delete group" });
  }
});

// Get members of a group, mark owner
router.get("/:id/members", async (req, res) => {
  try {
    const groupId = Number(req.params.id);
    const group = await Group.findByPk(groupId);

    if (!group) return res.status(404).json({ error: "Group not found" });

    let members = await group.getMembers();

    // Include owner at the top if not already included
    let ownerUser = null;
    if (group.Owner) {
      ownerUser = await User.findByPk(group.Owner);
      //This checks if the members array already contains the owner, members is put right after
      if (ownerUser && !members.some((m) => m.id === ownerUser.id)) {
        //the first element in the new array (ownerUser), 
        members = [ownerUser, ...members];
      }
    }

    // Add isOwner flag
    members = members.map((m) => ({
      ...m.toJSON(),
      isOwner: m.id === group.Owner,
    }));

    res.status(200).json({ members, owner: ownerUser });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch group members" });
  }
});

//remove a member from a group
router.delete("/:id/members/:userId", authenticateJWT, async (req, res) => {
  try {
    const groupId = Number(req.params.id);
    const userIdToRemove = Number(req.params.userId);
    const loggedInUserId = req.user?.id;

    const group = await Group.findByPk(groupId);
    if (!group) {
      return res.status(404).json({ error: "Group not found" });
    }

    const userToRemove = await User.findByPk(userIdToRemove);
    if (!userToRemove) {
      return res.status(404).json({ error: "User not found" });
    }

    const isMember = await group.hasMember(userToRemove);
    if (!isMember) {
      return res
        .status(400)
        .json({ error: "User is not a member of the group" });
    }

    if (group.Owner === userIdToRemove) {
      return res
        .status(403)
        .json({ error: "Cannot remove the group owner from the group" });
    }

    if (group.Owner !== loggedInUserId) {
      return res
        .status(403)
        .json({ error: "Only group owner can remove members" });
    }

    await group.removeMember(userToRemove);
    res.status(200).json({ message: "User removed from group successfully" });
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

    const isMember = await group.hasMember(user);
    if (!isMember) {
      return res
        .status(400)
        .json({ error: "You are not a member of this group" });
    }

    //prevent owner from leaving their own group
    if (group.Owner === userId) {
      return res.status(403).json({
        error:
          "Group owner cannot leave the group. Please delete the group instead.",
      });
    } else {
      await group.removeMember(user);
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

    //check if they exits in the group
    const receiverGroups = await receiver.getMemberships({
      where: { id: GroupId },
    });
    if (receiverGroups.length > 0) {
      return res.status(400).json({ error: "User is already in the group" });
    }

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ error: "Sender user not found" });
    }

    // Check if the sender/user is part of the group.
    // This line fetches all groups the user belongs to, but filters only for the current GroupId.
    // If the returned array is empty, it means the user is not a member of that group.
    const groups = await user.getMemberships({ where: { id: GroupId } });
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
});

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
    await group.addMember(user);
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

//get a receipts based of group
router.get("/GroupReceipts/:id", async (req, res) => {
  try {
    const getUrl = Number(req.params.id);

    console.log("groupId:", getUrl);

    const group = await Group.findByPk(getUrl);
    if (!group) {
      return res.status(404).json({ error: "Group not found" });
    }

    const groupReceipts = await Receipts.findAll({
      where: { Group_Id: group.id },
      order: [["createdAt", "DESC"]], // newest first
    });

    // check if no receipts found
    if (!groupReceipts || groupReceipts.length === 0) {
      return res
        .status(404)
        .json({ error: "No receipts found for this group" });
    }
    res.status(200).json(groupReceipts);
  } catch (err) {
    console.error("Cannot get group receipts:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

//send request of how much user owns
router.post(
  "/:groupId/receipts/:receiptId/send-request",
  authenticateJWT,
  async (req, res) => {
    const { groupId, receiptId } = req.params;
    const { payments } = req.body;
    const requesterId = req.user?.id;

    if (!requesterId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    try {
      const group = await Group.findByPk(groupId);
      if (!group) {
        return res.status(404).json({ error: "Group not found" });
      }

      const receipt = await Receipts.findByPk(receiptId);
      if (!receipt) {
        return res.status(404).json({ error: "Receipt not found" });
      }

      // Check requester is in the group
      const user = await User.findByPk(requesterId);
      const isMember = await group.hasMember(user);
      if (!isMember) {
        return res
          .status(403)
          .json({ error: "You are not a member of this group" });
      }

      // Check they own the receipt
      if (receipt.User_Id !== requesterId) {
        return res.status(403).json({ error: "You do not own this receipt" });
      }

      // Validate payments format
      if (!Array.isArray(payments) || payments.length === 0) {
        return res.status(400).json({ error: "No payments provided" });
      }

      // Fetch existing payments for this receipt and users
      const existingPayments = await Payments.findAll({
        where: {
          Receipt_Id: receipt.id,
          User_Id: payments.map((p) => p.payerId),
        },
      });

      const existingPayerIds = existingPayments.map((p) => p.User_Id);

      // Only create new payments that don't already exist
      const newPayments = payments
        //Only users not in existingPayerIds will get a new request.
        .filter((p) => !existingPayerIds.includes(p.payerId))
        .map((p) => ({
          User_Id: p.payerId,
          Receipt_Id: receipt.id,
          Group_Id: group.id,
          amount: p.amount,
          requesterId,
          status: "pending",
        }));

      if (newPayments.length === 0) {
        return res
          .status(200)
          .json({ message: "All payment requests already exist" });
      }

      const savedPayments = await Payments.bulkCreate(newPayments);

      res
        .status(201)
        .json({ message: "Payment requests sent", payments: savedPayments });
    } catch (err) {
      console.error("Error sending payment request:", err);
      res.status(500).json({ error: "Failed to send payment request" });
    }
  }
);

//View users payments
router.get("/Payments", authenticateJWT, async (req, res) => {
  try {
    const userId = req.user?.id;

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const viewPayment = await Payments.findAll({
      where: {
        User_Id: user.id,
        status: ["pending", "awaiting_payment"], // include awaiting_payment
      },
      include: [
        { model: Group, as: "groupInfo", attributes: ["id", "groupName"] },
        { model: User, as: "requester", attributes: ["id", "username"] },
      ],
    });

    res.status(200).json(viewPayment);
  } catch (error) {
    console.error("Error fetching payments:", error);
    res.status(500).json({ error: "Failed to fetch payments" });
  }
});

// View payments requested BY the user (requester sees who owes them)
router.get("/RequestedPayments", authenticateJWT, async (req, res) => {
  try {
    const requesterId = req.user?.id;

    const requestedPayments = await Payments.findAll({
      where: {
        requesterId,
        status: ["pending", "awaiting_payment", "paid"],
      },
      include: [
        {
          model: Group,
          as: "groupInfo",
          attributes: ["id", "groupName"],
        },
        {
          model: User,
          as: "payer",
          attributes: ["id", "username"],
        },
        {
          model: Receipts,
          attributes: ["id", "title"],
        },
      ],
    });

    res.status(200).json(requestedPayments);
  } catch (error) {
    console.error("Error fetching requested payments:", error);
    res.status(500).json({ error: "Failed to fetch requested payments" });
  }
});

module.exports = router;
