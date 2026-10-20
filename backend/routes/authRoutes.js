/**
 * ============================================================================
 * AUTHENTICATION ROUTES MODULE (/api/auth)
 * ============================================================================
 * Description: Handles admin user login, password hashing verification,
 *              auto-creation of default admin accounts, and JWT token signing.
 *              Includes resilient fallback for offline/paused database states.
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

    // Default admin credential fallbacks from environment configuration
    const defaultEmail = (process.env.ADMIN_EMAIL || "nitheeshsmart4316@gmail.com").toLowerCase();
    const defaultPass = process.env.ADMIN_PASSWORD || "sollamaaten";
    const jwtSecret = process.env.JWT_SECRET || "mutta-bonda-secret-key-123";

    // Query admin user record from database
    let admins = [];
    let dbError = null;

    try {
      const { data, error } = await supabase
        .from("admin_users")
        .select("*")
        .eq("email", targetEmail);

      if (error) {
        dbError = error;
      } else {
        admins = data || [];
      }
    } catch (err) {
      dbError = err;
    }

    // Auto-create default admin user in DB if matching default email and user doesn't exist yet
    if ((!admins || admins.length === 0) && targetEmail === defaultEmail && !dbError) {
      try {
        console.log(`Auto-creating default admin account for ${targetEmail}...`);
        const password_hash = await bcrypt.hash(defaultPass, 10);
        await supabase.from("admin_users").insert([{ email: defaultEmail, password_hash }]);

        const { data: createdAdmins } = await supabase
          .from("admin_users")
          .select("*")
          .eq("email", targetEmail);

        admins = createdAdmins || [];
      } catch (err) {
        console.warn("Could not auto-insert admin user:", err.message);
      }
    }

    // Check if matching admin was found in database
    if (admins && admins.length > 0) {
      const admin = admins[0];
      
      // Compare provided password with stored bcrypt password hash
      let isMatch = await bcrypt.compare(password, admin.password_hash);
      
      // Sync password hash if user logs in with new default environment password
      if (!isMatch && targetEmail === defaultEmail && password === defaultPass) {
        try {
          const password_hash = await bcrypt.hash(defaultPass, 10);
          await supabase.from("admin_users").update({ password_hash }).eq("id", admin.id);
          admin.password_hash = password_hash;
        } catch (e) {
          // Ignore sync error in offline mode
        }
        isMatch = true;
      }

      if (isMatch) {
        const token = jwt.sign(
          { id: admin.id, email: admin.email, name: admin.name || "Vijaykumar" },
          jwtSecret,
          { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
        );
        return res.json({ token, admin: { email: admin.email, name: admin.name || "Vijaykumar" } });
      }
    }

    // Fallback: If database is unreachable or user not found, verify directly against default credentials
    if (targetEmail === defaultEmail && password === defaultPass) {
      console.log("Direct default admin credential authentication match.");
      const token = jwt.sign(
        { id: 1, email: defaultEmail, name: "Vijaykumar" },
        jwtSecret,
        { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
      );
      return res.json({ token, admin: { email: defaultEmail, name: "Vijaykumar" } });
    }

    // If query failed with a real non-fallback error and credentials didn't match default
    if (dbError && targetEmail !== defaultEmail) {
      console.error("Database login query error:", dbError);
      return res.status(500).json({ message: `Database query error: ${dbError.message || dbError}` });
    }

    return res.status(401).json({ message: "Invalid email or password." });
  } catch (err) {
    console.error("Login catch error:", err);
    res.status(500).json({ message: err.message || "Login failed." });
  }
});

module.exports = router;