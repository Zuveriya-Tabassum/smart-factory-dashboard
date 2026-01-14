const Machine = require("../models/Machine");
const Log = require("../models/Log");
const Alert = require("../models/Alert");

exports.list = async (req, res) => {
  try {
    const machines = await Machine.findAll();
    res.json(machines);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch machines" });
  }
};

exports.getOne = async (req, res) => {
  try {
    const m = await Machine.findByPk(req.params.id);
    if (!m) return res.status(404).json({ error: "Machine not found" });
    res.json(m);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch machine" });
  }
};

exports.seed = async (req, res) => {
  try {
    const count = await Machine.count();
    if (count > 0) return res.json({ message: "Machines already exist" });

    const now = new Date();
    const created = await Machine.bulkCreate([
      { name: "Conveyor A1", type: "Conveyor", status: "Idle", temperature: 26.1, efficiency: 92.5, cycleTime: 0, lastMaintenanceDate: now, maxTemperature: 80, minEfficiency: 60 },
      { name: "Robot Arm R2", type: "Robot", status: "Idle", temperature: 28.3, efficiency: 88.0, cycleTime: 0, lastMaintenanceDate: now, maxTemperature: 80, minEfficiency: 60 },
      { name: "Press P7", type: "Press", status: "Idle", temperature: 24.7, efficiency: 85.0, cycleTime: 0, lastMaintenanceDate: now, maxTemperature: 80, minEfficiency: 60 },
    ]);
    res.json({ message: "Seeded machines", created });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to seed machines" });
  }
};

// Helper: write audit log with optional details
async function logAction(userId, machineId, action, details) {
  try {
    await Log.create({ userId, machineId, action, timestamp: new Date(), details });
  } catch (e) {
    console.error("Failed to log action", e);
  }
}

// Helper: check unresolved critical (High) alerts for a machine
async function hasCriticalUnresolvedAlert(machineId) {
  const count = await Alert.count({ where: { machineId, severity: "High", resolved: false } });
  return count > 0;
}

// AdminPanel component
// NEW: helper to enforce engineer ownership of machine operations
function ensureEngineerOwnership(req, machine) {
  // Admins have full access
  if (req.user?.role === "Admin") return null;
  // Engineers must be assigned to the machine
  if (req.user?.role === "Engineer") {
    if (!machine.assignedEngineerId) {
      return { error: "Machine is not assigned to you" };
    }
    if (machine.assignedEngineerId !== req.user.id) {
      return { error: "Machine is assigned to another engineer" };
    }
  }
  return null;
}

exports.start = async (req, res) => {
  try {
    const m = await Machine.findByPk(req.params.id);
    if (!m) return res.status(404).json({ error: "Machine not found" });
    const ownership = ensureEngineerOwnership(req, m);
    if (ownership) return res.status(403).json(ownership);
    if (m.underMaintenance) return res.status(409).json({ error: "Machine under maintenance" });
    if (await hasCriticalUnresolvedAlert(m.id)) return res.status(409).json({ error: "Critical alert unresolved" });
    m.status = "Active";
    await m.save();
    await logAction(req.user?.id || null, m.id, "Start");
    res.json(m);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to start machine" });
  }
};

exports.stop = async (req, res) => {
  try {
    const m = await Machine.findByPk(req.params.id);
    if (!m) return res.status(404).json({ error: "Machine not found" });
    const ownership = ensureEngineerOwnership(req, m);
    if (ownership) return res.status(403).json(ownership);
    if (m.underMaintenance) return res.status(409).json({ error: "Machine under maintenance" });
    m.status = "Idle";
    await m.save();
    await logAction(req.user?.id || null, m.id, "Stop");
    res.json(m);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to stop machine" });
  }
};

exports.reset = async (req, res) => {
  try {
    const m = await Machine.findByPk(req.params.id);
    if (!m) return res.status(404).json({ error: "Machine not found" });
    const ownership = ensureEngineerOwnership(req, m);
    if (ownership) return res.status(403).json(ownership);
    if (m.underMaintenance) return res.status(409).json({ error: "Machine under maintenance" });
    if (await hasCriticalUnresolvedAlert(m.id)) return res.status(409).json({ error: "Critical alert unresolved" });
    m.status = "Idle";
    m.cycleTime = 0;
    await m.save();
    await logAction(req.user?.id || null, m.id, "Reset");
    res.json(m);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to reset machine" });
  }
};

// NEW: assign job/task with checks
exports.assignJob = async (req, res) => {
  try {
    const m = await Machine.findByPk(req.params.id);
    if (!m) return res.status(404).json({ error: "Machine not found" });
    const ownership = ensureEngineerOwnership(req, m);
    if (ownership) return res.status(403).json(ownership);
    if (m.underMaintenance) return res.status(409).json({ error: "Machine under maintenance" });
    const { job } = req.body;
    if (!job) return res.status(400).json({ error: "Missing job" });
    m.currentJob = job;
    await m.save();
    await logAction(req.user?.id || null, m.id, "AssignJob");
    res.json(m);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to assign job" });
  }
};

