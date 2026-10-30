```javascript
const express = require("express");
const router = express.Router();

const db = require("../config/database");

// =====================================================
// GET LIVE ROOMS
// GET /api/live
// =====================================================

router.get("/", async (req, res) => {

    try {

        const [rows] = await db.query(`
            SELECT
                lr.id,
                lr.host_id,
                lr.title,
                lr.status,
                lr.viewer_count,
                lr.started_at,
                lr.ended_at,
                u.username
            FROM live_rooms lr
            INNER JOIN users u
                ON u.id = lr.host_id
            WHERE lr.status = 'LIVE'
            ORDER BY lr.started_at DESC
        `);

        return res.json({
            success: true,
            data: rows
        });

    } catch (error) {

        console.error("GET LIVE ROOMS ERROR:", error);

        return res.status(500).json({
            success: false,
            message: "Gagal mengambil daftar live",
            error: error.message
        });

    }

});


// =====================================================
// GET DETAIL LIVE ROOM
// GET /api/live/:id
// =====================================================

router.get("/:id", async (req, res) => {

    try {

        const liveId = Number(req.params.id);

        if (!liveId) {

            return res.status(400).json({
                success: false,
                message: "ID live tidak valid"
            });

        }

        const [rows] = await db.query(`
            SELECT
                lr.id,
                lr.host_id,
                lr.title,
                lr.status,
                lr.viewer_count,
                lr.started_at,
                lr.ended_at,
                u.username
            FROM live_rooms lr
            INNER JOIN users u
                ON u.id = lr.host_id
            WHERE lr.id = ?
            LIMIT 1
        `, [liveId]);

        if (rows.length === 0) {

            return res.status(404).json({
                success: false,
                message: "Live room tidak ditemukan"
            });

        }

        return res.json({
            success: true,
            data: rows[0]
        });

    } catch (error) {

        console.error("GET LIVE DETAIL ERROR:", error);

        return res.status(500).json({
            success: false,
            message: "Gagal mengambil live room",
            error: error.message
        });

    }

});


module.exports = router;
```
