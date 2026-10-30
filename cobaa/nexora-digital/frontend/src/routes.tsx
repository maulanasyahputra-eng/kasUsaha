import { Route, Routes } from "react-router-dom";
import { Navbar } from "./components/Navbar";
import { Footer } from "./components/Footer";
import LandingPage from "./pages/LandingPage";
import CatalogPage from "./pages/CatalogPage";
import ProductDetailPage from "./pages/ProductDetailPage";
import CheckoutPage from "./pages/CheckoutPage";
import PaymentStatusPage from "./pages/PaymentStatusPage";
import TrackOrderPage from "./pages/TrackOrderPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import DashboardPage from "./pages/DashboardPage";
import WalletPage from "./pages/WalletPage";
import ProfilePage from "./pages/ProfilePage";
import HelpPage from "./pages/HelpPage";
import AdminRedirect from "./pages/AdminRedirect";
import NotFoundPage from "./pages/NotFoundPage";
import AdminLayout from "./pages/admin/AdminLayout";
import AdminOverview from "./pages/admin/AdminOverview";
import AdminOrders from "./pages/admin/AdminOrders";
import AdminProducts from "./pages/admin/AdminProducts";
import AdminCategories from "./pages/admin/AdminCategories";
import AdminProviders from "./pages/admin/AdminProviders";
import AdminProviderIntegration from "./pages/admin/AdminProviderIntegration";
import AdminPayments from "./pages/admin/AdminPayments";
import AdminDeposits from "./pages/admin/AdminDeposits";
import AdminCustomers from "./pages/admin/AdminCustomers";
import AdminCoupons from "./pages/admin/AdminCoupons";
import AdminRefunds from "./pages/admin/AdminRefunds";
import AdminReports from "./pages/admin/AdminReports";
import AdminSettings from "./pages/admin/AdminSettings";
import AdminAudit from "./pages/admin/AdminAudit";

export function AppRoutes() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/kategori" element={<CatalogPage />} />
          <Route path="/kategori/:slug" element={<CatalogPage />} />
          <Route path="/produk/:slug" element={<ProductDetailPage />} />
          <Route path="/checkout/:orderId" element={<CheckoutPage />} />
          <Route path="/order/:orderId/status" element={<PaymentStatusPage />} />
          <Route path="/cek-pesanan" element={<TrackOrderPage />} />
          <Route path="/bantuan" element={<HelpPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/daftar" element={<RegisterPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/dashboard/saldo" element={<WalletPage />} />
          <Route path="/dashboard/profil" element={<ProfilePage />} />
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminOverview />} />
            <Route path="orders" element={<AdminOrders />} />
            <Route path="products" element={<AdminProducts />} />
            <Route path="categories" element={<AdminCategories />} />
            <Route path="providers" element={<AdminProviderIntegration />} />
            <Route path="providers-classic" element={<AdminProviders />} />
            <Route path="payments" element={<AdminPayments />} />
            <Route path="deposits" element={<AdminDeposits />} />
            <Route path="customers" element={<AdminCustomers />} />
            <Route path="coupons" element={<AdminCoupons />} />
            <Route path="refunds" element={<AdminRefunds />} />
            <Route path="reports" element={<AdminReports />} />
            <Route path="settings" element={<AdminSettings />} />
            <Route path="audit" element={<AdminAudit />} />
          </Route>
          <Route path="/admin/panel" element={<AdminRedirect />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}
