const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const allowRoles = require("../middleware/role.middleware");
const Log = require("../models/Log");
const User = require("../models/User");
const Machine = require("../models/Machine");
const { Op } = require("sequelize");

// Logs: Admin only, with pagination and optional filters
router.get("/", auth, allowRoles("Admin"), async (req, res) => {
  try {
    const page = Number(req.query.page || 1);
    const limit = Number(req.query.limit || 20);
    const offset = (page - 1) * limit;

    const where = {};
    if (req.query.machineId) where.machineId = Number(req.query.machineId);
    if (req.query.from || req.query.to) {
      where.timestamp = {};
      if (req.query.from) where.timestamp[Op.gte] = new Date(req.query.from);
      if (req.query.to) where.timestamp[Op.lte] = new Date(req.query.to);
    }

    const { rows, count } = await Log.findAndCountAll({
      where,
      limit,
      offset,
      order: [["timestamp", "DESC"]],
      include: [
        { model: User, attributes: ["id", "name", "email", "role"] },
        { model: Machine, attributes: ["id", "name", "type"] },
      ],
    });

    res.json({
      total: count,
      page,
      limit,
      data: rows,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch logs" });
  }
});

// NEW: Export logs as CSV (Admin)
router.get("/export", auth, allowRoles("Admin"), async (req, res) => {
  try {
    const where = {};
    if (req.query.machineId) where.machineId = Number(req.query.machineId);
    if (req.query.from || req.query.to) {
      where.timestamp = {};
      if (req.query.from) where.timestamp[Op.gte] = new Date(req.query.from);
      if (req.query.to) where.timestamp[Op.lte] = new Date(req.query.to);
    }

    const rows = await Log.findAll({
      where,
      order: [["timestamp", "DESC"]],
      include: [
        { model: User, attributes: ["id", "name", "role"] },
        { model: Machine, attributes: ["id", "name", "type"] },
      ],
    });

    const header = ["timestamp", "user", "role", "machine", "type", "action", "details"].join(",");
    const lines = rows.map(r => {
      const ts = new Date(r.timestamp).toISOString();
      const user = r.User ? r.User.name : "";
      const role = r.User ? r.User.role : "";
      const machine = r.Machine ? r.Machine.name : r.machineId;
      const type = r.Machine ? r.Machine.type : "";
      const action = r.action;
      const details = (r.details || "").replace(/[\r\n,]+/g, " ");
      return [ts, user, role, machine, type, action, details].join(",");
    });
    const csv = [header, ...lines].join("\n");

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", "attachment; filename=logs.csv");
    res.send(csv);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to export logs" });
  }
});

module.exports = router;