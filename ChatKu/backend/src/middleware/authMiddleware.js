const {
    verifyAccessToken
} = require("../services/jwtService");

function authMiddleware(req, res, next) {

    try {

        const authorization =
            req.headers.authorization;

        if (!authorization) {

            return res.status(401).json({
                success: false,
                message:
                    "Authorization header diperlukan"
            });

        }

        if (
            !authorization.startsWith("Bearer ")
        ) {

            return res.status(401).json({
                success: false,
                message:
                    "Format token tidak valid"
            });

        }

        const token =
            authorization.substring(7).trim();

        if (!token) {

            return res.status(401).json({
                success: false,
                message:
                    "Token tidak ditemukan"
            });

        }

        const decoded =
            verifyAccessToken(token);

        req.user = decoded;

        next();

    } catch (error) {

        console.error(
            "AUTH MIDDLEWARE:",
            error.message
        );

        return res.status(401).json({
            success: false,
            message:
                "Token tidak valid atau sudah kedaluwarsa"
        });

    }
}

module.exports = authMiddleware;