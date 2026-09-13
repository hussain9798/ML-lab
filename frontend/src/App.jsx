import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';

// Public & Student Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import Dashboard from './pages/Dashboard';
import AlgorithmCatalog from './pages/AlgorithmCatalog';
import Documentation from './pages/Documentation';
import Laboratory from './pages/Laboratory';
import Experiments from './pages/Experiments';
import SavedCode from './pages/SavedCode';
import Datasets from './pages/Datasets';
import Profile from './pages/Profile';

// Admin Pages
import AdminDashboard from './admin/AdminDashboard';
import AdminAlgorithms from './admin/AdminAlgorithms';
import AdminDocumentation from './admin/AdminDocumentation';
import AdminUsers from './admin/AdminUsers';

function App() {
  return (
    <div className="flex flex-col min-h-screen bg-dark-950 text-slate-100 font-sans">
      <Navbar />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/algorithms" element={<AlgorithmCatalog />} />
          <Route path="/docs/:slug" element={<Documentation />} />
          <Route path="/docs" element={<Navigate to="/docs/linear-regression" replace />} />
          <Route path="/lab/:slug" element={<ProtectedRoute><Laboratory /></ProtectedRoute>} />
          <Route path="/lab" element={<Navigate to="/lab/linear-regression" replace />} />
          <Route path="/datasets" element={<Datasets />} />

          {/* Student Protected Routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/experiments"
            element={
              <ProtectedRoute>
                <Experiments />
              </ProtectedRoute>
            }
          />
          <Route
            path="/saved-code"
            element={
              <ProtectedRoute>
                <SavedCode />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />

          {/* Admin Protected Routes */}
          <Route
            path="/admin"
            element={<Navigate to="/admin/dashboard" replace />}
          />
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute adminOnly={true}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/algorithms"
            element={
              <ProtectedRoute adminOnly={true}>
                <AdminAlgorithms />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/documentation"
            element={
              <ProtectedRoute adminOnly={true}>
                <AdminDocumentation />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <ProtectedRoute adminOnly={true}>
                <AdminUsers />
              </ProtectedRoute>
            }
          />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}

export default App;
