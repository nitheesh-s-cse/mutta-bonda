const express = require("express");
const supabase = require("../config/supabase");
const { requireAdmin } = require("../middleware/auth");

const router = express.Router();

// POST /api/feedback — public: customer submits feedback
router.post("/", async (req, res) => {
  try {
    const b = req.body;
    const payload = {
      name: b.name || "",
      phone: b.phone || "",
      email: b.email || "",
      visit_date: b.visit_date || b.visitDate || null,
      favourite_item: b.favourite_item || b.favouriteItem || "",
      food_quality: b.food_quality || b.foodQuality || "Good",
      ratings: b.ratings || {},
      visit_again: b.visit_again || b.visitAgain || "Yes",
      recommend: b.recommend || "Yes",
      suggestions: b.suggestions || ""
    };

    const { data, error } = await supabase
      .from("feedback")
      .insert([payload])
      .select();

    if (error) {
      console.error("Supabase feedback insert error:", error);
      throw error;
    }
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

