const express = require("express");
const Feedback = require("../models/Feedback");
const { requireAdmin } = require("../middleware/auth");

const router = express.Router();

// POST /api/feedback — public: customer submits feedback
router.post("/", async (req, res) => {
  try {
    const feedback = await Feedback.create(req.body);
    res.status(201).json(feedback);
  } catch (err) {
    res.status(400).json({ message: "Could not save feedback.", error: err.message });
  }
});

// GET /api/feedback — admin only: view all feedback (for reports / CSV export)
router.get("/", requireAdmin, async (req, res) => {
  try {
    const feedback = await Feedback.find({}).sort({ createdAt: -1 });
    res.json(feedback);
  } catch (err) {
    res.status(500).json({ message: "Could not load feedback.", error: err.message });
  }
});

module.exports = router;
