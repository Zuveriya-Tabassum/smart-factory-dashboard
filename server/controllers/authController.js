// Module: authController
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require('../models/User') // FIX: default export, not destructured
const Log = require('../models/Log')

exports.register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password) return res.status(400).json({ error: "Missing fields" });

    const exists = await User.findOne({ where: { email } });
    if (exists) return res.status(409).json({ error: "Email already registered" });

    const passwordHash = await bcrypt.hash(password, 10);
    const normalizedRole = role && ["Admin", "Engineer", "Viewer"].includes(role) ? role : "Viewer";
    const isAdmin = normalizedRole === "Admin";
    const user = await User.create({
      name,
      email,
      passwordHash,
      role: normalizedRole,
      approved: isAdmin ? true : false, // Admin auto-approved
    });

    if (isAdmin) {
      const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET || "devsecret", {
        expiresIn: "7d",
      });
      return res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
    }

    // Non-admin registrations require approval
    res.json({
      message: "Registration submitted. Awaiting admin approval.",
      user: { id: user.id, name: user.name, email: user.email, role: user.role, approved: user.approved },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Registration failed" });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: "Missing fields" });

    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(401).json({ error: "Invalid credentials" });

    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) return res.status(401).json({ error: "Invalid credentials" });

    // Admin can always log in; non-admin must be approved
    if (user.role !== "Admin" && !user.approved) {
      return res.status(403).json({ error: "Account pending approval by admin" });
    }

    const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET || "devsecret", {
      expiresIn: "7d",
    });

    res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Login failed" });
  }
};

exports.pending = async (req, res) => {
  try {
    const pendingUsers = await User.findAll({
      where: { approved: false },
      attributes: ["id", "name", "email", "role", "createdAt"],
      order: [["createdAt", "ASC"]],
    });
    res.json(pendingUsers);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch pending users" });
  }
};

exports.approve = async (req, res) => {
  try {
    const id = req.params.id;
    const user = await User.findByPk(id);
    if (!user) return res.status(404).json({ error: "User not found" });
    user.approved = true;
    await user.save();
    res.json({ message: "User approved", user: { id: user.id, name: user.name, email: user.email, role: user.role, approved: user.approved } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to approve user" });
  }
};

exports.counts = async (req, res) => {
  try {
    const viewerCount = await User.count({ where: { role: "Viewer", approved: true } });
    const engineerCount = await User.count({ where: { role: "Engineer", approved: true } });
    const adminCount = await User.count({ where: { role: "Admin", approved: true } });
    res.json({ viewerCount, engineerCount, adminCount });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch counts" });
  }
};

// NEW: List approved users by role (Admin only)
exports.users = async (req, res) => {
  try {
    const { role } = req.query;
    const where = { approved: true };
    const allowedRoles = ["Admin", "Engineer", "Viewer"];
    if (role && allowedRoles.includes(role)) {
      where.role = role;
    }
    const users = await User.findAll({
      where,
      // Include 'active' so the UI knows whether to show Suspend or Reactivate
      attributes: ["id", "name", "email", "role", "approved", "active", "createdAt"],
      order: [["createdAt", "ASC"]],
    });
    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch users" });
  }
};

// NEW: Reject a pending user (delete record or mark as rejected)
exports.rejectUser = async (req, res) => {
  try {
    const { id } = req.params
    const user = await User.findByPk(id)
    if (!user) return res.status(404).json({ message: 'User not found' })
    if (user.approved) {
      return res.status(400).json({ message: 'Cannot reject an already approved user' })
    }
    await user.destroy()
    return res.json({ message: 'User rejected' })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ message: 'Server error' })
  }
}

// NEW: Update user role
// Module: authController
exports.updateUserRole = async (req, res) => {
  try {
    const { id } = req.params
    const { role } = req.body
    if (!['Admin', 'Engineer', 'Viewer'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role' })
    }
    const user = await User.findByPk(id)
    if (!user) return res.status(404).json({ message: 'User not found' })
    user.role = role
    await user.save()
    await Log.create({ userId: req.user.id, machineId: null, action: "RoleChange", timestamp: new Date(), details: `userId=${id}, role=${role}` })
    return res.json({ message: 'Role updated', user })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ message: 'Server error' })
  }
}

// NEW: Suspend user (Admin)
exports.suspendUser = async (req, res) => {
  try {
    const { id } = req.params
    // Prevent self-suspension to avoid locking out the current admin session
    if (String(req.user.id) === String(id)) {
      return res.status(400).json({ message: 'Cannot suspend your own account' })
    }
    const user = await User.findByPk(id)
    if (!user) return res.status(404).json({ message: 'User not found' })
    if (!user.active) {
      return res.status(400).json({ message: 'User is already inactive' })
    }
    user.active = false
    await user.save()
    await Log.create({ userId: req.user.id, machineId: null, action: "SuspendUser", timestamp: new Date(), details: `userId=${id}` })
    return res.json({ message: 'User suspended', user })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ message: 'Server error' })
  }
}

// NEW: Reactivate user (Admin)
exports.reactivateUser = async (req, res) => {
  try {
    const { id } = req.params
    const user = await User.findByPk(id)
    if (!user) return res.status(404).json({ message: 'User not found' })
    if (user.active) {
      return res.status(400).json({ message: 'User is already active' })
    }
    user.active = true
    await user.save()
    await Log.create({ userId: req.user.id, machineId: null, action: "ReactivateUser", timestamp: new Date(), details: `userId=${id}` })
    return res.json({ message: 'User reactivated', user })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ message: 'Server error' })
  }
}