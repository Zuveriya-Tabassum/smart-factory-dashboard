// Alert model
const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Alert = sequelize.define(
  "Alert",
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    machineId: { type: DataTypes.INTEGER, allowNull: false },
    type: { type: DataTypes.ENUM("Overheat", "LowEfficiency", "Error", "Predictive"), allowNull: false },
    severity: { type: DataTypes.ENUM("Low", "Medium", "High"), defaultValue: "Low" },
    message: { type: DataTypes.STRING, allowNull: false },
    resolved: { type: DataTypes.BOOLEAN, defaultValue: false },
    acknowledged: { type: DataTypes.BOOLEAN, defaultValue: false },
    acknowledgedBy: { type: DataTypes.INTEGER, allowNull: true },
    acknowledgedNote: { type: DataTypes.STRING, allowNull: true },
    resolvedBy: { type: DataTypes.INTEGER, allowNull: true },
  },
  { tableName: "alerts", timestamps: true }
);

module.exports = Alert;