require("dotenv").config();
const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/authRoutes");
const menuRoutes = require("./routes/menuRoutes");
const orderRoutes = require("./routes/orderRoutes");
const feedbackRoutes = require("./routes/feedbackRoutes");
const contactRoutes = require("./routes/contactRoutes");

const app = express();

app.use(cors({ origin: process.env.CLIENT_ORIGIN || "*" }));
app.use(express.json());

app.get("/", (req, res) => res.json({
  message: "Mutta Bonda Shop API is running successfully!",
  health: "/api/health",
  endpoints: ["/api/menu", "/api/orders", "/api/feedback", "/api/contact", "/api/auth"]
}));

app.get("/api/health", (req, res) => res.json({ status: "ok", service: "mutta-bonda-shop-api" }));

app.use("/api/auth", authRoutes);
app.use("/api/menu", menuRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/feedback", feedbackRoutes);
app.use("/api/contact", contactRoutes);

// 404 handler
app.use((req, res) => res.status(404).json({ message: "Route not found." }));

// Central error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ message: err.message || "Something went wrong on the server." });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Mutta Bonda Shop API running on port ${PORT}`));

