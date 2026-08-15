const express = require("express");
const MenuItem = require("../models/MenuItem");
const { requireAdmin } = require("../middleware/auth");

const router = express.Router();

// GET /api/menu — public: list all items (optional ?category=)
router.get("/", async (req, res) => {
  try {
    const filter = req.query.category ? { category: req.query.category } : {};
    const items = await MenuItem.find(filter).sort({ category: 1, name: 1 });
    res.json(items);
  } catch (err) {
    res.status(500).json({ message: "Could not load menu.", error: err.message });
  }
});

// GET /api/menu/special — public: today's featured item
router.get("/special", async (req, res) => {
  try {
    const special = await MenuItem.findOne({ isTodaysSpecial: true });
    res.json(special);
  } catch (err) {
    res.status(500).json({ message: "Could not load today's special.", error: err.message });
  }
});

// POST /api/menu — admin only: add item
router.post("/", requireAdmin, async (req, res) => {
  try {
    const item = await MenuItem.create(req.body);
    res.status(201).json(item);
  } catch (err) {
    res.status(400).json({ message: "Could not add menu item.", error: err.message });
  }
});

// PUT /api/menu/:id — admin only: edit item (price, availability, image, etc.)
router.put("/:id", requireAdmin, async (req, res) => {
  try {
    const item = await MenuItem.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!item) return res.status(404).json({ message: "Menu item not found." });
    res.json(item);
  } catch (err) {
    res.status(400).json({ message: "Could not update menu item.", error: err.message });
  }
});

// DELETE /api/menu/:id — admin only
router.delete("/:id", requireAdmin, async (req, res) => {
  try {
    const item = await MenuItem.findByIdAndDelete(req.params.id);
    if (!item) return res.status(404).json({ message: "Menu item not found." });
    res.json({ message: "Menu item deleted." });
  } catch (err) {
    res.status(500).json({ message: "Could not delete menu item.", error: err.message });
  }
});

module.exports = router;
