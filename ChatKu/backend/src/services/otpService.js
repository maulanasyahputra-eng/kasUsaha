const crypto = require("crypto");

const OTP_LENGTH = 6;
const OTP_EXPIRE_MINUTES = 5;

function generateOtp() {
    const min = 10 ** (OTP_LENGTH - 1);
    const max = (10 ** OTP_LENGTH) - 1;

    return String(
        crypto.randomInt(min, max + 1)
    );
}

function hashOtp(otp) {
    return crypto
        .createHash("sha256")
        .update(otp)
        .digest("hex");
}

function getOtpExpiry() {
    return new Date(
        Date.now() +
        OTP_EXPIRE_MINUTES * 60 * 1000
    );
}

function verifyOtpHash(otp, hashedOtp) {
    const hash = hashOtp(otp);

    return crypto.timingSafeEqual(
        Buffer.from(hash),
        Buffer.from(hashedOtp)
    );
}

module.exports = {
    generateOtp,
    hashOtp,
    getOtpExpiry,
    verifyOtpHash,
    OTP_EXPIRE_MINUTES
};