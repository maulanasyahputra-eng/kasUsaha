const jwt = require("jsonwebtoken");


// ========================================
// AUTH MIDDLEWARE
// ========================================

function authMiddleware(req, res, next) {

    try {

        const authHeader =
            req.headers.authorization;


        if (!authHeader) {

            return res.status(401).json({
                success: false,
                message: "Token tidak ditemukan"
            });

        }


        if (
            !authHeader.startsWith("Bearer ")
        ) {

            return res.status(401).json({
                success: false,
                message:
                    "Format Authorization tidak valid"
            });

        }


        const token =
            authHeader.substring(7);


        if (!token) {

            return res.status(401).json({
                success: false,
                message: "Token kosong"
            });

        }


        const decoded =
            jwt.verify(
                token,
                process.env.JWT_SECRET
            );


        req.user = decoded;


        next();


    } catch (error) {

        console.error(
            "Auth middleware error:",
            error.message
        );


        return res.status(401).json({
            success: false,
            message: "Token tidak valid"
        });

    }

}


module.exports =
    authMiddleware;