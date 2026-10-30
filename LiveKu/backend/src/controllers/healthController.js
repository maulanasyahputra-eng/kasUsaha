const { pool } = require("../config/database");

async function healthCheck(req, res) {
    try {
        await pool.query("SELECT 1");

        res.status(200).json({
            success: true,
            message: "LiveKu backend is running",
            database: "connected",
            timestamp: new Date().toISOString()
        });

    } catch (error) {

        console.error("Health check database error:", error.message);

        res.status(500).json({
            success: false,
            message: "LiveKu backend is running",
            database: "disconnected",
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
}

module.exports = {
    healthCheck
};