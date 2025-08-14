const express = require("express");
const axios = require("axios");
const router = express.Router();
const { Receipts, Item } = require("../database");

// Load these from environment variables for security
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
    const { receiptId } = req.body;

    if (!receiptId) {
      return res.status(400).json({ error: "Receipt ID is required" });
    }

    // Calculate total from receipt items
    const items = await Item.findAll({ where: { Receipt_Id: receiptId } });
    const total = items.reduce((sum, item) => sum + parseFloat(item.price), 0).toFixed(2);

    const accessToken = await getAccessToken();

    const order = await axios.post(
      "https://api-m.sandbox.paypal.com/v2/checkout/orders",
      {
        intent: "CAPTURE",
        purchase_units: [{ amount: { currency_code: "USD", value: total } }],
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
    res.status(500).json({ error: "Something went wrong creating the order" });
  }
});

// Capture order endpoint
router.post("/capture-order/:orderId", async (req, res) => {
  try {
    const { orderId } = req.params;
    const { receiptId } = req.body;

    if (!orderId || !receiptId) {
      return res.status(400).json({ error: "Order ID and Receipt ID are required" });
    }

    const accessToken = await getAccessToken();

    // Capture payment from PayPal
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

    const payment = capture.data;

    // Update the corresponding receipt in the database
    await Receipts.update(
      {
        paypalOrderId: orderId,
        amount: payment.purchase_units[0].payments.captures[0].amount.value,
        status: payment.status.toLowerCase(),
      },
      {
        where: { id: receiptId },
      }
    );

    res.json(payment);
  } catch (error) {
    console.error(error.response?.data || error.message);
    res.status(500).json({ error: "Something went wrong capturing the order" });
  }
});

// Total amount from a receipt
router.get("/totalPayment/:receiptId", async (req, res) => {
  try {
    const receiptId = req.params.receiptId;

    const items = await Item.findAll({ where: { Receipt_Id: receiptId } });

    const total = items.reduce((sum, item) => sum + parseFloat(item.price), 0).toFixed(2);

    res.json({ receiptId, total });
  } catch (err) {
    console.error("Error calculating total:", err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
