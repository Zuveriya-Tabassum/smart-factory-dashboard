// PostgreSQL Sequelize config
const { Sequelize } = require("sequelize");

const dialect = process.env.DB_DIALECT || "mysql";
const defaultPort = dialect === "mysql" ? 3306 : 5432;

const sequelize = new Sequelize(
  process.env.DB_NAME || "industrial_db",
  process.env.DB_USER || "root",
  process.env.DB_PASSWORD || "root",
  {
    host: process.env.DB_HOST || "127.0.0.1",
    port: process.env.DB_PORT ? Number(process.env.DB_PORT) : defaultPort,
    dialect,
    logging: false,
    pool: { max: 5, min: 0, acquire: 30000, idle: 10000 },
  }
);

module.exports = sequelize;