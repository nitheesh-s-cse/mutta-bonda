const express = require("express");
const supabase = require("../config/supabase");
const { requireAdmin } = require("../middleware/auth");

const router = express.Router();

// POST /api/feedback — public: customer submits feedback
router.post("/", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("feedback")
      .insert([req.body])
      .select();

    if (error) throw error;
    res.status(201).json(data[0]);
  } catch (err) {
    res.status(400).json({ message: "Could not save feedback.", error: err.message });
  }
});

// GET /api/feedback — admin only: view all feedback (for reports / CSV export)
router.get("/", requireAdmin, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("feedback")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: "Could not load feedback.", error: err.message });
  }
});

module.exports = router;

