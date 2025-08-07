const express = require("express");
const axios = require("axios");
const router = express.Router();
const { Receipts, Item } = require("../database");

// Load these from environment variables for security:
const clientId = process.env.PAYPAL_CLIENT_ID;
const clientSecret = process.env.PAYPAL_SECRET;

// Helper: Get access token
const getAccessToken = async () => {
  const response = await axios.post(
    "https://api-m.sandbox.paypal.com/v1/oauth2/token",
    "grant_type=client_credentials",
    {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      auth: { username: clientId, password: clientSecret },
    }
  );
  return response.data.access_token;
};

// Create order endpoint
router.post("/create-order", async (req, res) => {
  try {
    const accessToken = await getAccessToken();

    // Get amount from client or set fixed amount
    const { amount } = req.body;

    const order = await axios.post(
      "https://api-m.sandbox.paypal.com/v2/checkout/orders",
      {
        intent: "CAPTURE",
        purchase_units: [{ amount: { currency_code: "USD", value: amount } }],
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    res.json(order.data);
  } catch (error) {
    console.error(error.response?.data || error.message);
    res.status(500).json({ error: "Something went wrong" });
  }
});

// Capture order endpoint
router.post("/capture-order/:orderId", async (req, res) => {
  try {
    const accessToken = await getAccessToken();
    const { orderId } = req.params;

    const capture = await axios.post(
      `https://api-m.sandbox.paypal.com/v2/checkout/orders/${orderId}/capture`,
      {},
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    res.json(capture.data);
  } catch (error) {
    console.error(error.response?.data || error.message);
    res.status(500).json({ error: "Something went wrong" });
  }
});

// total amount from a receipt
router.get("/totalPayment/:receiptId", async (req, res) => {
  try {
    const receiptId = req.params.receiptId;

    const items = await Item.findAll({ where: { Receipt_Id: receiptId } });

    //.reduce() method is a tool that allows you to go through an array and combine all the values into a single final result.
    const total = items.reduce((sum, item) => sum + item.price, 0);

    res.json({ receiptId, total });
  } catch (err) {
    console.error("Error calculating total:", err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
