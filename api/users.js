const express = require("express");
const router = express.Router();
const { authenticateJWT } = require("../auth");
const { User, Group, Receipts } = require("../database");
//const { adminAuthenticate, authenticateJWT } = require("../auth");
const { Op } = require("sequelize"); // Used for case-insenitive matching

// get all users
router.get("/Allusers", authenticateJWT, async (req, res) => {
  try {
    const { page = 1, limit = 10, search = "" } = req.query;
    const offset = (page - 1) * limit;

    // Build search filter
    const whereClause = search
      ? {
          [Op.or]: [
            { username: { [Op.iLike]: `%${search}%` } },
            /*{ email: { [Op.iLike]: `%${search}%`} },*/
          ],
        }
      : {};

    // This fetches the users and total count
    const { count, rows: users } = await User.findAndCountAll({
      where: whereClause,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [["username", "ASC"]],
    });

    res.status(200).json({
      totalUsers: count,
      currentPage: parseInt(page),
      totalPages: Math.ceil(count / limit),
      users,
    });
  } catch (err) {
    console.error("error finding all users", err);
    res.status(500).json({ message: "internal server error" });
  }
});

router.get("/me", authenticateJWT, async (req, res) => {
  try {
    const userId = req.user?.id; // logged in user

    if (!userId) {
      return res.status(404).json({ error: "Unauthorized" });
    }

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

// Search Route (autocomplete)
router.get("/search", async (req, res) => {
  try {
    const { query } = req.query;

    if (!query) {
      return res.status(400).json({ message: "Query is required" });
    }

    const users = await User.findAll({
      where: {
        username: {
          [Op.iLike]: `%${query}%`, // Matches input anywhere, it is case-insensitive
        },
      },
      attributes: ["id", "username"], // Returns specific user
      limit: 10,
    });

    res.json(users);
  } catch (error) {
    console.error("Error searching users:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});
//get recpit based of user
router.get("/:id", async (req, res) => {
  try {
    const urlId = Number(req.params.id);
    const user = await User.findByPk(urlId);
    const userReceipts = await Receipts.findAll({
      where: { User_Id: user.id },
    });
    res.status(200).send(userReceipts);
  } catch (err) {
    console.error("cant not recive and a recpit baseed of id", err);
    res.status(500).json({ error: "can not get repictpt based of of user" });
  }
});

module.exports = router;
