const API_URL = "http://localhost:5000";


// ========================================
// REQUEST HELPER
// ========================================

async function request(
    endpoint,
    options = {}
) {

    const response = await fetch(
        `${API_URL}${endpoint}`,
        {
            ...options,

            headers: {
                "Content-Type":
                    "application/json",

                ...(options.headers || {})
            }
        }
    );


    let data;

    try {

        data = await response.json();

    } catch {

        throw new Error(
            "Response server tidak valid"
        );

    }


    if (!response.ok) {

        throw new Error(
            data.message ||
            "Terjadi kesalahan pada server"
        );

    }


    return data;
}


// ========================================
// HEALTH
// ========================================

export async function getHealth() {

    return request(
        "/api/health"
    );

}


// ========================================
// AUTH
// ========================================

export async function registerUser(
    username,
    email,
    password
) {

    return request(
        "/api/auth/register",
        {
            method: "POST",

            body: JSON.stringify({
                username,
                email,
                password
            })
        }
    );

}


export async function loginUser(
    email,
    password
) {

    return request(
        "/api/auth/login",
        {
            method: "POST",

            body: JSON.stringify({
                email,
                password
            })
        }
    );

}


// ========================================
// WALLET
// ========================================

export async function getWallet(
    token
) {

    return request(
        "/api/wallet",
        {
            headers: {
                Authorization:
                    `Bearer ${token}`
            }
        }
    );

}


export async function getWalletTransactions(
    token
) {

    return request(
        "/api/wallet/transactions",
        {
            headers: {
                Authorization:
                    `Bearer ${token}`
            }
        }
    );

}


export async function developmentTopup(
    token,
    amount
) {

    return request(
        "/api/wallet/development-topup",
        {
            method: "POST",

            headers: {
                Authorization:
                    `Bearer ${token}`
            },

            body: JSON.stringify({
                amount
            })
        }
    );

}


// ========================================
// PAYMENT / MIDTRANS
// ========================================

export async function createPayment(
    token,
    amount
) {

    return request(
        "/api/payments/create",
        {
            method: "POST",

            headers: {
                Authorization:
                    `Bearer ${token}`
            },

            body: JSON.stringify({
                amount
            })
        }
    );

}


export async function getPayments(
    token
) {

    return request(
        "/api/payments",
        {
            headers: {
                Authorization:
                    `Bearer ${token}`
            }
        }
    );

}


// ========================================
// ADMIN
// ========================================

export async function getAdminDashboard() {

    return request(
        "/api/admin/dashboard"
    );

}


export async function getAdminUsers() {

    return request(
        "/api/admin/users"
    );

}


export async function getAdminDeposits() {

    return request(
        "/api/admin/deposits"
    );

}


export async function getAdminWithdraws() {

    return request(
        "/api/admin/withdraws"
    );

}


export async function approveWithdraw(
    id
) {

    return request(
        `/api/admin/withdraws/${id}/approve`,
        {
            method: "POST"
        }
    );

}


export async function rejectWithdraw(
    id
) {

    return request(
        `/api/admin/withdraws/${id}/reject`,
        {
            method: "POST"
        }
    );

}