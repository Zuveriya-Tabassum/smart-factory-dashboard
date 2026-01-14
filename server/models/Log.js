// Log model
const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Log = sequelize.define(
  "Log",
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    userId: { type: DataTypes.INTEGER, allowNull: true },
    // Make machineId nullable so user-only actions can log without a machine
    machineId: { type: DataTypes.INTEGER, allowNull: true },
    action: {
      type: DataTypes.ENUM(
        "Start",
        "Stop",
        "Reset",
        "AssignJob",
        "SetMode",
        "UpdateThresholds",
        "EmergencyShutdown",
        "SetMaintenance",
        "ClearMaintenance",
        "AcknowledgeAlert",
        "ResolveAlert",
        "RoleChange",
        "SuspendUser",
        "ReactivateUser"
      ),
      allowNull: false
    },
    timestamp: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    details: { type: DataTypes.STRING, allowNull: true },
  },
  { tableName: "logs", timestamps: false }
);

module.exports = Log;