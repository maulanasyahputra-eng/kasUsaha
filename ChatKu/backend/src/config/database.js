const mysql = require("mysql2/promise");

const pool = mysql.createPool({
    host: process.env.DB_HOST || "localhost",
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "chatku",

    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,

    charset: "utf8mb4"
});

async function testDatabase() {
    let connection;

    try {
        connection = await pool.getConnection();

        await connection.query("SELECT 1");

        console.log("Database: CONNECTED");

    } catch (error) {
        console.error("Database: FAILED");
        console.error(error.message);

        throw error;

    } finally {
        if (connection) {
            connection.release();
        }
    }
}

module.exports = {
    pool,
    testDatabase
};