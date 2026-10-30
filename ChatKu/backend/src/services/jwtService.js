const jwt = require("jsonwebtoken");

function generateAccessToken(user) {

    if (!process.env.JWT_SECRET) {
        throw new Error(
            "JWT_SECRET belum dikonfigurasi di .env"
        );
    }

    return jwt.sign(
        {
            user_id: user.id,
            phone: user.phone,
            is_admin: Boolean(user.is_admin)
        },
        process.env.JWT_SECRET,
        {
            expiresIn:
                process.env.JWT_EXPIRES_IN || "30d"
        }
    );
}

function verifyAccessToken(token) {

    if (!token) {
        throw new Error(
            "Token tidak ditemukan"
        );
    }

    if (!process.env.JWT_SECRET) {
        throw new Error(
            "JWT_SECRET belum dikonfigurasi"
        );
    }

    return jwt.verify(
        token,
        process.env.JWT_SECRET
    );
}

module.exports = {
    generateAccessToken,
    verifyAccessToken
};