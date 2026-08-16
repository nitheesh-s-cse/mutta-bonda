const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const supabase = require("../config/supabase");

const router = express.Router();

// POST /api/auth/login — admin login, returns a JWT
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required." });
    }

    const { data: admins, error } = await supabase
      .from("admin_users")
      .select("*")
      .eq("email", email.toLowerCase());

    if (error) throw error;
    if (!admins || admins.length === 0) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    const admin = admins[0];
    const isMatch = await bcrypt.compare(password, admin.password_hash);
    if (!isMatch) return res.status(401).json({ message: "Invalid email or password." });

    const token = jwt.sign(
      { id: admin.id, email: admin.email, name: admin.name || "Admin" },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
    );

    res.json({ token, admin: { email: admin.email, name: admin.name || "Admin" } });
  } catch (err) {
    res.status(500).json({ message: "Login failed.", error: err.message });
  }
});

module.exports = router;