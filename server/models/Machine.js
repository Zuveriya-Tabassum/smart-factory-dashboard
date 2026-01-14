// Machine model
const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Machine = sequelize.define(
  "Machine",
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    name: { type: DataTypes.STRING, allowNull: false },
    type: { type: DataTypes.STRING, allowNull: false },
    status: { type: DataTypes.ENUM("Active", "Idle", "Error"), defaultValue: "Idle" },
    temperature: { type: DataTypes.FLOAT, defaultValue: 25 },
    efficiency: { type: DataTypes.FLOAT, defaultValue: 90 },
    cycleTime: { type: DataTypes.INTEGER, defaultValue: 0 },
    lastMaintenanceDate: { type: DataTypes.DATE, allowNull: true },
    mode: { type: DataTypes.ENUM("Auto", "Manual"), defaultValue: "Auto" },
    currentJob: { type: DataTypes.STRING, allowNull: true },
    maxTemperature: { type: DataTypes.FLOAT, defaultValue: 80 },
    minEfficiency: { type: DataTypes.FLOAT, defaultValue: 60 },
    maxTemperature: { type: DataTypes.FLOAT, defaultValue: 80 },
    minEfficiency: { type: DataTypes.FLOAT, defaultValue: 60 },
    // Maintenance controls
    underMaintenance: { type: DataTypes.BOOLEAN, defaultValue: false },
    maintenanceReason: { type: DataTypes.STRING, allowNull: true },
    maintenanceStart: { type: DataTypes.DATE, allowNull: true },
    maintenanceEnd: { type: DataTypes.DATE, allowNull: true },
    // Assignment
    assignedEngineerId: { type: DataTypes.INTEGER, allowNull: true },
  },
  { tableName: "machines", timestamps: true }
);

module.exports = Machine;