const express = require("express");
const router = express.Router();
//const { adminAuthenticate, authenticateJWT } = require("../auth");
const { User } = require("../database");
const { Op } = require("sequelize"); // Used for case-insenitive matching


router.get("/Allusers", async (req, res) => {
  try {
    const { page = 1, limit = 10, search = "" } = req.query;
    const offset = (page - 1) * limit;

    // Build search filter 
    const whereClause = search 
      ? {
         [Op.or]: [
           { username: { [Op.iLike]: `%${search}%`} },
           /*{ email: { [Op.iLike]: `%${search}%`} },*/
         ],
       }
      : {};

    // This fetches the users and total count 
    const { count, rows: users } = await User.findAndCountAll ({
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
    })
  } catch (err) {
    console.error("error finding all users", err);
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
          [Op.iLike]: `%${query}%`,  // Matches input anywhere, it is case-insensitive 
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

module.exports = router;
