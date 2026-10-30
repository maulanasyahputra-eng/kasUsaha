const mysql = require("mysql2/promise");
require("dotenv").config();

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,

    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

async function testDatabase() {
    let connection;

    try {
        connection = await pool.getConnection();

        await connection.query("SELECT 1");

        console.log("MySQL connected successfully");

        return true;

    } catch (error) {

        console.error("MySQL connection failed:");
        console.error(error.message);

        return false;

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