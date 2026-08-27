/**
 * ============================================================================
 * VIJAYKUMAR'S MUTTA BONDA SHOP — EXPRESS SERVER ENTRY POINT
 * ============================================================================
 * Description: Main server application file configuring Express middlewares,
 *              API routes, static handlers, health endpoints, and database seeding.
 * ============================================================================
 */

// Load environment variables from .env file
require("dotenv").config();

// Import core dependencies
const express = require("express");
const cors = require("cors");

// Import modular API route handlers
const authRoutes = require("./routes/authRoutes");
const menuRoutes = require("./routes/menuRoutes");
const orderRoutes = require("./routes/orderRoutes");
const feedbackRoutes = require("./routes/feedbackRoutes");
const contactRoutes = require("./routes/contactRoutes");

// Initialize Express application instance
const app = express();

/* -------------------------------------------------------------------------- */
/*                           GLOBAL MIDDLEWARES                               */
/* -------------------------------------------------------------------------- */

// Enable Cross-Origin Resource Sharing (CORS) for client applications
app.use(cors({ origin: process.env.CLIENT_ORIGIN || "*" }));

// Parse incoming request body as JSON (up to 50mb for base64 images)
app.use(express.json({ limit: "50mb" }));

// Parse URL-encoded body data from HTML form submissions
app.use(express.urlencoded({ limit: "50mb", extended: true }));

/* -------------------------------------------------------------------------- */
/*                           PUBLIC HEALTH & INDEX ENDPOINTS                  */
/* -------------------------------------------------------------------------- */

// Root endpoint — returns general API status and available endpoint URLs
app.get("/", (req, res) => res.json({
  message: "Mutta Bonda Shop API is running successfully!",
  health: "/api/health",
  endpoints: ["/api/menu", "/api/orders", "/api/feedback", "/api/contact", "/api/auth"]
}));

// Health check endpoint — used by monitoring tools (Render/Vercel) to check server status
app.get("/api/health", (req, res) => res.json({ status: "ok", service: "mutta-bonda-shop-api" }));

/* -------------------------------------------------------------------------- */
/*                           API ROUTE MODULE MOUNTING                        */
/* -------------------------------------------------------------------------- */

// Authentication routes (Admin login & token generation)
app.use("/api/auth", authRoutes);

// Menu item routes (List, Add, Update, Delete menu items)
app.use("/api/menu", menuRoutes);

// Order processing routes (Customer order placement, Admin status updates & sales stats)
app.use("/api/orders", orderRoutes);

// Customer feedback routes (Submit reviews & Admin CSV export)
app.use("/api/feedback", feedbackRoutes);

// Contact form routes (General inquiries & messages)
app.use("/api/contact", contactRoutes);

/* -------------------------------------------------------------------------- */
/*                           ERROR HANDLING MIDDLEWARES                       */
/* -------------------------------------------------------------------------- */

// 404 Route Not Found Handler — catches all unmatched route requests
app.use((req, res) => res.status(404).json({ message: "Route not found." }));

// Centralized Error Handler — catches all unhandled server errors
app.use((err, req, res, next) => {
  console.error("Server Error:", err);
  res.status(err.status || 500).json({ message: err.message || "Something went wrong on the server." });
});

/* -------------------------------------------------------------------------- */
/*                           SERVER INITIALIZATION                            */
/* -------------------------------------------------------------------------- */

// Define server port from environment variable or default to 5000
const PORT = process.env.PORT || 5000;

// Start listening for incoming network requests
app.listen(PORT, async () => {
  console.log(`🚀 Mutta Bonda Shop API server running on port ${PORT}`);
  
  // Auto-seed initial database data (admin account & menu items) if database is empty
  const { autoSeed } = require("./seed");
  await autoSeed();
});



