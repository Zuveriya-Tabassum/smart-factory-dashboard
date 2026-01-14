// Machine routes
const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const allowRoles = require("../middleware/role.middleware");
const machineController = require("../controllers/machineController");

// Public: list machines
router.get("/", machineController.list);
router.get("/:id", machineController.getOne);

// NEW: CRUD (Admin)
router.post("/", auth, allowRoles("Admin"), machineController.create);
router.put("/:id", auth, allowRoles("Admin"), machineController.update);
router.delete("/:id", auth, allowRoles("Admin"), machineController.remove);

// Seed demo machines (Admin only)
router.post("/seed", auth, allowRoles("Admin"), machineController.seed);

// Controls (Admin, Engineer)
router.post("/:id/start", auth, allowRoles("Admin", "Engineer"), machineController.start);
router.post("/:id/stop", auth, allowRoles("Admin", "Engineer"), machineController.stop);
router.post("/:id/reset", auth, allowRoles("Admin", "Engineer"), machineController.reset);

// NEW: Assign job/task (Admin, Engineer)
router.post("/:id/assign", auth, allowRoles("Admin", "Engineer"), machineController.assignJob);

// NEW: Assign engineer (Admin)
router.post("/:id/assign-engineer", auth, allowRoles("Admin"), machineController.assignEngineer);

// NEW: Set mode (Admin, Engineer)
router.post("/:id/mode", auth, allowRoles("Admin", "Engineer"), machineController.setMode);

// NEW: Emergency shutdown (Admin only)
router.post("/emergency/shutdown", auth, allowRoles("Admin"), machineController.emergencyShutdown);

// NEW: Update thresholds (Admin only)
router.post("/:id/thresholds", auth, allowRoles("Admin"), machineController.updateThresholds);

// NEW: Maintenance controls (Admin, Engineer)
router.post("/:id/maintenance/start", auth, allowRoles("Admin", "Engineer"), machineController.startMaintenance);
router.post("/:id/maintenance/clear", auth, allowRoles("Admin", "Engineer"), machineController.clearMaintenance);

module.exports = router;