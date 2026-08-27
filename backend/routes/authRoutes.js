/**
 * ============================================================================
 * AUTHENTICATION ROUTES MODULE (/api/auth)
 * ============================================================================
 * Description: Handles admin user login, password hashing verification,
 *              auto-creation of default admin accounts, and JWT token signing.
 * ============================================================================
 */

const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const supabase = require("../config/supabase");

const router = express.Router();

/**
 * ----------------------------------------------------------------------------
 * POST /api/auth/login (Public Access)
 * ----------------------------------------------------------------------------
 * Purpose: Authenticates admin credentials and returns a signed JWT token.
 * Payload: { "email": "...", "password": "..." }
 */
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Validate required form fields
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required." });
    }

    const targetEmail = email.trim().toLowerCase();

    // Query admin user record from database
    let { data: admins, error } = await supabase
      .from("admin_users")
      .select("*")
      .eq("email", targetEmail);

    if (error) {
      console.error("Supabase admin_users query error:", error);
      return res.status(500).json({ message: `Database query error: ${error.message}` });
    }

    // Default admin credential fallbacks from environment configuration
    const defaultEmail = (process.env.ADMIN_EMAIL || "nitheeshsmart4316@gmail.com").toLowerCase();
    const defaultPass = process.env.ADMIN_PASSWORD || "sollamaaten";

    // Auto-create default admin user if matching default email and user doesn't exist yet
    if ((!admins || admins.length === 0) && targetEmail === defaultEmail) {
      console.log(`Auto-creating default admin account for ${targetEmail}...`);
      const password_hash = await bcrypt.hash(defaultPass, 10);
      await supabase.from("admin_users").insert([{ email: defaultEmail, password_hash }]);

      const { data: createdAdmins } = await supabase
        .from("admin_users")
        .select("*")
        .eq("email", targetEmail);

      admins = createdAdmins || [];
    }

    // Reject authentication if no admin matches
    if (!admins || admins.length === 0) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    const admin = admins[0];
    
    // Compare provided password with stored bcrypt password hash
    let isMatch = await bcrypt.compare(password, admin.password_hash);
    
    // Sync password hash if user logs in with new default environment password
    if (!isMatch && targetEmail === defaultEmail && password === defaultPass) {
      const password_hash = await bcrypt.hash(defaultPass, 10);
      await supabase.from("admin_users").update({ password_hash }).eq("id", admin.id);
      admin.password_hash = password_hash;
      isMatch = true;
    }

    if (!isMatch) return res.status(401).json({ message: "Invalid email or password." });

    // Generate signed JSON Web Token (JWT) with 7-day expiration
    const jwtSecret = process.env.JWT_SECRET || "mutta-bonda-secret-key-123";
    const token = jwt.sign(
      { id: admin.id, email: admin.email, name: admin.name || "Vijaykumar" },
      jwtSecret,
      { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
    );

    // Return token and admin profile info
    res.json({ token, admin: { email: admin.email, name: admin.name || "Vijaykumar" } });
  } catch (err) {
    console.error("Login catch error:", err);
    res.status(500).json({ message: err.message || "Login failed." });
  }
});

module.exports = router;