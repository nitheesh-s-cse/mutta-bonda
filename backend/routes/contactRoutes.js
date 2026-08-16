const express = require("express");
const supabase = require("../config/supabase");
const { requireAdmin } = require("../middleware/auth");

const router = express.Router();

// POST /api/contact — public: visitor sends a message
router.post("/", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("contact_messages")
      .insert([req.body])
      .select();

    if (error) throw error;
    res.status(201).json(data[0]);
  } catch (err) {
    res.status(400).json({ message: "Could not send message.", error: err.message });
  }
});

// GET /api/contact — admin only
router.get("/", requireAdmin, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("contact_messages")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: "Could not load messages.", error: err.message });
  }
});

module.exports = router;

