import { Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import HomePage from './pages/HomePage';
import ProductPage from './pages/ProductPage';
import CheckoutPage from './pages/CheckoutPage';
import OrderDetailsPage from './pages/OrderDetailsPage';
import UserPage from './pages/UserPage';
import AdminPage from './pages/AdminPage';
import OrdersPage from './pages/OrdersPage';
import { Protected, AdminOnly } from './components/Protected';
import { Layout } from './components/Layout';

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/"
        element={
          <Protected>
            <Layout>
              <HomePage />
            </Layout>
          </Protected>
        }
      />
      <Route
        path="/products/:id"
        element={
          <Protected>
            <Layout>
              <ProductPage />
            </Layout>
          </Protected>
        }
      />
      <Route
        path="/checkout"
        element={
          <Protected>
            <Layout>
              <CheckoutPage />
            </Layout>
          </Protected>
        }
      />
      <Route
        path="/orders"
        element={
          <Protected>
            <Layout>
              <OrdersPage />
            </Layout>
          </Protected>
        }
      />
      <Route
        path="/orders/:id"
        element={
          <Protected>
            <Layout>
              <OrderDetailsPage />
            </Layout>
          </Protected>
        }
      />
      <Route
        path="/me"
        element={
          <Protected>
            <Layout>
              <UserPage />
            </Layout>
          </Protected>
        }
      />
      <Route
        path="/admin"
        element={
          <AdminOnly>
            <Layout>
              <AdminPage />
            </Layout>
          </AdminOnly>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
