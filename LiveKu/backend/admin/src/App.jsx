import {
    useEffect,
    useState
} from "react";

import {
    getHealth,
    getAdminDashboard,
    getAdminUsers,
    getAdminDeposits,
    getAdminWithdraws,
    approveWithdraw,
    rejectWithdraw
} from "./services/api";

import "./App.css";


function App() {

    const [backend, setBackend] =
        useState("Checking...");

    const [database, setDatabase] =
        useState("Checking...");


    const [activePage, setActivePage] =
        useState("dashboard");


    const [dashboard, setDashboard] =
        useState(null);

    const [users, setUsers] =
        useState([]);

    const [deposits, setDeposits] =
        useState([]);

    const [withdraws, setWithdraws] =
        useState([]);


    const [loading, setLoading] =
        useState(false);

    const [message, setMessage] =
        useState("");


    // ========================================
    // HEALTH
    // ========================================

    useEffect(() => {

        loadHealth();

    }, []);


    async function loadHealth() {

        try {

            const data =
                await getHealth();

            setBackend(
                "LiveKu backend is running"
            );

            setDatabase(
                data.database === "connected"
                    ? "connected"
                    : "disconnected"
            );

        } catch (error) {

            console.error(error);

            setBackend(
                "Backend tidak terhubung"
            );

            setDatabase(
                "disconnected"
            );

        }

    }


    // ========================================
    // LOAD DASHBOARD
    // ========================================

    async function loadDashboard() {

        try {

            setLoading(true);

            const data =
                await getAdminDashboard();

            setDashboard(
                data.statistics
            );

        } catch (error) {

            setMessage(
                error.message
            );

        } finally {

            setLoading(false);
        }

    }


    // ========================================
    // LOAD USERS
    // ========================================

    async function loadUsers() {

        try {

            setLoading(true);

            const data =
                await getAdminUsers();

            setUsers(
                data.users || []
            );

        } catch (error) {

            setMessage(
                error.message
            );

        } finally {

            setLoading(false);
        }

    }


    // ========================================
    // LOAD DEPOSITS
    // ========================================

    async function loadDeposits() {

        try {

            setLoading(true);

            const data =
                await getAdminDeposits();

            setDeposits(
                data.deposits || []
            );

        } catch (error) {

            setMessage(
                error.message
            );

        } finally {

            setLoading(false);
        }

    }


    // ========================================
    // LOAD WITHDRAWS
    // ========================================

    async function loadWithdraws() {

        try {

            setLoading(true);

            const data =
                await getAdminWithdraws();

            setWithdraws(
                data.withdraws || []
            );

        } catch (error) {

            setMessage(
                error.message
            );

        } finally {

            setLoading(false);
        }

    }


    // ========================================
    // PAGE CHANGE
    // ========================================

    function changePage(page) {

        setActivePage(page);

        setMessage("");


        if (page === "dashboard") {

            loadDashboard();

        }


        if (page === "users") {

            loadUsers();

        }


        if (page === "deposits") {

            loadDeposits();

        }


        if (page === "withdraws") {

            loadWithdraws();

        }

    }


    // ========================================
    // INITIAL DASHBOARD
    // ========================================

    useEffect(() => {

        loadDashboard();

    }, []);


    // ========================================
    // APPROVE
    // ========================================

    async function handleApprove(
        id
    ) {

        if (
            !window.confirm(
                "Setujui withdraw ini?"
            )
        ) {

            return;
        }


        try {

            setLoading(true);

            const data =
                await approveWithdraw(id);

            setMessage(
                data.message
            );

            await loadWithdraws();

        } catch (error) {

            setMessage(
                error.message
            );

        } finally {

            setLoading(false);
        }

    }


    // ========================================
    // REJECT
    // ========================================

    async function handleReject(
        id
    ) {

        if (
            !window.confirm(
                "Tolak withdraw ini?"
            )
        ) {

            return;
        }


        try {

            setLoading(true);

            const data =
                await rejectWithdraw(id);

            setMessage(
                data.message
            );

            await loadWithdraws();

        } catch (error) {

            setMessage(
                error.message
            );

        } finally {

            setLoading(false);
        }

    }


    // ========================================
    // FORMAT RUPIAH
    // ========================================

    function rupiah(value) {

        return (
            "Rp " +
            Number(
                value || 0
            ).toLocaleString(
                "id-ID"
            )
        );

    }


    // ========================================
    // FORMAT NUMBER
    // ========================================

    function number(value) {

        return Number(
            value || 0
        ).toLocaleString(
            "id-ID"
        );

    }


    // ========================================
    // STATUS
    // ========================================

    function statusClass(
        status
    ) {

        if (
            status === "settlement" ||
            status === "approved"
        ) {

            return "status success";

        }


        if (
            status === "pending"
        ) {

            return "status pending";

        }


        if (
            status === "rejected" ||
            status === "cancel" ||
            status === "deny"
        ) {

            return "status danger";

        }


        return "status";

    }


    // ========================================
    // DASHBOARD
    // ========================================

    function Dashboard() {

        return (

            <>

                <div className="page-title">

                    <div>

                        <h1>
                            Dashboard
                        </h1>

                        <p>
                            Ringkasan sistem LiveKu
                        </p>

                    </div>

                    <button
                        className="refresh-button"
                        onClick={
                            loadDashboard
                        }
                    >
                        Refresh
                    </button>

                </div>


                <div className="stats-grid">

                    <div className="stat-card">

                        <span>
                            Total User
                        </span>

                        <strong>
                            {number(
                                dashboard?.users
                            )}
                        </strong>

                        <small>
                            Pengguna terdaftar
                        </small>

                    </div>


                    <div className="stat-card">

                        <span>
                            Total Coin
                        </span>

                        <strong>
                            {number(
                                dashboard?.coins
                            )}
                        </strong>

                        <small>
                            Coin beredar
                        </small>

                    </div>


                    <div className="stat-card">

                        <span>
                            Saldo User
                        </span>

                        <strong>
                            {rupiah(
                                dashboard?.balance
                            )}
                        </strong>

                        <small>
                            Total saldo
                        </small>

                    </div>


                    <div className="stat-card">

                        <span>
                            Deposit Berhasil
                        </span>

                        <strong>
                            {number(
                                dashboard?.deposits
                            )}
                        </strong>

                        <small>
                            Transaksi berhasil
                        </small>

                    </div>

                </div>


                <div className="stats-grid">

                    <div className="stat-card">

                        <span>
                            Total Deposit
                        </span>

                        <strong>
                            {rupiah(
                                dashboard?.deposit_amount
                            )}
                        </strong>

                        <small>
                            Nominal deposit
                        </small>

                    </div>


                    <div className="stat-card warning-card">

                        <span>
                            Pending Withdraw
                        </span>

                        <strong>
                            {number(
                                dashboard?.pending_withdraws
                            )}
                        </strong>

                        <small>
                            Menunggu diproses
                        </small>

                    </div>


                    <div className="stat-card warning-card">

                        <span>
                            Nominal Withdraw
                        </span>

                        <strong>
                            {rupiah(
                                dashboard?.pending_withdraw_amount
                            )}
                        </strong>

                        <small>
                            Menunggu persetujuan
                        </small>

                    </div>


                    <div className="stat-card">

                        <span>
                            System
                        </span>

                        <strong>
                            Online
                        </strong>

                        <small>
                            LiveKu aktif
                        </small>

                    </div>

                </div>


                <div className="panel">

                    <div className="panel-header">

                        <div>

                            <h2>
                                System Status
                            </h2>

                            <p>
                                Status layanan LiveKu
                            </p>

                        </div>

                    </div>


                    <div className="system-grid">

                        <div className="system-item">

                            <span>
                                Backend
                            </span>

                            <strong>
                                {backend}
                            </strong>

                            <i className="online-dot">
                            </i>

                        </div>


                        <div className="system-item">

                            <span>
                                Database
                            </span>

                            <strong>
                                {database}
                            </strong>

                            <i className="online-dot">
                            </i>

                        </div>


                        <div className="system-item">

                            <span>
                                Server
                            </span>

                            <strong>
                                Port {5000}
                            </strong>

                            <i className="online-dot">
                            </i>

                        </div>

                    </div>

                </div>

            </>

        );

    }


    // ========================================
    // USERS
    // ========================================

    function Users() {

        return (

            <div className="panel">

                <div className="panel-header">

                    <div>

                        <h2>
                            Daftar User
                        </h2>

                        <p>
                            Semua pengguna LiveKu
                        </p>

                    </div>


                    <button
                        className="refresh-button"
                        onClick={loadUsers}
                    >
                        Refresh
                    </button>

                </div>


                <div className="table-wrapper">

                    <table>

                        <thead>

                            <tr>

                                <th>
                                    ID
                                </th>

                                <th>
                                    Username
                                </th>

                                <th>
                                    Email
                                </th>

                                <th>
                                    Coin
                                </th>

                                <th>
                                    Saldo
                                </th>

                                <th>
                                    Terdaftar
                                </th>

                            </tr>

                        </thead>


                        <tbody>

                            {users.length === 0 ? (

                                <tr>

                                    <td
                                        colSpan="6"
                                        className="empty"
                                    >
                                        Belum ada user
                                    </td>

                                </tr>

                            ) : (

                                users.map(
                                    user => (

                                        <tr
                                            key={
                                                user.id
                                            }
                                        >

                                            <td>
                                                #
                                                {user.id}
                                            </td>

                                            <td>
                                                <strong>
                                                    {
                                                        user.username
                                                    }
                                                </strong>
                                            </td>

                                            <td>
                                                {
                                                    user.email
                                                }
                                            </td>

                                            <td>
                                                {number(
                                                    user.coin_balance
                                                )}
                                            </td>

                                            <td>
                                                {rupiah(
                                                    user.cash_balance
                                                )}
                                            </td>

                                            <td>
                                                {
                                                    user.created_at
                                                        ? new Date(
                                                            user.created_at
                                                        ).toLocaleString(
                                                            "id-ID"
                                                        )
                                                        : "-"
                                                }
                                            </td>

                                        </tr>

                                    )
                                )

                            )}

                        </tbody>

                    </table>

                </div>

            </div>

        );

    }


    // ========================================
    // DEPOSITS
    // ========================================

    function Deposits() {

        return (

            <div className="panel">

                <div className="panel-header">

                    <div>

                        <h2>
                            Deposit
                        </h2>

                        <p>
                            Riwayat pembayaran pengguna
                        </p>

                    </div>


                    <button
                        className="refresh-button"
                        onClick={
                            loadDeposits
                        }
                    >
                        Refresh
                    </button>

                </div>


                <div className="table-wrapper">

                    <table>

                        <thead>

                            <tr>

                                <th>
                                    Order ID
                                </th>

                                <th>
                                    User
                                </th>

                                <th>
                                    Nominal
                                </th>

                                <th>
                                    Coin
                                </th>

                                <th>
                                    Payment
                                </th>

                                <th>
                                    Status
                                </th>

                                <th>
                                    Tanggal
                                </th>

                            </tr>

                        </thead>


                        <tbody>

                            {deposits.length === 0 ? (

                                <tr>

                                    <td
                                        colSpan="7"
                                        className="empty"
                                    >
                                        Belum ada deposit
                                    </td>

                                </tr>

                            ) : (

                                deposits.map(
                                    deposit => (

                                        <tr
                                            key={
                                                deposit.id
                                            }
                                        >

                                            <td>
                                                {
                                                    deposit.order_id
                                                }
                                            </td>

                                            <td>

                                                <strong>
                                                    {
                                                        deposit.username
                                                    }
                                                </strong>

                                                <small>
                                                    {
                                                        deposit.email
                                                    }
                                                </small>

                                            </td>

                                            <td>
                                                {rupiah(
                                                    deposit.amount
                                                )}
                                            </td>

                                            <td>
                                                {number(
                                                    deposit.coin_amount
                                                )}
                                            </td>

                                            <td>
                                                {
                                                    deposit.payment_type ||
                                                    "-"
                                                }
                                            </td>

                                            <td>

                                                <span
                                                    className={
                                                        statusClass(
                                                            deposit.transaction_status
                                                        )
                                                    }
                                                >
                                                    {
                                                        deposit.transaction_status
                                                    }
                                                </span>

                                            </td>

                                            <td>
                                                {
                                                    deposit.created_at
                                                        ? new Date(
                                                            deposit.created_at
                                                        ).toLocaleString(
                                                            "id-ID"
                                                        )
                                                        : "-"
                                                }
                                            </td>

                                        </tr>

                                    )
                                )

                            )}

                        </tbody>

                    </table>

                </div>

            </div>

        );

    }


    // ========================================
    // WITHDRAWS
    // ========================================

    function Withdraws() {

        return (

            <div className="panel">

                <div className="panel-header">

                    <div>

                        <h2>
                            Withdraw
                        </h2>

                        <p>
                            Kelola permintaan penarikan saldo
                        </p>

                    </div>


                    <button
                        className="refresh-button"
                        onClick={
                            loadWithdraws
                        }
                    >
                        Refresh
                    </button>

                </div>


                <div className="table-wrapper">

                    <table>

                        <thead>

                            <tr>

                                <th>
                                    User
                                </th>

                                <th>
                                    Nominal
                                </th>

                                <th>
                                    Bank
                                </th>

                                <th>
                                    Rekening
                                </th>

                                <th>
                                    Nama
                                </th>

                                <th>
                                    Status
                                </th>

                                <th>
                                    Aksi
                                </th>

                            </tr>

                        </thead>


                        <tbody>

                            {withdraws.length === 0 ? (

                                <tr>

                                    <td
                                        colSpan="7"
                                        className="empty"
                                    >
                                        Belum ada withdraw
                                    </td>

                                </tr>

                            ) : (

                                withdraws.map(
                                    withdraw => (

                                        <tr
                                            key={
                                                withdraw.id
                                            }
                                        >

                                            <td>

                                                <strong>
                                                    {
                                                        withdraw.username
                                                    }
                                                </strong>

                                                <small>
                                                    {
                                                        withdraw.email
                                                    }
                                                </small>

                                            </td>

                                            <td>
                                                {rupiah(
                                                    withdraw.amount
                                                )}
                                            </td>

                                            <td>
                                                {
                                                    withdraw.bank_name
                                                }
                                            </td>

                                            <td>
                                                {
                                                    withdraw.account_number
                                                }
                                            </td>

                                            <td>
                                                {
                                                    withdraw.account_name
                                                }
                                            </td>

                                            <td>

                                                <span
                                                    className={
                                                        statusClass(
                                                            withdraw.status
                                                        )
                                                    }
                                                >
                                                    {
                                                        withdraw.status
                                                    }
                                                </span>

                                            </td>

                                            <td>

                                                {withdraw.status ===
                                                "pending" ? (

                                                    <div className="action-buttons">

                                                        <button
                                                            className="approve-button"
                                                            disabled={
                                                                loading
                                                            }
                                                            onClick={() =>
                                                                handleApprove(
                                                                    withdraw.id
                                                                )
                                                            }
                                                        >
                                                            Approve
                                                        </button>


                                                        <button
                                                            className="reject-button"
                                                            disabled={
                                                                loading
                                                            }
                                                            onClick={() =>
                                                                handleReject(
                                                                    withdraw.id
                                                                )
                                                            }
                                                        >
                                                            Reject
                                                        </button>

                                                    </div>

                                                ) : (

                                                    <span>
                                                        -
                                                    </span>

                                                )}

                                            </td>

                                        </tr>

                                    )
                                )

                            )}

                        </tbody>

                    </table>

                </div>

            </div>

        );

    }


    // ========================================
    // APP
    // ========================================

    return (

        <div className="admin-layout">


            {/* SIDEBAR */}

            <aside className="sidebar">

                <div className="logo">

                    <div className="logo-icon">
                        LK
                    </div>

                    <div>

                        <strong>
                            LiveKu
                        </strong>

                        <span>
                            Admin Panel
                        </span>

                    </div>

                </div>


                <nav>

                    <button
                        className={
                            activePage ===
                            "dashboard"
                                ? "nav-item active"
                                : "nav-item"
                        }
                        onClick={() =>
                            changePage(
                                "dashboard"
                            )
                        }
                    >
                        <span>
                            📊
                        </span>

                        Dashboard
                    </button>


                    <button
                        className={
                            activePage ===
                            "users"
                                ? "nav-item active"
                                : "nav-item"
                        }
                        onClick={() =>
                            changePage(
                                "users"
                            )
                        }
                    >
                        <span>
                            👥
                        </span>

                        Users
                    </button>


                    <button
                        className={
                            activePage ===
                            "deposits"
                                ? "nav-item active"
                                : "nav-item"
                        }
                        onClick={() =>
                            changePage(
                                "deposits"
                            )
                        }
                    >
                        <span>
                            💰
                        </span>

                        Deposit
                    </button>


                    <button
                        className={
                            activePage ===
                            "withdraws"
                                ? "nav-item active"
                                : "nav-item"
                        }
                        onClick={() =>
                            changePage(
                                "withdraws"
                            )
                        }
                    >
                        <span>
                            💸
                        </span>

                        Withdraw
                    </button>

                </nav>


                <div className="sidebar-bottom">

                    <div className="admin-status">

                        <i className="online-dot">
                        </i>

                        <div>

                            <strong>
                                System Online
                            </strong>

                            <span>
                                LiveKu Server
                            </span>

                        </div>

                    </div>

                </div>

            </aside>


            {/* MAIN */}

            <main className="main-content">


                <header className="topbar">

                    <div>

                        <span>
                            LiveKu
                        </span>

                        <strong>
                            Admin Dashboard
                        </strong>

                    </div>


                    <div className="topbar-right">

                        <span className="live-badge">
                            ● LIVE
                        </span>

                        <div className="admin-avatar">
                            A
                        </div>

                    </div>

                </header>


                <section className="content">

                    {message && (

                        <div className="alert">

                            {message}

                            <button
                                onClick={() =>
                                    setMessage("")
                                }
                            >
                                ×
                            </button>

                        </div>

                    )}


                    {loading && (

                        <div className="loading-bar">
                            Memuat data...
                        </div>

                    )}


                    {activePage ===
                        "dashboard" && (
                        <Dashboard />
                    )}


                    {activePage ===
                        "users" && (
                        <Users />
                    )}


                    {activePage ===
                        "deposits" && (
                        <Deposits />
                    )}


                    {activePage ===
                        "withdraws" && (
                        <Withdraws />
                    )}

                </section>

            </main>

        </div>

    );

}

export default App;