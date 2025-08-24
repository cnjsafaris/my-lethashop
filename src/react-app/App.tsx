import { BrowserRouter as Router, Routes, Route } from "react-router";
import { AuthProvider } from "@getmocha/users-service/react";
import HomePage from "@/react-app/pages/Home";
import ProductsPage from "@/react-app/pages/Products";
import ProductPage from "@/react-app/pages/Product";
import CartPage from "@/react-app/pages/Cart";
import CheckoutPage from "@/react-app/pages/Checkout";
import AuthPage from "@/react-app/pages/Auth";
import AuthCallbackPage from "@/react-app/pages/AuthCallback";
import AdminPage from "@/react-app/pages/Admin";
import Layout from "@/react-app/components/Layout";

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/products" element={<ProductsPage />} />
            <Route path="/products/:slug" element={<ProductPage />} />
            <Route path="/cart" element={<CartPage />} />
            <Route path="/checkout" element={<CheckoutPage />} />
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/admin" element={<AdminPage />} />
            <Route path="/auth/callback" element={<AuthCallbackPage />} />
          </Routes>
        </Layout>
      </Router>
    </AuthProvider>
  );
}
