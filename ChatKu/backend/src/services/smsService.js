async function sendSms(phone, message) {
    const provider =
        process.env.SMS_PROVIDER || "console";

    /*
     * DEVELOPMENT
     *
     * OTP hanya ditampilkan di backend.
     * Nanti production diganti dengan provider SMS.
     */

    if (provider === "console") {
        console.log("");
        console.log("================================");
        console.log("          CHATKU SMS");
        console.log("================================");
        console.log("To      :", phone);
        console.log("Message :", message);
        console.log("================================");
        console.log("");

        return {
            success: true,
            provider: "console"
        };
    }

    /*
     * Provider SMS production akan dipasang
     * di sini setelah credential provider
     * tersedia.
     */

    throw new Error(
        `SMS provider "${provider}" belum dikonfigurasi`
    );
}

module.exports = {
    sendSms
};