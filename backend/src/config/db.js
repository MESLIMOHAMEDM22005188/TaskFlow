require("dotenv").config();
const mysql = require("mysql2/promise");

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    port: 3306,
    connectionLimit: 8,     // ✅ max 3 connexions simultanées
    waitForConnections: true, // ✅ attend au lieu de crash
    queueLimit: 0             // ✅ file d'attente illimitée
});

module.exports = pool;