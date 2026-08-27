/**
 * ============================================================================
 * MENU ROUTES MODULE (/api/menu)
 * ============================================================================
 * Description: Endpoints for listing food items, getting today's special,
 *              adding new menu items, updating prices/availability, and deleting items.
 * ============================================================================
 */

const express = require("express");
const supabase = require("../config/supabase");
const { requireAdmin } = require("../middleware/auth");

const router = express.Router();

/**
 * ----------------------------------------------------------------------------
 * 1. GET /api/menu (Public Access)
 * ----------------------------------------------------------------------------
 * Purpose: Retrieves all menu items for customer display.
 * Optional Query Params: ?category=Veg Bonda
 */
router.get("/", async (req, res) => {
  try {
    let query = supabase.from("menu_items").select("*").order("id", { ascending: true });

    // Filter menu items by category if requested
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

/**
 * ----------------------------------------------------------------------------
 * 2. GET /api/menu/special (Public Access)
 * ----------------------------------------------------------------------------
 * Purpose: Fetches the item marked as Today's Special for hero banner display.
 */
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

/**
 * ----------------------------------------------------------------------------
 * 3. POST /api/menu (Admin Only)
 * ----------------------------------------------------------------------------
 * Purpose: Adds a new menu item to the database.
 */
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

/**
 * ----------------------------------------------------------------------------
 * 4. PUT /api/menu/:id (Admin Only)
 * ----------------------------------------------------------------------------
 * Purpose: Edits an existing menu item (price, stock availability, category, image).
 * Fallback: Creates the item if it does not exist (upsert behavior).
 */
router.put("/:id", requireAdmin, async (req, res) => {
  try {
    const rawId = req.params.id;
    const targetId = isNaN(rawId) ? rawId : Number(rawId);

    // Primary update query by numeric ID
    let { data, error } = await supabase
      .from("menu_items")
      .update(req.body)
      .eq("id", targetId)
      .select();

    if (error) throw error;

    // Retry update query by string ID if initial match yielded no rows
    if (!data || data.length === 0) {
      let { data: retryData, error: retryErr } = await supabase
        .from("menu_items")
        .update(req.body)
        .eq("id", rawId)
        .select();

      if (retryErr) throw retryErr;
      data = retryData;
    }

    // Auto-create item payload if item wasn't existing
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

/**
 * ----------------------------------------------------------------------------
 * 5. DELETE /api/menu/:id (Admin Only)
 * ----------------------------------------------------------------------------
 * Purpose: Removes a menu item from the database.
 */
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