// NEW: change mode (Auto/Manual) with logging
exports.setMode = async (req, res) => {
  try {
    const m = await Machine.findByPk(req.params.id);
    if (!m) return res.status(404).json({ error: "Machine not found" });
    const ownership = ensureEngineerOwnership(req, m);
    if (ownership) return res.status(403).json(ownership);
    if (m.underMaintenance) return res.status(409).json({ error: "Machine under maintenance" });
    const { mode } = req.body;
    if (!["Auto", "Manual"].includes(mode)) return res.status(400).json({ error: "Invalid mode" });
    m.mode = mode;
    await m.save();
    await logAction(req.user?.id || null, m.id, "SetMode", `mode=${mode}`);
    res.json(m);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to set mode" });
  }
};

// NEW: emergency shutdown (Admin) requires reason
exports.emergencyShutdown = async (req, res) => {
  try {
    const rawReason = req.body?.reason;
    const reason = typeof rawReason === 'string' ? rawReason.trim() : String(rawReason ?? '').trim();
    if (!reason) {
      return res.status(400).json({ error: "Shutdown reason is required" });
    }
    const machines = await Machine.findAll();
    for (const m of machines) {
      m.status = "Idle";
      m.currentJob = null;
      await m.save();
      await logAction(req.user?.id || null, m.id, "EmergencyShutdown", reason);
    }
    res.json({ message: "Emergency shutdown executed", count: machines.length });
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: "Emergency shutdown failed" })
  }
}

// NEW: update thresholds (Admin)
exports.updateThresholds = async (req, res) => {
  try {
    const m = await Machine.findByPk(req.params.id);
    if (!m) return res.status(404).json({ error: "Machine not found" });
    const { maxTemperature, minEfficiency } = req.body;

    const maxT = Number(maxTemperature);
    const minE = Number(minEfficiency);
    if (Number.isNaN(maxT) || Number.isNaN(minE)) {
      return res.status(400).json({ error: "Invalid thresholds" });
    }
    m.maxTemperature = maxT;
    m.minEfficiency = minE;
    await m.save();
    await logAction(req.user?.id || null, m.id, "UpdateThresholds", `maxT=${maxT}, minE=${minE}`);
    res.json(m);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update thresholds" });
  }
};

// NEW: start maintenance (Admin, Engineer)
exports.startMaintenance = async (req, res) => {
  try {
    const m = await Machine.findByPk(req.params.id);
    if (!m) return res.status(404).json({ error: "Machine not found" });

    const rawReason = req.body?.reason;
    const reason = typeof rawReason === 'string' ? rawReason.trim() : String(rawReason ?? '').trim();
    if (!reason) {
      return res.status(400).json({ error: "Maintenance reason is required" });
    }

    m.underMaintenance = true;
    m.maintenanceReason = reason;
    m.maintenanceStart = new Date();
    m.maintenanceEnd = null;
    await m.save();

    await logAction(req.user?.id || null, m.id, "SetMaintenance", reason);
    res.json(m);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to set maintenance" });
  }
}

// NEW: clear maintenance (Admin, Engineer)
exports.clearMaintenance = async (req, res) => {
  try {
    const m = await Machine.findByPk(req.params.id);
    if (!m) return res.status(404).json({ error: "Machine not found" });
    const ownership = ensureEngineerOwnership(req, m);
    if (ownership) return res.status(403).json(ownership);
    m.underMaintenance = false;
    m.maintenanceEnd = new Date();
    await m.save();
    await logAction(req.user?.id || null, m.id, "ClearMaintenance");
    res.json(m);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to clear maintenance" });
  }
};

// Create a machine (Admin)
exports.create = async (req, res) => {
  try {
    const { name, type } = req.body
    if (!name || !type) return res.status(400).json({ error: "Missing name or type" })
    const m = await Machine.create({
      name,
      type,
      status: "Idle",
      temperature: 25,
      efficiency: 90,
      cycleTime: 0,
      lastMaintenanceDate: null,
      mode: "Auto",
      maxTemperature: 80,
      minEfficiency: 60,
    })
    await logAction(req.user?.id || null, m.id, "UpdateThresholds", "create")
    res.json(m)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: "Failed to create machine" })
  }
}

// Update a machine (Admin)
exports.update = async (req, res) => {
  try {
    const m = await Machine.findByPk(req.params.id)
    if (!m) return res.status(404).json({ error: "Machine not found" })
    const { name, type } = req.body
    if (name) m.name = name
    if (type) m.type = type
    await m.save()
    await logAction(req.user?.id || null, m.id, "SetMode", "update_meta")
    res.json(m)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: "Failed to update machine" })
  }
}

// Delete a machine (Admin)
exports.remove = async (req, res) => {
  try {
    const m = await Machine.findByPk(req.params.id)
    if (!m) return res.status(404).json({ error: "Machine not found" })
    await m.destroy()
    res.json({ message: "Machine deleted" })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: "Failed to delete machine" })
  }
}

// Assign engineer to machine (Admin)
exports.assignEngineer = async (req, res) => {
  try {
    const m = await Machine.findByPk(req.params.id)
    if (!m) return res.status(404).json({ error: "Machine not found" })
    const { engineerId } = req.body
    if (!engineerId) return res.status(400).json({ error: "Missing engineerId" })
    m.assignedEngineerId = Number(engineerId)
    await m.save()
    await logAction(req.user?.id || null, m.id, "AssignJob", `engineerId=${engineerId}`)
    res.json(m)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: "Failed to assign engineer" })
  }
}