const express = require("express");
const supabase = require("../config/supabase");
const { requireAdmin } = require("../middleware/auth");

const router = express.Router();

// POST /api/orders — public: customer places an order
router.post("/", async (req, res) => {
  try {
    const body = req.body;
    const payload = {
      customer_name: body.customer_name || body.customerName || "Customer",
      phone: body.phone || "",
      address: body.address || "",
      payment_method: body.payment_method || body.paymentMethod || "Cash",
      items: body.items || [],
      subtotal: body.subtotal || 0,
      delivery: body.delivery || 0,
      discount: body.discount || 0,
      total: body.total || 0,
      status: body.status || "Pending"
    };

    const { data, error } = await supabase
      .from("orders")
      .insert([payload])
      .select();

    if (error) {
      console.error("Supabase order insert error:", error);
      throw error;
    }
    res.status(201).json(data[0]);
  } catch (err) {
    res.status(400).json({ message: "Could not place order.", error: err.message });
  }
});


// GET /api/orders — admin only: list orders (optional ?status=&search=)
router.get("/", requireAdmin, async (req, res) => {
  try {
    let query = supabase.from("orders").select("*").order("created_at", { ascending: false });

    if (req.query.status) {
      query = query.eq("status", req.query.status);
    }
    if (req.query.search) {
      query = query.or(`customer_name.ilike.%${req.query.search}%,phone.ilike.%${req.query.search}%`);
    }

    const { data, error } = await query;
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: "Could not load orders.", error: err.message });
  }
});

// GET /api/orders/stats — admin only: sales analytics
router.get("/stats", requireAdmin, async (req, res) => {
  try {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

    const { data: allOrders, error } = await supabase
      .from("orders")
      .select("*");

    if (error) throw error;

    const dailyOrders = allOrders.filter((o) => new Date(o.created_at) >= startOfDay);
    const monthlyOrders = allOrders.filter((o) => new Date(o.created_at) >= startOfMonth);

    const sum = (orders) => orders.reduce((total, o) => total + (o.total || 0), 0);

    const itemCounts = {};
    allOrders.forEach((order) => {
      let itemsArr = [];
      try {
        itemsArr = Array.isArray(order.items)
          ? order.items
          : (typeof order.items === "string" ? JSON.parse(order.items) : []);
      } catch (e) {
        itemsArr = [];
      }
      itemsArr.forEach((item) => {
        if (item && item.name) {
          itemCounts[item.name] = (itemCounts[item.name] || 0) + (Number(item.qty || item.quantity) || 1);
        }
      });
    });
    const topItem = Object.entries(itemCounts).sort((a, b) => b[1] - a[1])[0];


    res.json({
      dailySales: sum(dailyOrders),
      dailyOrderCount: dailyOrders.length,
      monthlySales: sum(monthlyOrders),
      monthlyOrderCount: monthlyOrders.length,
      totalRevenue: sum(allOrders),
      totalOrders: allOrders.length,
      topSellingItem: topItem ? { name: topItem[0], quantitySold: topItem[1] } : null,
    });
  } catch (err) {
    res.status(500).json({ message: "Could not compute stats.", error: err.message });
  }
});

// PUT /api/orders/:id/status — admin only: accept / reject / preparing / delivered
router.put("/:id/status", requireAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    const allowed = ["Pending", "Accepted", "Preparing", "Delivered", "Rejected"];
    if (!allowed.includes(status)) {
      return res.status(400).json({ message: `Status must be one of: ${allowed.join(", ")}` });
    }

    const { data, error } = await supabase
      .from("orders")
      .update({ status })
      .eq("id", req.params.id)
      .select();

    if (error) throw error;
    if (!data || data.length === 0) return res.status(404).json({ message: "Order not found." });
    res.json(data[0]);
  } catch (err) {
    res.status(500).json({ message: "Could not update order status.", error: err.message });
  }
});

// DELETE /api/orders/:id — admin only: delete single order
router.delete("/:id", requireAdmin, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("orders")
      .delete()
      .eq("id", req.params.id)
      .select();

    if (error) throw error;
    res.json({ message: "Order deleted successfully." });
  } catch (err) {
    res.status(500).json({ message: "Could not delete order.", error: err.message });
  }
});

// DELETE /api/orders — admin only: clear all orders
router.delete("/", requireAdmin, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("orders")
      .delete()
      .neq("id", 0);

    if (error) throw error;
    res.json({ message: "All orders cleared successfully." });
  } catch (err) {
    res.status(500).json({ message: "Could not clear orders.", error: err.message });
  }
});

module.exports = router;