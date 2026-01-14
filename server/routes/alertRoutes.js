const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const allowRoles = require("../middleware/role.middleware");
const Alert = require("../models/Alert");
const Log = require("../models/Log");

// List alerts (All roles)
router.get("/", auth, async (req, res) => {
  try {
    const { machineId } = req.query;
    const where = machineId ? { machineId } : {};
    const alerts = await Alert.findAll({ where, order: [["id", "DESC"]] });
    res.json(alerts);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch alerts" });
  }
});

// Create manual alert (Admin)
router.post("/", auth, allowRoles("Admin"), async (req, res) => {
  try {
    const { machineId, type, severity, message } = req.body;
    if (!machineId || !type || !message) return res.status(400).json({ error: "Missing fields" });
    const alert = await Alert.create({
      machineId,
      type,
      severity: severity || "Low",
      message,
      resolved: false,
    });
    res.json(alert);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create alert" });
  }
});

// NEW: Acknowledge alert (Engineer, Admin)
router.post("/:id/acknowledge", auth, allowRoles("Engineer", "Admin"), async (req, res) => {
  try {
    const alert = await Alert.findByPk(req.params.id);
    if (!alert) return res.status(404).json({ error: "Alert not found" });
    if (alert.resolved) return res.status(400).json({ error: "Cannot acknowledge resolved alert" });
    const { note } = req.body;
    alert.acknowledged = true;
    alert.acknowledgedBy = req.user.id;
    alert.acknowledgedNote = note || null;
    await alert.save();
    await Log.create({ userId: req.user.id, machineId: alert.machineId, action: "AcknowledgeAlert", timestamp: new Date(), details: note || undefined });
    res.json(alert);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to acknowledge alert" });
  }
});

// Resolve alert (Admin)
router.post("/:id/resolve", auth, allowRoles("Admin"), async (req, res) => {
  try {
    const alert = await Alert.findByPk(req.params.id);
    if (!alert) return res.status(404).json({ error: "Alert not found" });
    alert.resolved = true;
    alert.resolvedBy = req.user.id;
    await alert.save();
    await Log.create({ userId: req.user.id, machineId: alert.machineId, action: "ResolveAlert", timestamp: new Date() });
    res.json(alert);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to resolve alert" });
  }
});

module.exports = router;