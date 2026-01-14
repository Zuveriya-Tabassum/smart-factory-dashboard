// Module: server bootstrap

const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const sequelize = require("./config/db");
const machineRoutes = require("./routes/machineRoutes");
const authRoutes = require("./routes/authRoutes");
const alertRoutes = require("./routes/alertRoutes");
const logRoutes = require("./routes/logRoutes");
const net = require("net"); // helper to probe ports
require("dotenv").config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

app.use(cors());
app.use(express.json());

// Associations
const User = require("./models/User");
const Machine = require("./models/Machine");
const Log = require("./models/Log");
const Alert = require("./models/Alert");

Log.belongsTo(User, { foreignKey: "userId" });
Log.belongsTo(Machine, { foreignKey: "machineId", onDelete: "SET NULL", onUpdate: "CASCADE" });
Alert.belongsTo(Machine, { foreignKey: "machineId" });

// Routes
app.use("/api/machines", machineRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/alerts", alertRoutes);
app.use("/api/logs", logRoutes);
const analyticsRoutes = require("./routes/analyticsRoutes");
app.use("/api/analytics", analyticsRoutes);

// Helpers: check if a port is free and find a free one starting from base
function isPortFree(port) {
  return new Promise((resolve) => {
    const tester = net
      .createServer()
      .once("error", () => resolve(false))
      .once("listening", () => tester.close(() => resolve(true)))
      .listen(port, "0.0.0.0");
  });
}

// Pre-sync fix: ensure logs.machineId is NULLable by dropping existing FKs and altering the column
async function ensureLogsMachineIdNullable() {
  try {
    if (sequelize.getDialect() !== "mysql") return;

    const dbName = process.env.DB_NAME || "industrial_db";

    // Find existing foreign key constraints on logs.machineId
    const [rows] = await sequelize.query(
      `
      SELECT CONSTRAINT_NAME
      FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
      WHERE TABLE_SCHEMA = :db
        AND TABLE_NAME = 'logs'
        AND COLUMN_NAME = 'machineId'
        AND REFERENCED_TABLE_NAME IS NOT NULL
      `,
      { replacements: { db: dbName } }
    );

    // Drop each FK constraint found
    for (const row of rows) {
      const constraint = row.CONSTRAINT_NAME;
      try {
        await sequelize.query(`ALTER TABLE \`logs\` DROP FOREIGN KEY \`${constraint}\`;`);
        console.log(`Dropped FK ${constraint} on logs.machineId`);
      } catch (e) {
        console.warn(`Failed to drop FK ${constraint}:`, e.message);
      }
    }

    // Alter column to allow NULL
    await sequelize.query(`ALTER TABLE \`logs\` MODIFY \`machineId\` INT NULL;`);
    console.log("Altered logs.machineId to allow NULL");
  } catch (e) {
    console.warn("ensureLogsMachineIdNullable failed:", e.message);
  }
}

// Replace the original sync + listen with a safe start that finds a free port
(async () => {
  try {
    await sequelize.authenticate();
    console.log("DB connection established");

    // Run pre-sync migration to fix logs.machineId before Sequelize attempts to add FKs
    await ensureLogsMachineIdNullable();

    await sequelize.sync({ alter: true }); // apply model changes + FKs safely
    console.log("DB synced");

    const basePort = Number(process.env.PORT) || 5001;
    // Force fixed port to avoid client/server mismatch
    const chosenPort = basePort;
    const free = await isPortFree(chosenPort);
    if (!free) {
      throw new Error(`Port ${chosenPort} is in use. Free it or set PORT to a free port, and update client VITE_API_URL accordingly.`);
    }
    server.listen(chosenPort, "0.0.0.0", () => {
      console.log(`Server running on port ${chosenPort}`);
    });
  } catch (err) {
    console.error("Startup failed:", err.message);
    console.error(err);
    process.exit(1);
  }
})();

// Socket.io simulated live data
io.on("connection", (socket)=>{
  console.log("Client connected");

  setInterval(async ()=>{
    const machines = await Machine.findAll();
    machines.forEach(m=>{
      m.temperature += (Math.random()-0.5)*2;
      m.efficiency = Math.max(50, Math.min(100, m.efficiency + (Math.random()-0.5)*2));
      m.cycleTime += 1;
      m.save();
    });
    io.emit("machine_update", machines);
  }, 3000);
});

// Emit metrics_update periodically
setInterval(async () => {
  try {
    const machines = await Machine.findAll()
    const alerts = await Alert.findAll({ where: { resolved: false } })
    const active = machines.filter(m => m.status === "Active").length
    const avgEfficiency = machines.length ? machines.reduce((s, m) => s + (m.efficiency || 0), 0) / machines.length : 0
    const overheatCount = alerts.filter(a => a.type === "Overheat").length
    const criticalCount = alerts.filter(a => a.severity === "High").length
    io.emit("metrics_update", { active, avgEfficiency, overheatCount, criticalCount, totalMachines: machines.length })
  } catch (e) {
    console.error("metrics_update failed", e)
  }
}, 3000);
