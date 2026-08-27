/**
 * ============================================================================
 * AUTHENTICATION MIDDLEWARE
 * ============================================================================
 * Description: Protects administrative routes by verifying JSON Web Tokens (JWT).
 * ============================================================================
 */

const jwt = require("jsonwebtoken");

/**
 * Express Middleware: requireAdmin
 * Checks for a valid Bearer JWT token in the Authorization request header.
 * Attaches decoded admin payload to `req.admin` if valid, otherwise returns 401 Unauthorized.
 */
function requireAdmin(req, res, next) {
  // Extract Authorization header (Format: "Bearer <token>")
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;

  // Return error if no token is provided
  if (!token) {
    return res.status(401).json({ message: "Missing or invalid authorization header." });
  }

  try {
    // Verify JWT token signature using environment secret or fallback key
    const secret = process.env.JWT_SECRET || "mutta-bonda-secret-key-123";
    const decoded = jwt.verify(token, secret);

    // Attach decoded token payload (admin info) to request object
    req.admin = decoded;
    next();
  } catch (err) {
    // Return unauthorized error if token is expired, tampered, or invalid
    return res.status(401).json({ message: "Session expired or token invalid. Please log in again." });
  }
}

module.exports = { requireAdmin };

