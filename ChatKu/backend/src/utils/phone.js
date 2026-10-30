function normalizePhone(phone) {
    if (!phone) {
        return null;
    }

    let value = String(phone)
        .trim()
        .replace(/\s+/g, "")
        .replace(/-/g, "");

    if (value.startsWith("+62")) {
        return value;
    }

    if (value.startsWith("62")) {
        return "+" + value;
    }

    if (value.startsWith("0")) {
        return "+62" + value.substring(1);
    }

    return value;
}

function isValidPhone(phone) {
    return /^\+62[0-9]{9,13}$/.test(phone);
}

module.exports = {
    normalizePhone,
    isValidPhone
};