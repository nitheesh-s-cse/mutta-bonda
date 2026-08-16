const express = require("express");
const supabase = require("../config/supabase");
const { requireAdmin } = require("../middleware/auth");

const router = express.Router();

// GET /api/menu — public: list all items (optional ?category=)
router.get("/", async (req, res) => {
  try {
    let query = supabase.from("menu_items").select("*").order("category").order("name");

    if (req.query.category) {
      query = query.eq("category", req.query.category);
    }

    const { data, error } = await query;
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: "Could not load menu.", error: err.message });
  }
});

// GET /api/menu/special — public: today's featured item
router.get("/special", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("menu_items")
      .select("*")
      .eq("is_todays_special", true)
      .limit(1);

    if (error) throw error;
    res.json(data && data.length > 0 ? data[0] : null);
  } catch (err) {
    res.status(500).json({ message: "Could not load today's special.", error: err.message });
  }
});

// POST /api/menu — admin only: add item
router.post("/", requireAdmin, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("menu_items")
      .insert([req.body])
      .select();

    if (error) throw error;
    res.status(201).json(data[0]);
  } catch (err) {
    res.status(400).json({ message: "Could not add menu item.", error: err.message });
  }
});

// PUT /api/menu/:id — admin only: edit item (price, availability, image, etc.)
router.put("/:id", requireAdmin, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("menu_items")
      .update(req.body)
      .eq("id", req.params.id)
      .select();

    if (error) throw error;
    if (!data || data.length === 0) return res.status(404).json({ message: "Menu item not found." });
    res.json(data[0]);
  } catch (err) {
    res.status(400).json({ message: "Could not update menu item.", error: err.message });
  }
});

// DELETE /api/menu/:id — admin only
router.delete("/:id", requireAdmin, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("menu_items")
      .delete()
      .eq("id", req.params.id)
      .select();

    if (error) throw error;
    if (!data || data.length === 0) return res.status(404).json({ message: "Menu item not found." });
    res.json({ message: "Menu item deleted." });
  } catch (err) {
    res.status(500).json({ message: "Could not delete menu item.", error: err.message });
  }
});

module.exports = router;