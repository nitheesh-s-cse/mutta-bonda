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

    let { data: admins, error } = await supabase
      .from("admin_users")
      .select("*")
      .eq("email", email.toLowerCase());

    if (error) {
      console.error("Supabase admin_users query error:", error);
      return res.status(500).json({ message: `Database query error: ${error.message}` });
    }

    // If no admin user found, check if database table has 0 admins and auto-create default admin
    if (!admins || admins.length === 0) {
      const { data: allAdmins } = await supabase.from("admin_users").select("id").limit(1);
      if (!allAdmins || allAdmins.length === 0) {
        console.log("No admins found in database. Auto-creating default admin user...");
        const defaultEmail = (process.env.ADMIN_EMAIL || "owner@example.com").toLowerCase();
        const defaultPass = process.env.ADMIN_PASSWORD || "changeme123";
        const password_hash = await bcrypt.hash(defaultPass, 10);
        
        await supabase.from("admin_users").insert([{ email: defaultEmail, password_hash }]);

        const { data: createdAdmins } = await supabase
          .from("admin_users")
          .select("*")
          .eq("email", email.toLowerCase());
        
        admins = createdAdmins || [];
      }
    }

    if (!admins || admins.length === 0) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    const admin = admins[0];
    const isMatch = await bcrypt.compare(password, admin.password_hash);
    if (!isMatch) return res.status(401).json({ message: "Invalid email or password." });

    const jwtSecret = process.env.JWT_SECRET || "mutta-bonda-secret-key-123";
    const token = jwt.sign(
      { id: admin.id, email: admin.email, name: admin.name || "Admin" },
      jwtSecret,
      { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
    );

    res.json({ token, admin: { email: admin.email, name: admin.name || "Admin" } });
  } catch (err) {
    console.error("Login catch error:", err);
    res.status(500).json({ message: err.message || "Login failed." });
  }
});


module.exports = router;