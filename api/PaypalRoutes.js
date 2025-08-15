const express = require("express");
const axios = require("axios");
const router = express.Router();
const { Payments, Receipts } = require("../database");

// Load from env
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

// Accept payment request → create PayPal order
router.post("/Payment/:paymentId/accept", async (req, res) => {
  try {
    const { paymentId } = req.params;

    // Fetch the payment request
    const payment = await Payments.findByPk(paymentId);
    if (!payment) return res.status(404).json({ error: "Payment not found" });
    if (payment.status === "paid")
      return res.status(400).json({ error: "Already paid" });

    const accessToken = await getAccessToken();

    // Create PayPal order
    const order = await axios.post(
      "https://api-m.sandbox.paypal.com/v2/checkout/orders",
      {
        intent: "CAPTURE",
        purchase_units: [
          {
            amount: {
              currency_code: "USD",
              value: payment.amount.toFixed(2),
            },
          },
        ],
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    // Save PayPal order ID in payment row
    await payment.update({ paypalOrderId: order.data.id });

    // Send order info to frontend for approval
    res.json(order.data);
  } catch (error) {
    console.error(error.response?.data || error.message);
    res.status(500).json({ error: "Failed to create PayPal order" });
  }
});

// Step 2: Capture PayPal payment after frontend approval
router.post("/Payment/:paymentId/capture/:orderId", async (req, res) => {
  try {
    const { paymentId, orderId } = req.params;

    const payment = await Payments.findByPk(paymentId);
    if (!payment) return res.status(404).json({ error: "Payment not found" });

    const accessToken = await getAccessToken();

    // Capture the payment
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
    
    // Update payment status
    await payment.update({
      status: "paid",
      capturedAmount:
        capture.data.purchase_units[0].payments.captures[0].amount.value,
      captureId: capture.data.purchase_units[0].payments.captures[0].id,
    });

    const receiptPayments = await Payments.findAll({
      where: { Receipt_Id: payment.Receipt_Id },
    });

    const allPaid = receiptPayments.every((p) => p.status === "paid");

    await Receipts.update(
      { status: allPaid ? "paid" : "partial" },
      { where: { id: payment.Receipt_Id } }
    );

    res.json(capture.data);
  } catch (error) {
    console.error(error.response?.data || error.message);
    res.status(500).json({ error: "Failed to capture PayPal payment" });
  }
});

module.exports = router;
