require("dotenv").config();

const mysql = require("mysql2/promise");

let connectionPool = null;

/**
 * Builds the database configuration.
 * Supports DATABASE_URL and individual environment variables.
 *
 * @returns {Object}
 */

function getDatabaseConfig() {

    if (process.env.DATABASE_URL) {

        const databaseUrl = new URL(process.env.DATABASE_URL)

        return {
            host: databaseUrl.hostname,
            port: Number(databaseUrl.port || 3306),
            user: decodeURIComponent(databaseUrl.username),
            password: decodeURIComponent(databaseUrl.password),
            database: databaseUrl.pathname.replace(/^\//, ""),
        };
    }

    return {
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASS,
        database: process.env.DB_NAME,
        port: Number(process.env.DB_PORT || 3306),
    }
}
/**
 * Returns the singleton MySQL connection pool.
 *
 * @returns {Pool}
 */

function getConnectionPool() {
    if (!connectionPool) {
        connectionPool = mysql.createPool({

            ...getDatabaseConfig(),

            waitForConnections: true,
            connectionLimit: Number(process.env.DB_CONNECTION_LIMIT || 10),
            queueLimit: 0,
        })
    }

    return connectionPool
}

module.exports = {

    /**
     * Executes a prepared SQL statement.
     *
     * @param {string} sql
     * @param {Array} params
     * @returns {Promise<Array>}
     */
    async execute(sql, params = []) {
        return getConnectionPool().execute(sql, params);
    },

    /**
     * Executes a standard SQL query.
     *
     * @param {string} sql
     * @param {Array} params
     * @returns {Promise<Array>}
     */
    async query(sql, params = []) {
        return getConnectionPool().query(sql, params);
    },

};