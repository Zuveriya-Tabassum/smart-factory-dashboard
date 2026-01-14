// User model
const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const User = sequelize.define(
  "User",
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    name: { type: DataTypes.STRING, allowNull: false },
    email: { type: DataTypes.STRING, allowNull: false, unique: true, validate: { isEmail: true } },
    passwordHash: { type: DataTypes.STRING, allowNull: false },
    role: { type: DataTypes.ENUM("Admin", "Engineer", "Viewer"), defaultValue: "Viewer" },
    approved: { type: DataTypes.BOOLEAN, defaultValue: false }, // require admin approval for non-admin
    active: { type: DataTypes.BOOLEAN, defaultValue: true },
  },
  { tableName: "users", timestamps: true }
);

module.exports = User;