const express = require("express");
const Contact = require("../models/Contact");
const { requireAdmin } = require("../middleware/auth");

const router = express.Router();

// POST /api/contact — public: visitor sends a message
router.post("/", async (req, res) => {
  try {
    const message = await Contact.create(req.body);
    res.status(201).json(message);
  } catch (err) {
    res.status(400).json({ message: "Could not send message.", error: err.message });
  }
});

// GET /api/contact — admin only
router.get("/", requireAdmin, async (req, res) => {
  try {
    const messages = await Contact.find({}).sort({ createdAt: -1 });
    res.json(messages);
  } catch (err) {
    res.status(500).json({ message: "Could not load messages.", error: err.message });
  }
});

module.exports = router;
