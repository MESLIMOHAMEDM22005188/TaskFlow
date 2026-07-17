require("dotenv").config();
const mysql = require("mysql2/promise");

let pool = null;

function getDatabaseConfig() {
    if (process.env.DATABASE_URL) {
        const databaseUrl = new URL(process.env.DATABASE_URL)
        return {
            host: databaseUrl.hostname,
            port: Number(databaseUrl.port || 3306),
            user: decodeURIComponent(databaseUrl.username),
            password: decodeURIComponent(databaseUrl.password),
            database: databaseUrl.pathname.replace(/^\//, ""),
        }
    }

    return {
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASS,
        database: process.env.DB_NAME,
        port: Number(process.env.DB_PORT || 3306),
    }
}

function getPool() {
    if (!pool) {
        pool = mysql.createPool({
            ...getDatabaseConfig(),
            waitForConnections: true,
            connectionLimit: Number(process.env.DB_CONNECTION_LIMIT || 10),
            queueLimit: 0,
        })
    }

    return pool
}

module.exports = {
    execute: async (sql, params) => {
        return getPool().execute(sql, params)
    },
    query: async (sql, params) => {
        return getPool().query(sql, params)
    },
}
