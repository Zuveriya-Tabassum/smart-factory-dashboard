// Auth middleware: JWT verification
const jwt = require("jsonwebtoken");
const User = require("../models/User");

module.exports = async function authMiddleware(req, res, next) {
  try {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;
    if (!token) return res.status(401).json({ error: "No token provided" });

    const payload = jwt.verify(token, process.env.JWT_SECRET || "devsecret");
    const user = await User.findByPk(payload.id);
    if (!user) return res.status(401).json({ error: "Invalid token user" });
    if (!user.active) return res.status(403).json({ error: "Account inactive" });

    req.user = { id: user.id, role: user.role, email: user.email };
    next();
  } catch (err) {
    console.error(err);
    res.status(401).json({ error: "Unauthorized" });
  }
};