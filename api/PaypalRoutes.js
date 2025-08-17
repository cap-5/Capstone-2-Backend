const express = require("express");
const axios = require("axios");
const router = express.Router();
const { Payments, User } = require("../database");
const sendEmail = require("../utils/email");

// Helper to get PayPal access token
const getAccessToken = async () => {
  const params = new URLSearchParams();
  params.append("grant_type", "client_credentials");

  const response = await axios.post(
    "https://api-m.sandbox.paypal.com/v1/oauth2/token",
    params.toString(),
    {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      auth: {
        username: process.env.PAYPAL_CLIENT_ID,
        password: process.env.PAYPAL_SECRET,
      },
    }
  );

  return response.data.access_token;
};

// Accept payment request, create PayPal order, and send email
router.post("/Payment/:paymentId/accept", async (req, res) => {
  try {
    const { paymentId } = req.params;

    const payment = await Payments.findByPk(paymentId, { include: User });
    if (!payment) return res.status(404).json({ error: "Payment not found" });
    if (payment.status === "paid") return res.status(400).json({ error: "Already paid" });

    const accessToken = await getAccessToken();
    const amountValue = payment.amount ? Number(payment.amount).toFixed(2) : "0.00";

    // Create PayPal order
    const order = await axios.post(
      "https://api-m.sandbox.paypal.com/v2/checkout/orders",
      {
        intent: "CAPTURE",
        purchase_units: [{ amount: { currency_code: "USD", value: amountValue } }],
      },
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    await payment.update({ paypalOrderId: order.data.id });

    // Send email to payer
    const payer = await User.findByPk(payment.payerId);
    if (payer?.paypalEmail) {
      await sendEmail(
        payer.paypalEmail,
        "Payment Request",
        `<p>You have a new payment request of $${payment.amount}.</p>
         <p><a href="https://yourapp.com/pay/${payment.id}">Pay Now</a></p>`
      );
      console.log(`Email sent to ${payer.paypalEmail}`);
    } else {
      console.warn("Payer has no paypalEmail, skipping email.");
    }

    res.json({ message: "Payment accepted, PayPal order created.", orderId: order.data.id });
  } catch (error) {
    console.error(error.response?.data || error.message);
    res.status(500).json({ error: "Failed to accept payment" });
  }
});

// Simple test route for email sending
router.get("/test-email", async (req, res) => {
  try {
    const testEmail = process.env.TEST_EMAIL || "your-email@example.com";
    await sendEmail(testEmail, "Test Email", "<p>Hello! This is a test.</p>");
    res.json({ message: `Test email sent to ${testEmail}` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to send test email" });
  }
});

module.exports = router;
