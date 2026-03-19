require("dotenv").config();
const mysql = require("mysql2/promise");

let connection = null;

async function getConnection() {
    if (connection) {
        try {
            await connection.ping()
            return connection
        } catch {
            connection = null
        }
    }
    connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASS,
        database: process.env.DB_NAME,
        port: 3306,
    })
    return connection
}

module.exports = {
    execute: async (sql, params) => {
        const conn = await getConnection()
        return conn.execute(sql, params)
    }
}