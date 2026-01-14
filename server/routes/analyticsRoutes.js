// Analytics routes
const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const allowRoles = require("../middleware/role.middleware");
const Machine = require("../models/Machine");
const Alert = require("../models/Alert");

router.get("/summary", auth, allowRoles("Admin", "Engineer", "Viewer"), async (req, res) => {
  try {
    const machines = await Machine.findAll()
    const alerts = await Alert.findAll({ where: { resolved: false } })
    const active = machines.filter(m => m.status === "Active").length
    const avgEfficiency = machines.length ? machines.reduce((s, m) => s + (m.efficiency || 0), 0) / machines.length : 0
    const overheatCount = alerts.filter(a => a.type === "Overheat").length
    const criticalCount = alerts.filter(a => a.severity === "High").length

    res.json({ active, avgEfficiency, overheatCount, criticalCount, totalMachines: machines.length })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: "Failed to compute analytics" })
  }
})

module.exports = router