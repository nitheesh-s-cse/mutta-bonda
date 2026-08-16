const express = require("express");
const supabase = require("../config/supabase");
const { requireAdmin } = require("../middleware/auth");

const router = express.Router();

// GET /api/menu — public: list all items (optional ?category=)
router.get("/", async (req, res) => {
  try {
    let query = supabase.from("menu_items").select("*").order("id", { ascending: true });

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
    const rawId = req.params.id;
    const targetId = isNaN(rawId) ? rawId : Number(rawId);

    let { data, error } = await supabase
      .from("menu_items")
      .update(req.body)
      .eq("id", targetId)
      .select();

    if (error) throw error;

    if (!data || data.length === 0) {
      let { data: retryData, error: retryErr } = await supabase
        .from("menu_items")
        .update(req.body)
        .eq("id", rawId)
        .select();

      if (retryErr) throw retryErr;
      data = retryData;
    }

    if (!data || data.length === 0) {
      const newItemPayload = {
        id: targetId,
        name: req.body.name || "Menu Item",
        price: req.body.price || 0,
        category: req.body.category || "Special Bonda",
        ...req.body,
      };

      const { data: inserted, error: insertErr } = await supabase
        .from("menu_items")
        .insert([newItemPayload])
        .select();

      if (insertErr) throw insertErr;
      data = inserted;
    }

    res.json(data[0] || req.body);
  } catch (err) {
    console.error("Update menu error:", err);
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