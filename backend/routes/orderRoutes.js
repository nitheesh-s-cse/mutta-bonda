const express = require("express");
const Order = require("../models/Order");
const { requireAdmin } = require("../middleware/auth");

const router = express.Router();

// POST /api/orders — public: customer places an order
router.post("/", async (req, res) => {
  try {
    const order = await Order.create(req.body);
    res.status(201).json(order);
  } catch (err) {
    res.status(400).json({ message: "Could not place order.", error: err.message });
  }
});

// GET /api/orders — admin only: list orders (optional ?status=&search=)
router.get("/", requireAdmin, async (req, res) => {
  try {
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.search) {
      filter.$or = [
        { customerName: new RegExp(req.query.search, "i") },
        { phone: new RegExp(req.query.search, "i") },
      ];
    }
    const orders = await Order.find(filter).sort({ createdAt: -1 });
    res.json(orders);
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

    const [dailyOrders, monthlyOrders, allOrders] = await Promise.all([
      Order.find({ createdAt: { $gte: startOfDay } }),
      Order.find({ createdAt: { $gte: startOfMonth } }),
      Order.find({}),
    ]);

    const sum = (orders) => orders.reduce((total, o) => total + o.total, 0);

    const itemCounts = {};
    allOrders.forEach((order) => {
      order.items.forEach((item) => {
        itemCounts[item.name] = (itemCounts[item.name] || 0) + item.qty;
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
    const order = await Order.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!order) return res.status(404).json({ message: "Order not found." });
    res.json(order);
  } catch (err) {
    res.status(500).json({ message: "Could not update order status.", error: err.message });
  }
});

module.exports = router;
